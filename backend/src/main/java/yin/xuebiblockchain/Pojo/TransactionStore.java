package yin.xuebiblockchain.Pojo;

import yin.xuebiblockchain.Utils.LevelDBUtil;

public class TransactionStore {
    public static void storeTransaction(String txId, String transactionData) {
        String key = "Transaction:" + txId;
        LevelDBUtil.put(key, transactionData);
    }

    public static String getTransaction(String txId) {
        String key = "Transaction:" + txId;
        return LevelDBUtil.get(key);
    }
}
