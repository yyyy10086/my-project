// src/store/resource.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import request from '@/api/request';

export interface ResourceItem {
  id: number;
  name: string;
  description: string;
  resourceType: string;
  category: string;
  pointsCost: number;
  status: string;
  ownerId: number;
  ownerName: string;
  ownerAddress: string;
  imageUrl: string;
  borrowCount: number;
  createTime: string;
}

export const useResourceStore = defineStore('resource', () => {
  const resources = ref<ResourceItem[]>([]);
  const loading = ref(false);

  const fetchHotResources = async (limit = 5) => {
    loading.value = true;
    try {
      const res = await request.get<ResourceItem[]>('/resource/hot', {
        params: { limit },
      });
      if (res.code === 200 && Array.isArray(res.data)) {
        resources.value = res.data;
      }
    } catch (error) {
      console.error('获取热门资源失败', error);
    } finally {
      loading.value = false;
    }
  };

  const fetchAllResources = async () => {
    loading.value = true;
    try {
      const res = await request.get<ResourceItem[]>('/resource/list');
      if (res.code === 200 && Array.isArray(res.data)) {
        resources.value = res.data;
      }
    } catch (error) {
      console.error('获取资源列表失败', error);
    } finally {
      loading.value = false;
    }
  };

  const searchResources = async (keyword: string) => {
    loading.value = true;
    try {
      const res = await request.get<ResourceItem[]>('/resource/search', {
        params: { keyword },
      });
      if (res.code === 200 && Array.isArray(res.data)) {
        resources.value = res.data;
      }
    } catch (error) {
      console.error('搜索资源失败', error);
    } finally {
      loading.value = false;
    }
  };

  return { resources, loading, fetchHotResources, fetchAllResources, searchResources };
});