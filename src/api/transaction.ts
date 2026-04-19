import { ref, onMounted } from 'vue';
import CryptoJS from 'crypto-js';
import request from '@/api/request';
import { useUserStore } from '@/store/UserStore';
import { useRouter } from 'vue-router';
import { signMessage } from '@/utils/eccUtil';

interface Transaction {
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  timestamp: string;
}

export default function useTransaction() {
  const address = ref<string>('');
  const password = ref<string>('');
  const sender = ref<string>('');
  const receiver = ref<string>('');
  const amount = ref<number>();
  const privateKey = ref<string>('');
  const publicKey = ref<string>('');
  const transactionList = ref<Transaction[]>([]);
  const gas = ref<number>();
  const money = ref<number>(0);
  const isLoggedIn = ref(false);
  const userId = ref<string>('');
  const userStore = useUserStore();
  const router = useRouter();

  const loginXuebiAccount = async () => {
    const decrypted = decryptPrivateKey(userId.value, password.value);
    if (!decrypted) return;
    isLoggedIn.value = true;
    await getAddress();
  };

  const decryptPrivateKey = (uid: string, pwd: string): string | null => {
    const encryptedData = localStorage.getItem(`wallet_${uid}`);
    if (!encryptedData) {
      alert('未找到加密的私钥');
      return null;
    }
    const bytes = CryptoJS.AES.decrypt(encryptedData, pwd);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted) {
      alert('密码错误');
      return null;
    }
    privateKey.value = decrypted;
    return decrypted;
  };

  const getMe = async () => {
    await userStore.initUser();
    userId.value = userStore.id;
  };

  const getAddress = async () => {
    const res = await request.get<number>('/userInfo/userAddress', {
      params: { public_key: userStore.publicKeyHex },
    });
    if (res.code === 200) money.value = res.data;
  };

  const getCurrentTimestamp = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ` +
           `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.` +
           `${now.getMilliseconds().toString().padStart(3, '0')}`;
  };

  const signature = () => {
    if (!sender.value || !receiver.value || amount.value === undefined || !privateKey.value) {
      alert('请完整填写交易信息！');
      return null;
    }
    const transaction: Transaction = {
      senderAddress: sender.value.trim(),
      recipientAddress: receiver.value.trim(),
      amount: amount.value,
      timestamp: getCurrentTimestamp(),
    };
    transactionList.value.push(transaction);
    return signMessage(privateKey.value, transaction);
  };

  const sendTransaction = async () => {
    const signedData = signature();
    if (!signedData || !publicKey.value) return;
    const tx = transactionList.value[transactionList.value.length - 1];
    await submitTransaction(tx, signedData, publicKey.value);
  };

  const submitTransaction = async (tx: Transaction, signature: { r: string; s: string }, pubKey: string) => {
    const payload = {
      senderAddress: tx.senderAddress,
      recipientAddress: tx.recipientAddress,
      amount: tx.amount,
      timestamp: tx.timestamp,
      signature,
      publicKey: pubKey,
    };
    const res = await request.post('/transaction/sendAmount', payload);
    if (res.code === 200) {
      alert('交易提交成功！');
      transactionList.value = [];
    } else {
      alert('交易提交失败');
    }
  };

  onMounted(() => getMe());

  return {
    address,
    password,
    loginXuebiAccount,
    sender,
    receiver,
    amount,
    privateKey,
    publicKey,
    sendTransaction,
    gas,
    money,
    isLoggedIn,
  };
}