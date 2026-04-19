// src/api/login.ts
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import request from '@/api/request';
import { useUserStore } from '@/store/UserStore';

export default function useLogin() {
  const phone = ref('');
  const code = ref('');
  const password = ref('');                    // 新增：密码字段
  const loginType = ref<'code' | 'password'>('code');  // 新增：登录方式切换
  const successMes = ref('');
  const errorMes = ref('');
  const countdown = ref(0);
  const isCodeButtonDisabled = ref(false);
  const loading = ref(false);

  const userStore = useUserStore();
  const router = useRouter();

  // 切换登录方式
  const toggleLoginType = () => {
    loginType.value = loginType.value === 'code' ? 'password' : 'code';
    errorMes.value = '';
    successMes.value = '';
  };

  // 发送验证码
  const sendCode = async (phoneNumber: any) => {
    const phoneStr = typeof phoneNumber === 'string' ? phoneNumber : phoneNumber?.value || '';
    if (countdown.value > 0 || loading.value || !phoneStr) return;

    loading.value = true;
    isCodeButtonDisabled.value = true;

    try {
      const res = await request.post(`/user/sendCode?phone=${phoneStr}`, {});
      if (res.code === 200) {
        successMes.value = '验证码发送成功';
        startCountdown();
      } else {
        errorMes.value = res.msg || '发送失败';
      }
    } catch (err: any) {
      errorMes.value = err.response?.data?.msg || '发送验证码失败';
    } finally {
      loading.value = false;
    }
  };

  // 验证码登录
  const loginWithCode = async () => {
    if (!phone.value || !code.value) {
      errorMes.value = '手机号和验证码不能为空';
      return false;
    }

    try {
      const res = await request.post('/user/login', {
        phone: phone.value.trim(),
        code: code.value.trim(),
      });

      if (res.code === 200) {
        const newToken = res.data;
        userStore.setToken(newToken);
        await userStore.initUser();   // 立即获取用户信息
        successMes.value = '登录成功！正在跳转...';
        errorMes.value = '';
        setTimeout(() => router.replace('/'), 800);
        return true;
      } else {
        errorMes.value = res.msg || '登录失败';
        return false;
      }
    } catch (err: any) {
      console.error('登录异常', err);
      errorMes.value = err.response?.data?.msg || '网络错误，请重试';
      return false;
    }
  };

  // 密码登录（新增）
  const loginWithPassword = async () => {
    if (!phone.value || !password.value) {
      errorMes.value = '手机号和密码不能为空';
      return false;
    }

    try {
      const res = await request.post('/user/loginByPassword', {
        phone: phone.value.trim(),
        password: password.value,
      });

      if (res.code === 200) {
        const newToken = res.data;
        userStore.setToken(newToken);
        await userStore.initUser();
        successMes.value = '登录成功！正在跳转...';
        errorMes.value = '';
        setTimeout(() => router.replace('/'), 800);
        return true;
      } else {
        errorMes.value = res.msg || '密码错误';
        return false;
      }
    } catch (err: any) {
      console.error('登录异常', err);
      errorMes.value = err.response?.data?.msg || '网络错误，请重试';
      return false;
    }
  };

  // 统一的登录入口，根据当前登录类型调用不同方法
  const loginBtn = async () => {
    if (loginType.value === 'code') {
      await loginWithCode();
    } else {
      await loginWithPassword();
    }
  };

  const startCountdown = () => {
    countdown.value = 60;
    const timer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(timer);
        isCodeButtonDisabled.value = false;
      }
    }, 1000);
  };

  return {
    phone,
    code,
    password,          // 导出密码
    loginType,         // 导出登录类型
    successMes,
    errorMes,
    countdown,
    isCodeButtonDisabled,
    sendCode,
    loginBtn,
    toggleLoginType,   // 导出切换方法
  };
}