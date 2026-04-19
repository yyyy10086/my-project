import { ref, onMounted } from 'vue';
import request from '@/api/request';
import { useUserStore } from '@/store/UserStore';

export default function useUserMessage() {
  const avatarUrl = ref<string>('');
  const userStore = useUserStore();
  const userName = ref<string>('');
  const userId = ref<number>();
  const userIcon = ref<string>('');
  const userClass = ref<string>('');
  const follow = ref<number>(0);
  const fans = ref<number>(0);

  const steps = ref([
    { title: '身份认证', description: '完成身份认证享完整服务', buttonText: '立即认证' },
    { title: '充值', description: '待完成' },
    { title: '交易', description: '待完成' },
  ]);
  const currentStep = ref(0);

  const handleButtonClick = (index: number) => {
    if (index === currentStep.value) currentStep.value++;
  };

  const uploadFile = async (event: Event) => {
    // ... 上传逻辑保持不变 ...
  };

  // 统一包装请求，增加异常捕获
  const safeRequest = async (fn: () => Promise<void>) => {
    if (!localStorage.getItem('token')) return; // 没 token 不请求
    try {
      await fn();
    } catch (e) {
      console.warn('请求被拦截或出错');
    }
  };

  const getFans = async () => {
    const res = await request.get<number>('/userInfo/userFans');
    if (res.code === 200) fans.value = res.data;
  };

  const getFollow = async () => {
    const res = await request.get<number>('/userInfo/userFollow');
    if (res.code === 200) follow.value = res.data;
  };

  const getUserVIP = async () => {
    const res = await request.get<number>('/userInfo/userVIP');
    if (res.code === 200) {
      const level = res.data;
      userClass.value = level === 1 ? '普通会员' : level === 2 ? '高级会员' : '超级无敌至尊会员';
    }
  };

  const getMe = async () => {
    await userStore.initUser();
    userId.value = Number(userStore.id);
    userName.value = userStore.nickName;
    userIcon.value = userStore.icon;
  };

  onMounted(async () => {
    // 检查是否有 token 再去请求个人信息，防止一进页面就报“服务器异常”
    if (localStorage.getItem('token')) {
      await safeRequest(getMe);
      // 并行请求，互不影响
      Promise.all([
        safeRequest(getFans),
        safeRequest(getFollow),
        safeRequest(getUserVIP)
      ]);
    }
  });

  return {
    uploadFile, avatarUrl, userName, userId, userIcon,
    steps, currentStep, userClass, handleButtonClick,
    follow, fans,
  };
}