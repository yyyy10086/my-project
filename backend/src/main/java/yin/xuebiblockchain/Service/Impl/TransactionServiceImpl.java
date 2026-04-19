package yin.xuebiblockchain.Service.Impl;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import yin.xuebiblockchain.Mapper.ResourceMapper;
import yin.xuebiblockchain.Mapper.TransactionMapper;
import yin.xuebiblockchain.Mapper.UserMapper;
import yin.xuebiblockchain.Pojo.Block;
import yin.xuebiblockchain.Pojo.Mempool;
import yin.xuebiblockchain.Pojo.Result;
import yin.xuebiblockchain.Pojo.Transaction;
import yin.xuebiblockchain.Service.TransactionService;
import yin.xuebiblockchain.Utils.ECDSAUtil;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static yin.xuebiblockchain.Pojo.Block.createBlock;
import static yin.xuebiblockchain.Utils.SystemConstants.*;

@Slf4j
@Service
public class TransactionServiceImpl implements TransactionService {

    // 使用 @jakarta.annotation.Resource 注入，不会冲突
    @Resource
    private Mempool mempool;

    @Resource
    private TransactionMapper transactionMapper;

    @Resource
    private ResourceMapper resourceMapper;

    @Resource
    private UserMapper userMapper;

    private final List<Transaction> transactionList =
            Collections.synchronizedList(new ArrayList<>());

    // 常量使用全限定类名避免歧义
    private static final String RES_STATUS_AVAILABLE = yin.xuebiblockchain.Pojo.Resource.STATUS_AVAILABLE;
    private static final String RES_STATUS_PENDING  = yin.xuebiblockchain.Pojo.Resource.STATUS_PENDING;
    private static final String RES_STATUS_LENT     = yin.xuebiblockchain.Pojo.Resource.STATUS_LENT;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Result getTransactionMessage(Transaction transaction) {
        String identifier = transaction.getSenderAddress();
        if (identifier == null || !identifier.equals(transaction.getPublicKey())) {
            return Result.error("senderAddress 与 publicKey 必须一致");
        }
        try {
            String senderAddress = transaction.getSenderAddress();
            String recipientAddress = transaction.getRecipientAddress();
            int amount = (int) transaction.getAmount();
            String timestamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss.SSS")
                    .format(transaction.getTimestamp());
            Transaction.Signature signature = transaction.getSignature();
            String publicKeyHex = transaction.getPublicKey();

            Long resourceId = transaction.getResourceId();
            String resourceName = transaction.getResourceName();
            String recordType = transaction.getRecordType();

            if (senderAddress == null || senderAddress.isEmpty()) {
                return Result.error("借用者地址不能为空");
            }
            if (recipientAddress == null || recipientAddress.isEmpty()) {
                return Result.error("分享者地址不能为空");
            }
            if (!Transaction.TYPE_RETURN.equals(recordType) && amount <= 0) {
                return Result.error("积分数量必须大于0");
            }
            if (resourceId == null) {
                return Result.error("必须关联一个共享资源");
            }
            if (recordType == null || recordType.isEmpty()) {
                return Result.error("必须指定记录类型");
            }

            String message = ECDSAUtil.buildResourceMessage(
                    senderAddress, recipientAddress, amount, timestamp, resourceId, recordType);

            log.info("签名验证 — 消息: {}", message);
            log.info("签名验证 — 公钥: {}", publicKeyHex);

            if (publicKeyHex.startsWith("0x")) {
                publicKeyHex = publicKeyHex.substring(2);
            }

            String signatureR = signature.getR();
            String signatureS = signature.getS();
            if (signatureR.length() != 64 || signatureS.length() != 64) {
                log.error("签名长度错误: R={}, S={}", signatureR.length(), signatureS.length());
                return Result.error("签名格式错误");
            }

            boolean isValid = ECDSAUtil.verifySignature(message, signatureR, signatureS, publicKeyHex);
            if (!isValid) {
                return Result.error("签名验证失败，请确认私钥是否正确");
            }

            log.info("签名验证通过 — 类型: {}, 资源: {}, 积分: {}", recordType, resourceName, amount);

            Result businessResult;
            if (Transaction.TYPE_BORROW_REQUEST.equals(recordType)) {
                businessResult = handleBorrowRequest(resourceId, senderAddress, amount);
            } else if (Transaction.TYPE_CONFIRM_RECEIVED.equals(recordType)) {
                businessResult = handleConfirmReceived(resourceId, senderAddress, recipientAddress, amount);
            } else if (Transaction.TYPE_RETURN.equals(recordType)) {
                businessResult = handleReturn(resourceId);
            } else {
                businessResult = Result.error("未知的记录类型: " + recordType);
            }

            if (businessResult.getCode() != 200) {
                return businessResult;
            }

            transaction.setGasUsed(DEFAULT_GAS_USED);

            synchronized (transactionList) {
                transactionList.add(transaction);
                log.info("交易已加入交易池，当前池大小: {}", transactionList.size());

                String txHash = transaction.calculateHash();
                transactionMapper.saveTransactionRecord(
                        senderAddress, recipientAddress, amount, timestamp,
                        resourceId, resourceName,
                        transaction.getResourceType(), recordType,
                        txHash, null
                );

                if (transactionList.size() >= BLOCK_TRANSACTION_THRESHOLD) {
                    log.info("交易池已满 {} 笔，开始打包区块...", BLOCK_TRANSACTION_THRESHOLD);
                    packBlock();
                }
            }

            return Result.success("操作成功");

        } catch (Exception e) {
            log.error("处理交易失败：", e);
            return Result.error("交易处理失败：" + e.getMessage());
        }
    }

    private Result handleBorrowRequest(Long resourceId, String senderAddress, int amount) {
        // 使用全限定类名避免冲突
        yin.xuebiblockchain.Pojo.Resource resource = resourceMapper.findById(resourceId);
        if (resource == null) {
            return Result.error("资源不存在");
        }
        if (resource.getOwnerAddress().equals(senderAddress)) {
            return Result.error("不能借用自己发布的资源");
        }
        if (!RES_STATUS_AVAILABLE.equals(resource.getStatus())) {
            return Result.error("资源当前不可借用（状态: " + resource.getStatus() + "）");
        }

        Long balance = transactionMapper.getBalance(senderAddress);
        if (balance == null || balance < amount) {
            return Result.error("积分不足，当前余额: " + (balance != null ? balance : 0) + "，需要: " + amount);
        }

        Long borrowerId = userMapper.getUserIdByPublicKey(senderAddress);
        log.info("更新资源状态前 - 资源ID: {}, 状态: {}", resourceId, RES_STATUS_PENDING);
        resourceMapper.updateResourceStatus(resourceId, RES_STATUS_PENDING, borrowerId);
        log.info("更新资源状态完成");

        log.info("增加借用次数 - 资源ID: {}", resourceId);
        resourceMapper.incrementBorrowCount(resourceId);
        log.info("增加借用次数完成");

        log.info("借用申请处理成功 — 资源ID: {}, 借用者: {}", resourceId, senderAddress);
        return Result.success("借用申请已提交");
    }

    private Result handleConfirmReceived(Long resourceId, String senderAddress,
                                         String recipientAddress, int amount) {
        int deductedRows = transactionMapper.deductPoints(senderAddress, amount);
        if (deductedRows == 0) {
            return Result.error("积分不足或扣除失败");
        }

        int addedRows = transactionMapper.addPoints(recipientAddress, amount);
        if (addedRows == 0) {
            transactionMapper.addPoints(senderAddress, amount);
            return Result.error("积分转入失败");
        }

        yin.xuebiblockchain.Pojo.Resource resource = resourceMapper.findById(resourceId);
        if (resource == null) return Result.error("资源不存在");
        Long borrowerId = userMapper.getUserIdByPublicKey(senderAddress);

        Timestamp borrowEndTime = new Timestamp(System.currentTimeMillis() + 7L * 24 * 60 * 60 * 1000);
        resourceMapper.updateResourceStatusAndBorrowEndTime(resourceId, RES_STATUS_LENT, borrowerId,  borrowEndTime);

        return Result.success("确认收到，积分已转移，请在 " + borrowEndTime + " 前归还");
    }

    private Result handleReturn(Long resourceId) {
        yin.xuebiblockchain.Pojo.Resource resource = resourceMapper.findById(resourceId);
        if (resource == null) return Result.error("资源不存在");
        if (!RES_STATUS_LENT.equals(resource.getStatus())) {
            return Result.error("资源当前未被借出");
        }

        Timestamp now = new Timestamp(System.currentTimeMillis());
        if (resource.getBorrowEndTime() != null && now.after(resource.getBorrowEndTime())) {
            long overdueMillis = now.getTime() - resource.getBorrowEndTime().getTime();
            long overdueDays = overdueMillis / (24 * 60 * 60 * 1000) + 1;
            int penalty = (int) (overdueDays * 5);

            Long borrowerId = resource.getBorrowerId();
            if (borrowerId != null) {
                String borrowerPublicKey = userMapper.getPublicKeyById(borrowerId);
                if (borrowerPublicKey != null) {
                    transactionMapper.deductPoints(borrowerPublicKey, penalty);
                    log.info("超期归还，扣除额外积分: {}", penalty);
                }
            }
        }

        resourceMapper.updateResourceStatus(resourceId, RES_STATUS_AVAILABLE, null);
        return Result.success("归还成功");
    }

    private void packBlock() {
        List<Transaction> txToPack = new ArrayList<>(transactionList);
        Block newBlock = createBlock(txToPack);
        newBlock.saveBlockToLevelDB(newBlock);

        for (Transaction tx : txToPack) {
            transactionMapper.updateBlockNumber(tx.calculateHash(), newBlock.getNumber());
        }
        transactionList.clear();
    }

    @Override
    public void packBlockIfNeeded() {
        synchronized (transactionList) {
            if (transactionList.size() >= BLOCK_TRANSACTION_THRESHOLD) {
                packBlock();
            }
        }
    }

    @Override
    public Result getTransactionHistory(String address, int page, int size) {
        try {
            if (address == null || address.isEmpty()) {
                return Result.error("地址不能为空");
            }
            int offset = (page - 1) * size;
            List<Map<String, Object>> records = transactionMapper.findByAddress(address, size, offset);
            return Result.success(records);
        } catch (Exception e) {
            log.error("查询交易历史失败", e);
            return Result.error("查询失败：" + e.getMessage());
        }
    }
}