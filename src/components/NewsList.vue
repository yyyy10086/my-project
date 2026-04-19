<template>
  <div class="newBox">
    <div class="newTitle">
      <div class="newLeftTitle"><h4>新闻</h4></div>
      <div class="newRightTitle">
        <button @click="goToAllNews">查看更多 ></button>
      </div>
    </div>
    <div class="new" v-loading="loading">
      <div 
        v-for="item in news.slice(0, 4)" 
        :key="item.id" 
        class="newContentBox" 
        @click="goToNewsDetail(item.id)">
        <p>{{ truncateTitle(item.title) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { NewsItem } from '@/store/news';

const props = defineProps<{
  news: NewsItem[];
  loading: boolean;
}>();

const router = useRouter();

const truncateTitle = (title: string) => 
  title.length > 35 ? title.slice(0, 35) + '...' : title;

const goToNewsDetail = (id: number) => router.push(`/news/${id}`);
const goToAllNews = () => router.push('/news');
</script>



<style scoped>
/* 这里是第一张图的样式：灰色方框 */
.newBox {
  height: 250px;
  width: 75%;
  border-radius: 20px;
  background-color: #f7f7f7;
  position: relative;
  left: 50%;
  transform: translate(-50%);
}
.newTitle {
  height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
}
.newLeftTitle {
  height: 100%;
  width: 60%;
  display: flex;
  align-items: center;
}
.newTitle h4 {
  font-size: 16px;
  font-weight: bolder;
  margin-left: 20px;
}
.newRightTitle {
  height: 100%;
  width: 40%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.newRightTitle button {
  font-size: 13px;
  font-weight: 300;
  border: 0;
  cursor: pointer;
  background-color: #f7f7f7;
  margin-right: 20px;
}
.newContentBox {
  padding: 10px 20px;
  cursor: pointer;
}
.newContentBox p {
  font-size: 14px;
  color: #333;
}
.newContentBox:hover p {
  color: #F0B90B;
}
</style>