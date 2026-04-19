package yin.xuebiblockchain.Pojo;

import yin.xuebiblockchain.Utils.LevelDBUtil;

public class BlockStore {
    //区块头
    public static void storeHeader(String blockNum, String hash, String headerData) {
        String key = "Headers:" + blockNum + ":" + hash;
        LevelDBUtil.put(key, headerData);
    }

    public static String getHeader(String blockNum, String hash) {
        String key = "Headers:" + blockNum + ":" + hash;
        return LevelDBUtil.get(key);
    }

    //区块体
    public static void storeBlockBody(String blockNum, String hash, String blockBodyData) {
        String key = "BlockBody:" + blockNum + ":" + hash;
        LevelDBUtil.put(key, blockBodyData);
    }

    public static String getBlockBody(String blockNum, String hash) {
        String key = "BlockBody:" + blockNum + ":" + hash;
        return LevelDBUtil.get(key);
    }
}

