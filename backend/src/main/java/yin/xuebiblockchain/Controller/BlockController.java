package yin.xuebiblockchain.Controller;

import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import yin.xuebiblockchain.Pojo.Block;
import yin.xuebiblockchain.Pojo.Mempool;
import yin.xuebiblockchain.Pojo.Result;
import yin.xuebiblockchain.Pojo.Transaction;
import yin.xuebiblockchain.Service.BlockService;

import java.util.ArrayList;
import java.util.List;

import static yin.xuebiblockchain.Utils.SystemConstants.GAS_LIMIT;

@RestController
@RequestMapping("/block")
public class BlockController {
    @Resource
    private BlockService blockService;

    @Resource
    private Mempool mempool;

    @PostMapping("/createBlock")
    public Result createBlock() {
        //从内存池拿出交易
        List<Transaction> allTransactions = mempool.getAllTransactions();

        // 动态筛选交易直到达到或接近 GAS_LIMIT
        long accumulatedGas = 0;
        List<Transaction> selectedTransactions = new ArrayList<>();

        for (Transaction tx : allTransactions) {
            long txGas = tx.getGasUsed(); // 假设 Transaction 类有一个 getGasUsed 方法
            if (accumulatedGas + txGas > GAS_LIMIT) {
                break; // 停止加入交易
            }
            accumulatedGas += txGas;
            selectedTransactions.add(tx);
        }

        //计算区块哈希
        // 创建新区块
        Block newBlock = new Block();
        newBlock.setPreviousHash("");
        newBlock.setTimestamp(System.currentTimeMillis());
        newBlock.setTransactions(allTransactions);
        newBlock.setDifficulty(4L); // 示例难度
        newBlock.setNumber(1);
        newBlock.calculateMerkleRoot();

        // 挖矿
        newBlock.mineBlock();


        //存入数据库
        // 保存区块到数据库
        blockService.saveBlock(newBlock);

        // 从内存池移除已包含的交易
        mempool.removeTransaction("");

        return Result.success();
    }
}
