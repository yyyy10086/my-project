<template>
  <div class="page">
    <Header />

    <div class="plazaPageleftPage">
      <div class="plazaPageButtonList">
        <button @click="$router.push('/')">
          <el-icon><HomeFilled /></el-icon>首页
        </button>
        <button @click="handleNotification">
          <el-icon><BellFilled /></el-icon>通知
        </button>
        <button @click="goToUserInfo">
          <el-icon><UserFilled /></el-icon>个人主页
        </button>
        <button @click="$router.push('/news')">
          <el-icon><List /></el-icon>新闻
        </button>
        <button @click="handleFavorite">
          <el-icon><Management /></el-icon>收藏与点赞
        </button>
        <button @click="handleSettings">
          <el-icon><Tools /></el-icon>设置
        </button>
      </div>

      <div class="userMes">
        <img
          :src="userStore.icon || '/default-avatar.png'"
          class="avatar"
          @click="goToUserInfo"
          alt="avatar"
        />
        <p>{{ userStore.nickName || '未登录' }}</p>
        <el-icon class="sign"><MoreFilled /></el-icon>
      </div>
    </div>

    <div class="midPage">
      <div class="topBox">
        <button>推荐</button>
        <button>正在关注</button>
      </div>

      <!-- 发帖区域（恢复原风格） -->
      <div class="secondBox">
        <div class="userComment">
          <img
            :src="userStore.icon || '/default-avatar.png'"
            class="avatar"
            @click="goToUserInfo"
            alt="avatar"
          />
          <textarea
            placeholder="分享你的看法"
            class="userInput"
            v-model="userPostContent"
          ></textarea>
        </div>
        <button @click="sendPost">发文</button>
      </div>

      <div class="thirdBox">
        <p>显示 {{ postList.length }} 条帖子</p>
      </div>

      <!-- 帖子卡片：仅优化内部间距 -->
      <div class="fourthBox" v-for="item in postList" :key="item.id">
        <img
          :src="item.userIcon || '/default-avatar.png'"
          class="avatar"
          alt="avatar"
        />
        <!-- 用户名和时间放在同一行，增加合适间距 -->
        <div class="post-header">
          <span class="userName">{{ item.userName }}</span>
          <span class="lastTime">{{ calculateTimeDifference(item.updateTime) }}前</span>
        </div>

        <div class="postFont">
          <h5>{{ item.postTitle }}</h5>
          <p>{{ item.postContent }}</p>
        </div>
        <div class="likeStrip">
          <div class="stripIcon" @click="gainLike(item.id)">
            <el-icon size="16px"><Pointer /></el-icon>
            <p>{{ item.likeCount }}</p>
          </div>
          <div class="stripIcon" @click="gainView(item.id)">
            <el-icon size="16px"><View /></el-icon>
            <p>{{ item.viewCount }}</p>
          </div>
          <div class="stripIcon">
            <el-icon size="16px"><ChatLineSquare /></el-icon>
            <p>{{ item.commentCount }}</p>
          </div>
          <div class="stripIcon" @click="gainShare(item.id)">
            <el-icon size="16px"><Paperclip /></el-icon>
            <p>{{ item.shareCount }}</p>
          </div>
          <div class="stripIcon">
            <el-icon size="16px"><More /></el-icon>
          </div>
        </div>
      </div>
    </div>

    <div class="rightPage">
      <span class="search"><el-icon size="18px"><Search /></el-icon></span>
      <input type="text" class="searchInput" placeholder="搜索" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/UserStore';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import usePlaza from '@/api/plaza';
import {
  Ticket,
  BellFilled,
  UserFilled,
  List,
  Management,
  Tools,
  MoreFilled,
  Pointer,
  View,
  ChatLineSquare,
  Paperclip,
  More,
  Search,
  HomeFilled,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const userStore = useUserStore();
const router = useRouter();

const goToUserInfo = () => router.push('/user');

const handleNotification = () => ElMessage.info('通知功能开发中');
const handleFavorite = () => ElMessage.info('收藏与点赞功能开发中');
const handleSettings = () => ElMessage.info('设置功能开发中');

const {
  postList,
  userPostContent,
  calculateTimeDifference,
  gainLike,
  gainShare,
  gainView,
  sendPost,
} = usePlaza();
</script>

<style scoped>
/* ===== 全局重置 ===== */
* {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

html,
body {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.page {
  height: 100vh;
  width: 100vw;
  background-color: #fefefe;
}

/* ===== 左侧边栏 ===== */
.plazaPageleftPage {
  position: fixed;
  left: 0;
  top: 80px;
  height: calc(100% - 80px);
  width: 25%;
}

.plazaPageButtonList {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  right: 0;
  overflow: hidden;
}

.plazaPageButtonList button {
  height: 45px;
  width: 70%;
  position: relative;
  left: 100px;
  border-radius: 10px;
  border: none;
  margin-bottom: 10px;
  overflow: hidden;
  background-color: inherit;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 15px;
  cursor: pointer;
}

.plazaPageButtonList button:hover {
  background-color: #dfdfe0;
}

.el-icon {
  margin-right: 20px;
}

.userMes {
  background-color: inherit;
  height: 90px;
  width: 72%;
  position: absolute;
  bottom: 0;
  right: 0;
}

.userMes p {
  position: absolute;
  top: 20px;
  left: 75px;
}

.sign {
  position: absolute;
  right: 10px;
  top: 30px;
  margin-right: 15px;
  cursor: pointer;
}

/* ===== 中间区域 ===== */
.midPage {
  position: absolute;
  left: 25%;
  top: 80px;
  min-height: 500px;
  width: 43%;
  display: flex;
  flex-direction: column;
}

.topBox {
  height: 80px;
  width: 95%;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  border: 1px solid #eeeeee;
  position: relative;
  left: 20px;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.topBox button {
  height: 40px;
  width: 120px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  position: relative;
  left: 20px;
  bottom: -40px;
  background-color: inherit;
  border: none;
}

.secondBox {
  height: 170px;
  width: 95%;
  border: 1px solid #eeeeee;
  position: relative;
  left: 20px;
  overflow: hidden;
  margin-bottom: 10px;
  background: white;
}

.avatar {
  height: 40px;
  width: 40px;
  position: absolute;
  top: 20px;
  left: 25px;
  border-radius: 50%;
  cursor: pointer;
}

.userInput {
  min-height: 80px;
  max-height: 200px;
  width: 80%;
  border-radius: 10px;
  border: none;
  font-size: 15px;
  position: absolute;
  top: 20px;
  left: 85px;
  padding: 10px 15px;
  outline: none;
  background-color: #f1f1f1;
  resize: none;
}

.secondBox button {
  height: 40px;
  width: 72px;
  font-size: 16px;
  font-weight: bold;
  position: absolute;
  right: 35px;
  bottom: 15px;
  border-radius: 10px;
  border: none;
  background-color: #fcd535;
  cursor: pointer;
}

.thirdBox {
  height: 50px;
  width: 95%;
  border: 1px solid #eeeeee;
  position: relative;
  left: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f0b90b;
  margin-bottom: 10px;
}

.thirdBox p {
  cursor: pointer;
}

/* ===== 帖子卡片（只调整内部间距） ===== */
.fourthBox {
  min-height: 200px;
  width: 95%;
  position: relative;
  left: 20px;
  border: 1px solid #eeeeee;
  overflow: hidden;
  margin-bottom: 16px;
  background: white;
  padding: 20px 20px 20px 90px; /* 为头像留出空间 */
}

/* 头像固定在左侧 */
.fourthBox .avatar {
  top: 20px;
  left: 20px;
}

/* 用户名和时间容器 */
.post-header {
  display: flex;
  align-items: baseline;
  gap: 12px; /* 用户名和时间的间距 */
  margin-bottom: 8px;
}

.userName {
  font-weight: bold;
  font-size: 15px;
  color: #333;
}

.lastTime {
  font-size: 12px;
  color: #999;
}

.postFont {
  margin: 12px 0 40px;
}

.postFont h5 {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 6px;
}

.postFont p {
  font-size: 15px;
  color: #444;
}

.likeStrip {
  position: absolute;
  bottom: 15px;
  left: 90px;
  display: flex;
  flex-direction: row;
  gap: 24px;
}

.stripIcon {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #666;
  transition: color 0.2s;
}

.stripIcon:hover {
  color: #f0b90b;
}

.stripIcon p {
  font-size: 13px;
  font-weight: bold;
  margin: 0;
}

/* ===== 右侧搜索 ===== */
.rightPage {
  background-color: inherit;
  position: absolute;
  right: 0;
  top: 80px;
  height: 100%;
  width: 32%;
}

.search {
  position: absolute;
  top: 10px;
  left: 30px;
  z-index: 100;
}

.searchInput {
  position: relative;
  left: 15px;
  height: 40px;
  width: 60%;
  border-radius: 5px;
  padding-left: 40px;
  border: 1px solid #eeeeee;
}
</style>