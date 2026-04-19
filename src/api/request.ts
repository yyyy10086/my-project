// src/api/request.ts
import axios from 'axios';
import { ElMessage } from 'element-plus';
import type { InternalAxiosRequestConfig } from 'axios';
import { useUserStore } from '@/store/UserStore';

export interface ApiResponse<T = any> {
  code: number;
  msg: string;
  data: T;
}

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      ElMessage.error('登录已过期，请重新登录');
      
      const userStore = useUserStore();
      userStore.clearToken();           // 彻底清理
      localStorage.removeItem('token');
      
      // 强制刷新页面，确保 Header 立刻切换
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
    } else {
      const msg = error.response?.data?.msg || error.message || '网络错误，请重试';
      ElMessage.error(msg);
    }
    return Promise.reject(error);
  }
);

const request = {
  get: <T = any>(url: string, config?: any) => instance.get<any, ApiResponse<T>>(url, config),
  post: <T = any>(url: string, data?: any, config?: any) => instance.post<any, ApiResponse<T>>(url, data, config),
};

export default request;