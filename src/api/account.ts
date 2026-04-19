import { ref, onMounted } from 'vue';
import generateMnemonicAndKey from '@/utils/passphraseUtil';
import CryptoJS from 'crypto-js';
import request from '@/api/request';
import { useUserStore } from '@/store/UserStore';
import { useRouter } from 'vue-router';

export default function useAccount() {
  const address = ref<string>('');
  const privateKey = ref<string>('');
  const publicKey = ref<string>('');
  const isConfirmed = ref(false);
  const checked = ref(false);
  const isPrivateKeyGenerated = ref(false);
  const password = ref('');
  const confirmPassword = ref('');
  const userId = ref('');
  const userStore = useUserStore();
  const router = useRouter();

  const validatePassword = async () => {
    if (!password.value || !confirmPassword.value) {
      alert('密码不能为空！');
      return false;
    }
    if (password.value !== confirmPassword.value) {
      alert('两次输入的密码不一致！');
      return false;
    }

    try {
      const encryptedData = CryptoJS.AES.encrypt(privateKey.value, password.value).toString();
      localStorage.setItem(`wallet_${userId.value}`, encryptedData);

      await postAddress();
      await postUserVIP();

      alert('私钥已加密并存储成功！');
      router.push('/contrace');
    } catch (error) {
      console.error('加密私钥失败:', error);
      alert('加密失败，请重试！');
    }
  };

  const postAddress = async () => {
    if (!address.value) return alert('钱包地址不能为空！');
    if (!userStore.token) return alert('用户未登录');

    const res = await request.post('/userInfo/userAccount', null, {
      params: { public_key: address.value },
    });
    if (res.code === 200) console.log('账户创建成功');
  };

  const postUserVIP = async () => {
    const res = await request.post('/userInfo/createUserVIP', { userId: userId.value });
    if (res.code === 200) console.log('会员更新成功');
  };

  const getMe = async () => {
    await userStore.initUser();
    userId.value = userStore.id;
  };

  const confirmPrivacy = () => {
    isConfirmed.value = checked.value;
  };

  const generatePrivateKey = () => {
    const wallet = generateMnemonicAndKey();
    privateKey.value = wallet.privateKey;
    publicKey.value = wallet.publicKey;
    address.value = wallet.address;
    isPrivateKeyGenerated.value = true;
  };

  onMounted(() => getMe());

  return {
    isConfirmed,
    checked,
    confirmPrivacy,
    generatePrivateKey,
    isPrivateKeyGenerated,
    password,
    confirmPassword,
    validatePassword,
    address,
    privateKey,
    publicKey,
  };
}