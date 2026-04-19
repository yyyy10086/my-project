package yin.xuebiblockchain.Utils;

import org.iq80.leveldb.*;
import org.iq80.leveldb.impl.Iq80DBFactory;
import yin.xuebiblockchain.Pojo.Block;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import static org.iq80.leveldb.impl.Iq80DBFactory.factory;
import static yin.xuebiblockchain.Utils.SystemConstants.LEVEL_DB_STORE;

public class LevelDBUtil {
    private static DB db;

    static {
        try {
            db = Iq80DBFactory.factory.open(new File(LEVEL_DB_STORE), new Options());
        } catch (IOException e) {
            throw new RuntimeException("初始化 LevelDB 数据库失败", e);
        }
    }

    // 打开数据库
    public static void open(String dbPath) throws Exception {
        Options options = new Options();
        options.createIfMissing(true);
        db = factory.open(new File(dbPath), options);
    }

    // 关闭数据库
    public static void close() throws Exception {
        if (db != null) {
            db.close();
        }
    }

    // 写入数据
    public static void put(String key, String value) {
        try {
            db.put(key.getBytes(StandardCharsets.UTF_8), value.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            System.err.println("写入失败: " + e.getMessage());
        }
    }

    // 保存区块到 LevelDB
    public static void saveBlock(Block block) {
        try {
            String blockHash = block.getHash();
            String blockData = block.serializeBlock(block); // 序列化区块为 JSON 或字符串
            LevelDBUtil.put(blockHash, blockData);
            if (block.getNumber() == 0) {
                LevelDBUtil.put("genesis_block", blockHash); // 存储创世区块的哈希
            }
        } catch (Exception e) {
            throw new RuntimeException("保存区块失败", e);
        }
    }

    //读取数据
    public static String get(String key) {
        try {
            byte[] value = db.get(key.getBytes(StandardCharsets.UTF_8));
            return value == null ? null : new String(value, StandardCharsets.UTF_8);
        } catch (Exception e) {
            System.err.println("读取失败: " + e.getMessage());
            return null;
        }
    }

    // 获取所有数据
    public static Map<String, String> getAll() {
        Map<String, String> resultMap = new HashMap<>();
        try (DBIterator iterator = db.iterator()) {
            iterator.seekToFirst();
            while (iterator.hasNext()) {
                Map.Entry<byte[], byte[]> entry = iterator.next();
                String key = new String(entry.getKey(), StandardCharsets.UTF_8);
                String value = new String(entry.getValue(), StandardCharsets.UTF_8);
                resultMap.put(key, value);
            }
        } catch (Exception e) {
            System.err.println("获取所有数据失败: " + e.getMessage());
        }
        return resultMap;
    }

    // 获取最新区块的哈希
    public String getLatestBlockHash() {
        return LevelDBUtil.get("latest");
    }

    // 删除数据
    public static void delete(String key) {
        db.delete(key.getBytes(StandardCharsets.UTF_8));
    }
}
