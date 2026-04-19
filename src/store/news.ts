import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '@/api/request';
import type { ApiResponse } from '@/api/request';

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  source?: string;        // 来源（可选）
  imageUrl?: string;       // 封面图（可选）
  createTime: string;      // 创建时间
}

export const useNewsStore = defineStore('news', () => {
  const newsList = ref<NewsItem[]>([]);
  const loading = ref(false);

  const fetchNews = async () => {
    loading.value = true;
    try {
      // 现在 request.get 返回的就是 Promise<ApiResponse<NewsItem[]>>
      const res = await request.get<NewsItem[]>('/news');
      if (res.code === 200) {
        newsList.value = res.data;
      } else {
        console.error('获取新闻失败', res.msg);
      }
    } catch (error) {
      console.error('获取新闻失败', error);
    } finally {
      loading.value = false;
    }
  };

  return { newsList, loading, fetchNews };
});