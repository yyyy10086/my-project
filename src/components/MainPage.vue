<template>
  <div class="home-page">
    <Header />
    <main class="main-content">
      <div class="left-panel">
        <h2>欢迎来到CampusLink<span>，开启校园资源共享之旅</span></h2>
        
        <!-- 只保留登录后的显示，v-else 可以改成提示 -->
        <div v-if="userStore.token" class="secondText">
          <p>我的信用积分</p>
          <h5>{{ userStore.balance }} 分</h5>
        </div>
        <div v-else class="secondText">
          <p>请先登录查看信用积分</p>
          
        </div>

        <button class="leftContentBtn" @click="goToPublish">立即开始共享</button>
      </div>

      <div class="right-panel">
        <div class="showCoin">
          <ResourceList 
            :items="resourceStore.resources" 
            :loading="resourceStore.loading" 
            @loadMore="handleLoadMore" 
          />
        </div>
        <div class="midContent"></div>
        <div class="showNew">
          <NewsList 
            :news="newsStore.newsList" 
            :loading="newsStore.loading" 
            @refresh="refreshNews" 
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/UserStore';
import { useResourceStore } from '@/store/resource';
import { useNewsStore } from '@/store/news';
import Header from '@/components/Header.vue';
import ResourceList from '@/components/ResourceList.vue';
import NewsList from '@/components/NewsList.vue';

const router = useRouter();
const userStore = useUserStore();
const resourceStore = useResourceStore();
const newsStore = useNewsStore();

const goToPublish = () => router.push('/publish');
const handleLoadMore = () => router.push('/resources');
const refreshNews = () => newsStore.fetchNews();

onMounted(async () => {
  if (userStore.token) {
    await userStore.initUser();
  }
  await Promise.all([
    resourceStore.fetchHotResources(5),
    newsStore.fetchNews()
  ]);
});
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #fefefe;
}
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 2rem 2rem;
}
.left-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem;
}
.left-panel h2 {
  font-size: 32px;
  font-weight: bold;
  line-height: 1.4;
}
.left-panel h2 span {
  font-weight: normal;
  color: #666;
}
.secondText {
  margin-top: 30px;
}
.secondText p {
  font-size: 14px;
  color: #888;
}
.secondText h5 {
  font-size: 36px;
  font-weight: bold;
  color: #F0B90B;
  margin-top: 5px;
}
.leftContentBtn {
  margin-top: 30px;
  width: 200px;
  height: 50px;
  border-radius: 25px;
  background-color: #F0B90B;
  color: white;
  font-size: 16px;
  font-weight: bold;
  border: none;
  cursor: pointer;
}
.leftContentBtn:hover {
  background-color: #d4a40a;
}
.right-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.showCoin, .showNew {
  height: 320px;
}
.midContent {
  height: 20px;
}
</style>