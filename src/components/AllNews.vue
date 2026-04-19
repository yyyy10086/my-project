<template>
  <div class="all-news-page">
    <Header />
    <main class="main-content">
      <div class="page-header">
        <h2>全部新闻</h2>
        <p>了解最新的加密货币资讯与市场动态</p>
      </div>
      
      <div class="news-container" v-loading="newsStore.loading">
        <div 
          v-for="item in newsStore.newsList" 
          :key="item.id" 
          class="news-item"
          @click="goToDetail(item.id)"
        >
          <div class="news-info">
            <h3 class="news-title">{{ item.title }}</h3>
            <p class="news-meta">发布时间: {{ formatDate(item.createTime) }}</p>
          </div>
          <div class="news-action">
            <span>查看详情 ></span>
          </div>
        </div>
        
        <div v-if="newsStore.newsList.length === 0 && !newsStore.loading" class="empty-state">
          暂无新闻数据
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useNewsStore } from '@/store/news';
import Header from '@/components/Header.vue';

const router = useRouter();
const newsStore = useNewsStore();

const goToDetail = (id: number) => {
  router.push(`/news/${id}`); // 这里才是去最终的新闻内容详情页
};

const formatDate = (date: string) => {
  if (!date) return '';
  return date.split('T')[0]; // 简单格式化日期
};

onMounted(() => {
  newsStore.fetchNews();
});
</script>

<style scoped>
/* 这里是第二张图的样式：白底卡片流 */
.all-news-page {
  min-height: 100vh;
  background: #fefefe;
}
.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 100px 2rem 2rem; /* 留出Header的高度 */
}
.page-header {
  margin-bottom: 30px;
}
.page-header h2 {
  font-size: 32px;
  font-weight: bold;
  color: #F0B90B;
  margin-bottom: 10px;
}
.page-header p {
  color: #666;
}
.news-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.news-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 24px;
  border-radius: 12px;
  cursor: pointer;
  border: 1px solid #eee;
  transition: all 0.2s ease;
}
.news-item:hover {
  border-color: #F0B90B;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.news-title {
  font-size: 18px;
  margin: 0 0 8px 0;
  color: #1e2329;
}
.news-meta {
  font-size: 13px;
  color: #707a8a;
  margin: 0;
}
.news-action span {
  color: #F0B90B;
  font-size: 14px;
  font-weight: 500;
}
</style>