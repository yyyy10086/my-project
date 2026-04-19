<template>
  <div class="resource-box" v-loading="loading">
    <div class="resource-title">
      <div class="titleLeft"><h4>热门共享资源</h4></div>
      <div class="titleRight">
        <button @click="$emit('loadMore')">查看全部资源 ></button>
      </div>
    </div>
    <div class="resource-list">
      <div v-for="item in safeItems" :key="item.id" class="resource-item" @click="$emit('detail', item.id)">
        <div class="resource-icon">{{ getCategoryIcon(item.category) }}</div>
        <div class="resource-info">
          <h5>{{ item.name }}</h5>
          <span class="resource-category">{{ item.category }}</span>
        </div>
        <div class="resource-cost">{{ item.pointsCost }} 积分</div>
        <div class="resource-borrow">
          <span>借用 {{ item.borrowCount }} 次</span>
        </div>
      </div>
      <div v-if="safeItems.length === 0 && !loading" class="empty-tip">暂无共享资源</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ResourceItem } from '@/store/resource';

const props = defineProps<{
  items: ResourceItem[];
  loading: boolean;
}>();

defineEmits<{
  (e: 'loadMore'): void;
  (e: 'detail', id: number): void;
}>();

const safeItems = computed(() => {
  return Array.isArray(props.items) ? props.items.slice(0, 5) : [];
});

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    '教材': '📚',
    '学习笔记': '📝',
    '电子设备': '📱',
    '体育器材': '⚽',
    '日常用品': '🎒',
    '其他': '📦',
  };
  return icons[category] || '📦';
};
</script>

<style scoped>
.resource-box {
  height: 300px;
  width: 75%;
  border-radius: 20px;
  background-color: #f7f7f7;
  position: relative;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
.resource-title {
  height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
}
.titleLeft {
  height: 100%;
  width: 60%;
  display: flex;
  align-items: center;
}
.titleLeft h4 {
  font-size: 16px;
  font-weight: bolder;
  margin-left: 20px;
}
.titleRight {
  height: 100%;
  width: 40%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.titleRight button {
  font-size: 13px;
  border: 0;
  cursor: pointer;
  background-color: #f7f7f7;
  margin-right: 20px;
}
.resource-list {
  height: 250px;
  width: 100%;
  overflow-y: auto;
}
.resource-item {
  height: 50px;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;
  padding: 0 20px;
  box-sizing: border-box;
}
.resource-item:hover {
  background-color: #f0f0f0;
  transition: 0.2s;
}
.resource-icon {
  font-size: 24px;
  margin-right: 10px;
}
.resource-info {
  flex: 1;
}
.resource-info h5 {
  font-size: 15px;
  font-weight: bold;
  margin: 0;
}
.resource-category {
  font-size: 12px;
  color: #888;
}
.resource-cost {
  font-size: 14px;
  font-weight: bold;
  color: #F0B90B;
  margin-right: 20px;
}
.resource-borrow {
  font-size: 12px;
  color: #888;
}
.empty-tip {
  text-align: center;
  padding: 40px;
  color: #aaa;
}
</style>