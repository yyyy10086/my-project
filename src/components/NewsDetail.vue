<template>
  <div class="news-detail-page">
    <Header />
    <main class="main-content" v-if="newsItem">
      <h2>{{ newsItem.title }}</h2>
      <p class="meta">发布时间：{{ formatDate(newsItem.createTime) }}</p>
      <div class="content">{{ newsItem.content }}</div>
      <button @click="$router.back()" class="back-btn">← 返回新闻列表</button>
    </main>
    <div v-else class="empty">新闻不存在或已删除</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useNewsStore } from '@/store/news';
import Header from '@/components/Header.vue';

const route = useRoute();
const newsStore = useNewsStore();
const newsItem = ref<any>(null);

const formatDate = (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '未知时间';

onMounted(() => {
  const id = Number(route.params.id);
  // 使用已加载的列表，避免额外请求
  const found = newsStore.newsList.find(item => item.id === id);
  if (found) {
    newsItem.value = found;
  } else {
    // 如果列表里没有，再请求一次列表
    newsStore.fetchNews().then(() => {
      newsItem.value = newsStore.newsList.find(item => item.id === id);
    });
  }
});
</script>

<style scoped>
.news-detail-page { min-height: 100vh; background: #fefefe; }
.main-content { max-width: 800px; margin: 100px auto; padding: 2rem; }
h2 { font-size: 28px; margin-bottom: 10px; }
.meta { color: #888; margin-bottom: 30px; }
.content { line-height: 1.8; font-size: 16px; white-space: pre-wrap; }
.back-btn { margin-top: 40px; padding: 10px 20px; background: #F0B90B; color: white; border: none; border-radius: 8px; cursor: pointer; }
.empty { text-align: center; padding: 100px; color: #999; }
</style>