// src/store/UserStore.ts
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import request from '@/api/request';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '');
  const nickName = ref(localStorage.getItem('nickName') || '');
  const icon = ref(localStorage.getItem('icon') || '');
  const id = ref(localStorage.getItem('id') || '');
  const balance = ref<number>(Number(localStorage.getItem('balance')) || 0);

  const address = ref('');
  const publicKeyHex = ref('');
  const privateKey = ref<string>('');   // 内存私钥

  const lockWallet = () => {
    privateKey.value = '';
  };

  const initUser = async () => {
  if (!token.value) return;
  try {
    const res = await request.get<any>('/userInfo/me');
    if (res.data) {
      nickName.value = res.data.nickName || '';
      icon.value = res.data.icon || '';
      id.value = String(res.data.id || '');
      balance.value = res.data.balance ?? 0;
      const pubKey = res.data.publicKey || '';
      address.value = pubKey;
      publicKeyHex.value = pubKey;
      localStorage.setItem('address', address.value);
      localStorage.setItem('publicKeyHex', publicKeyHex.value);
      // 注意：不调用 setWallet，避免清空 privateKey
    }
  } catch (e) {
    console.error('初始化用户信息失败', e);
  }
};

  const setToken = (t: string) => {
    token.value = t;
    localStorage.setItem('token', t);
    initUser(); // 确保获取用户信息
  };

  const setWallet = (addr: string, hexPub: string, privKey?: string) => {
    address.value = addr;
    publicKeyHex.value = hexPub;
    if (privKey) privateKey.value = privKey;
    localStorage.setItem('address', addr);
    localStorage.setItem('publicKeyHex', hexPub);
  };

  const unlockWallet = (decryptedKey: string) => {
    privateKey.value = decryptedKey;
  };

  const clearToken = () => {
    token.value = '';
    nickName.value = '';
    icon.value = '';
    id.value = '';
    balance.value = 0;
    address.value = '';
    publicKeyHex.value = '';
    privateKey.value = '';
    localStorage.clear();
  };

  const isWalletUnlocked = () => !!privateKey.value;

  watch(token, async (newToken) => {
    if (newToken) await initUser();
  }, { immediate: true });

  return {
    token, nickName, icon, id, balance,
    address, publicKeyHex, privateKey,
    setToken,          
    setWallet,
    unlockWallet,
    clearToken,
    isWalletUnlocked,
    initUser,
    lockWallet,
  };
});