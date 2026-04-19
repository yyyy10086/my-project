import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElMessage } from 'element-plus';

export interface CoinItem {
  id: string;
  name: string;
  price: number;
  change: number;
}

const CACHE_KEY = 'coin_cache';
const CACHE_TIME_KEY = 'coin_cache_time';
const CACHE_DURATION = 10 * 60 * 1000; // 10分钟

export const useCoinStore = defineStore('coin', () => {
  const coins = ref<CoinItem[]>([]);      // ✅ 确保初始化为空数组
  const loading = ref(false);

  const loadCache = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    if (cached && cachedTime) {
      const now = Date.now();
      const time = parseInt(cachedTime);
      if (now - time < CACHE_DURATION) {
        coins.value = JSON.parse(cached);
        return true;
      }
    }
    return false;
  };

  // 保存到 localStorage
  const saveCache = () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(coins.value));
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
  };

  const fetchCoins = async (force = false) => {
    // 如果有缓存且未过期，且不是强制刷新，则直接返回
    if (!force && coins.value.length === 0) {
      const hasCache = loadCache();
      if (hasCache) {
        // 缓存已加载，但可以后台更新（不等待）
        // 这里为了避免重复请求，用一个标志
        if (loading.value) return;
      }
    }

    loading.value = true;
    try {
      const ids = [
        'bitcoin', 'ethereum', 'binancecoin', 'solana', 'toncoin',
        'dogecoin', 'ripple', 'tron', 'cardano', 'polkadot',
        'litecoin', 'bitcoin-cash', 'chainlink', 'stellar'
      ];
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('请求失败');
      const data = await response.json();

      const newCoins = ids.map(id => {
        const info = data[id];
        if (!info) return null;
        return {
          id,
          name: mapCoinName(id),
          price: info.usd,
          change: info.usd_24h_change,
        };
      }).filter(Boolean) as CoinItem[];

      coins.value = newCoins;
      saveCache();
    } catch (error) {
      ElMessage.error('获取币价失败，显示缓存数据');
      console.error(error);
      // 如果已有缓存，继续使用（可能已过期，这里不处理）
      if (coins.value.length === 0) {
        // 尝试加载缓存（可能已过期）
        loadCache();
      }
    } finally {
      loading.value = false;
    }
  };

  // 名称映射
  const mapCoinName = (id: string): string => {
    const map: Record<string, string> = {
      bitcoin: '比特币',
      ethereum: '以太坊',
      binancecoin: 'BNB',
      solana: 'Solana',
      toncoin: 'Toncoin',
      dogecoin: '狗狗币',
      ripple: '瑞波币',
      tron: '波场',
      cardano: '卡尔达诺',
      polkadot: '波卡',
      litecoin: '莱特币',
      'bitcoin-cash': '比特币现金',
      chainlink: 'Chainlink',
      stellar: '恒星币',
    };
    return map[id] || id.toUpperCase();
  };

  // 立即尝试加载缓存，这样页面一打开就能显示
  loadCache();

  return { coins, loading, fetchCoins };
});