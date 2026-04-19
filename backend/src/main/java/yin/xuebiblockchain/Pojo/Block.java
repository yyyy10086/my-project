package yin.xuebiblockchain.Pojo;

import com.google.gson.Gson;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import yin.xuebiblockchain.Utils.HashUtil;
import yin.xuebiblockchain.Utils.LevelDBUtil;
import yin.xuebiblockchain.Utils.MerkleTreeUtil;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Data
public class Block {
    private String hash;                    // 当前区块的哈希
    private String previousHash;            // 前一个区块的哈希
    private long timestamp;                 // 区块时间戳
    private List<Transaction> transactions; // 区块交易
    private String merkleRoot;              // 默克尔根
    private int nonce;                      // 工作量证明用的随机数
    private String Beneficiary;             //接收挖矿奖励的地址（矿工地址）。
    private Long difficulty;                //困难值
    private Long number;                    //区块号（区块的高度，从 0 开始）。
    private long gasLimit;                  // Gas 上限
    private long gasUsed;                   // Gas 使用量

    public Block() {
    }

    public Block(String hash, String previousHash, long timestamp, List<Transaction> transactions, String merkleRoot, int nonce, String Beneficiary, Long difficulty, Long number, long gasLimit, long gasUsed) {
        this.hash = calculateHash();
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.merkleRoot = merkleRoot;
        this.nonce = nonce;
        this.Beneficiary = Beneficiary;
        this.difficulty = (difficulty != null) ? difficulty : 4L; // 设置默认值;
        this.number = number;
        this.gasLimit = gasLimit;
        this.gasUsed = gasUsed;
    }


    // 双重sha-256计算当前区块的哈希
    public String calculateHash() {
        String dataToHash = previousHash + timestamp + merkleRoot + nonce + gasLimit + gasUsed + difficulty + number  + Beneficiary;
        System.out.println("data:" + dataToHash);
        return HashUtil.applyDoubleSHA256(dataToHash);
    }

    // 挖矿（工作量证明）
    public void mineBlock() {
        if (hash == null || hash.isEmpty()) {
            hash = calculateHash(); // 初始化
        }
        String target = new String(new char[difficulty.intValue()]).replace('\0', '0');
        while (!hash.substring(0, difficulty.intValue()).equals(target)) {
            nonce++;
            hash = calculateHash();
        }
        log.info("区块已成功挖矿，nonce = {}，hash = {}", nonce, hash);
    }

    //计算默克尔树
    public void calculateMerkleRoot() {
        List<String> transactionHashes = transactions.stream()
                .map(Transaction::calculateHash)
                .collect(Collectors.toList());
        this.merkleRoot = MerkleTreeUtil.getMerkleRoot(transactionHashes);
    }

    public String serializeBlock(Block block) {
        // 将区块对象转为 JSON 或字符串
        return new Gson().toJson(block);
    }

    //创建区块
    public static Block createBlock(List<Transaction> transactions) {
        try {
            // 获取最新区块哈希
            String previousHash = LevelDBUtil.get("latest");
            if (previousHash == null) {
                previousHash = "0"; // 创世区块
            }

            // 创建新区块
            Block block = new Block();
            block.setPreviousHash(previousHash);
            block.setDifficulty(4L); // 设置默认的难度值
            block.setTimestamp(System.currentTimeMillis());
            block.setTransactions(transactions);
            block.calculateMerkleRoot(); // 计算默克尔根
            block.setNumber(getLatestBlockHeight() + 1); // 区块高度递增
            block.setGasLimit(1000L); // 设置Gas限制
            block.setGasUsed(5L);     // 示例Gas消耗值
            block.mineBlock();          // 挖矿
            return block;
        } catch (Exception e) {
            log.error("创建区块失败：", e);
            throw new RuntimeException("创建区块失败：" + e.getMessage());
        }
    }
    //计算区块高度
    private static long getLatestBlockHeight() {
        String latestHeight = LevelDBUtil.get("latest_height");
        return latestHeight != null ? Long.parseLong(latestHeight) : 0L;
    }

    //将区块存入levelDB
    public void saveBlockToLevelDB(Block block) {
        try {
            // 序列化区块
            String blockJson = block.serializeBlock(block);

            // 存储区块
            String blockKey = "block_" + block.getNumber(); // 例如：block_1, block_2
            LevelDBUtil.put(blockKey, blockJson);

            // 更新最新区块哈希和区块高度
            LevelDBUtil.put("latest", block.getHash());
            LevelDBUtil.put("latest_height", String.valueOf(block.getNumber()));

            log.info("区块已存储到 LevelDB，区块号：{}", block.getNumber());
        } catch (Exception e) {
            log.error("区块存储到 LevelDB 失败：", e);
            throw new RuntimeException("区块存储失败：" + e.getMessage());
        }
    }

    /**
     * 获取
     *
     * @return hash
     */
    public String getHash() {
        return hash;
    }

    /**
     * 设置
     *
     * @param hash
     */
    public void setHash(String hash) {
        this.hash = hash;
    }

    /**
     * 获取
     *
     * @return previousHash
     */
    public String getPreviousHash() {
        return previousHash;
    }

    /**
     * 设置
     *
     * @param previousHash
     */
    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    /**
     * 获取
     *
     * @return timestamp
     */
    public long getTimestamp() {
        return timestamp;
    }

    /**
     * 设置
     *
     * @param timestamp
     */
    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * 获取
     *
     * @return nmuber
     */
    public long getNumber() {
        return number;
    }

    /**
     * 设置
     *
     * @param number
     */
    public void setNumber(long number) {
        this.number = number;
    }

    /**
     * 获取
     *
     * @return transactions
     */
    public List<Transaction> getTransactions() {
        return transactions;
    }

    /**
     * 设置
     *
     * @param transactions
     */
    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
    }

    /**
     * 获取
     *
     * @return merkleRoot
     */
    public String getMerkleRoot() {
        return merkleRoot;
    }

    /**
     * 设置
     *
     * @param merkleRoot
     */
    public void setMerkleRoot(String merkleRoot) {
        this.merkleRoot = merkleRoot;
    }

    /**
     * 获取
     *
     * @return nonce
     */
    public int getNonce() {
        return nonce;
    }

    /**
     * 设置
     *
     * @param nonce
     */
    public void setNonce(int nonce) {
        this.nonce = nonce;
    }

    /**
     * 获取
     *
     * @return gasLimit
     */
    public long getGasLimit() {
        return gasLimit;
    }

    /**
     * 设置
     *
     * @param gasLimit
     */
    public void setGasLimit(long gasLimit) {
        this.gasLimit = gasLimit;
    }

    /**
     * 获取
     *
     * @return gasUsed
     */
    public long getGasUsed() {
        return gasUsed;
    }

    /**
     * 设置
     *
     * @param gasUsed
     */
    public void setGasUsed(long gasUsed) {
        this.gasUsed = gasUsed;
    }

    public String toString() {
        return "Block{hash = " + hash + ", previousHash = " + previousHash + ", timestamp = " + timestamp + ", transactions = " + transactions + ", merkleRoot = " + merkleRoot + ", nonce = " + nonce + ", gasLimit = " + gasLimit + ", gasUsed = " + gasUsed + "}";
    }
}
