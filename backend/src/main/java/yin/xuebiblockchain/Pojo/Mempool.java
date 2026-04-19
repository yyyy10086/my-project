package yin.xuebiblockchain.Pojo;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * 交易内存池
 * 用于暂存尚未打包进区块的交易，线程安全
 */
@Component
public class Mempool {

    // 使用线程安全的 ConcurrentHashMap 存储交易，key = 交易哈希
    private final ConcurrentHashMap<String, Transaction> transactionPool;

    public Mempool() {
        this.transactionPool = new ConcurrentHashMap<>();
    }

    /**
     * 添加交易到内存池
     * @param transaction 待添加的交易
     */
    public void addTransaction(Transaction transaction) {
        String transactionHash = transaction.calculateHash();
        transactionPool.put(transactionHash, transaction);
    }

    /**
     * 获取内存池中所有交易
     * @return 交易列表
     */
    public List<Transaction> getAllTransactions() {
        System.out.println("内存池交易数量: " + transactionPool.size());
        return transactionPool.values().stream().collect(Collectors.toList());
    }

    /**
     * 从内存池移除指定交易
     * @param transactionHash 交易哈希
     */
    public void removeTransaction(String transactionHash) {
        transactionPool.remove(transactionHash);
    }

    /**
     * 检查内存池中是否已存在某笔交易
     * @param transactionHash 交易哈希
     * @return true=存在
     */
    public boolean containsTransaction(String transactionHash) {
        return transactionPool.containsKey(transactionHash);
    }

    /**
     * 获取内存池当前交易数量
     * @return 交易数量
     */
    public int getSize() {
        return transactionPool.size();
    }
}