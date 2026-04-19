<template>
  <div class="page">
    <Header />
    <div class="publish-container">
      <div class="publish-hero">
        <div class="hero-left">
          <h1>校园资源共享</h1>
          <p>发布闲置资源，赚取信用积分；借用他人资源，方便校园生活</p>
          <div class="hero-buttons">
            <button class="btn-primary" @click="goToPublish">发布资源</button>
            <button class="btn-secondary" @click="goToTransaction">借用资源</button>
          </div>
        </div>
        <div class="hero-right">
          <div class="hero-illustration">
            <div class="illust-icon">📚</div>
            <div class="illust-icon">📱</div>
            <div class="illust-icon">⚽</div>
            <div class="illust-icon">📝</div>
          </div>
        </div>
      </div>

      <!-- 功能入口卡片 -->
      <div class="feature-grid" v-if="!showPublishForm">
        <div class="feature-card" @click="goToAccount">
          <span class="card-icon">🔑</span>
          <h3>创建区块链账户</h3>
          <p>生成密钥对，用于资源共享交易的数字签名</p>
        </div>
        <div class="feature-card" @click="goToAllResources">
          <span class="card-icon">📋</span>
          <h3>浏览全部资源</h3>
          <p>查看校园中所有可借用的共享资源</p>
        </div>
        <div class="feature-card" @click="goToTransaction">
          <span class="card-icon">💰</span>
          <h3>积分交易</h3>
          <p>使用ECDSA签名完成借用和归还操作</p>
        </div>
        <div class="feature-card">
          <span class="card-icon">🔍</span>
          <h3>资源溯源</h3>
          <p>输入资源ID查看流转历史</p>
          <div class="trace-input">
            <input v-model.number="traceResourceId" placeholder="资源ID" type="number" />
            <button @click="goToTrace">查询</button>
          </div>
        </div>
      </div>

      <!-- 发布资源表单 -->
      <div v-if="showPublishForm" class="publish-form">
        <h3>发布新资源</h3>
        <input v-model="resourceName" placeholder="资源名称" />
        <textarea v-model="resourceDesc" placeholder="资源描述（状态、规格等详细信息）" rows="3"></textarea>
        <select v-model="resourceType">
          <option value="">请选择资源类型</option>
          <option value="PHYSICAL">实体物品（教材、设备等）</option>
          <option value="DIGITAL">电子文档（笔记、PDF等）</option>
        </select>
        <select v-model="category">
          <option value="">请选择分类</option>
          <option value="教材">教材</option>
          <option value="学习笔记">学习笔记</option>
          <option value="电子设备">电子设备</option>
          <option value="体育器材">体育器材</option>
          <option value="日常用品">日常用品</option>
          <option value="其他">其他</option>
        </select>
        <input v-model.number="pointsCost" type="number" placeholder="借用所需积分" />
        <div class="form-actions">
          <button class="btn-primary" @click="publishResource">发布</button>
          <button class="btn-cancel" @click="showPublishForm = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import { useUserStore } from '@/store/UserStore';
import request from '@/api/request';

const router = useRouter();
const userStore = useUserStore();

const showPublishForm = ref(false);
const resourceName = ref('');
const resourceDesc = ref('');
const resourceType = ref('');
const category = ref('');
const pointsCost = ref<number>();
const traceResourceId = ref<number>();

const goToAccount = () => router.push('/account');
const goToTransaction = () => router.push('/transaction');
const goToAllResources = () => router.push('/resources');
const goToPublish = () => {
  if (!userStore.token) {
    alert('请先登录');
    router.push('/login');
    return;
  }
  showPublishForm.value = true;
};

const goToTrace = () => {
  if (!traceResourceId.value) {
    alert('请输入资源ID');
    return;
  }
  router.push('/trace/' + traceResourceId.value);
};

const publishResource = async () => {
  if (!resourceName.value || !resourceType.value || !category.value || !pointsCost.value) {
    alert('请填写完整信息');
    return;
  }
  try {
    const res = await request.post('/resource/publish', {
      name: resourceName.value,
      description: resourceDesc.value,
      resourceType: resourceType.value,
      category: category.value,
      pointsCost: pointsCost.value,
    });
    if (res.code === 200) {
      alert('资源发布成功！资源ID: ' + res.data);
      showPublishForm.value = false;
      resourceName.value = '';
      resourceDesc.value = '';
      resourceType.value = '';
      category.value = '';
      pointsCost.value = undefined;
    } else {
      alert('发布失败：' + res.msg);
    }
  } catch (e) {
    alert('网络错误');
  }
};
</script>

<style scoped>
.page { min-height: 100vh; background: #fefefe; }
.publish-container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 90px 2rem 2rem;
}
.publish-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40px;
}
.hero-left { max-width: 500px; }
.hero-left h1 { font-size: 36px; font-weight: bold; margin-bottom: 12px; }
.hero-left p { font-size: 16px; color: #666; margin-bottom: 24px; line-height: 1.6; }
.hero-buttons { display: flex; gap: 16px; }
.btn-primary {
  padding: 12px 32px;
  background: #F0B90B;
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
}
.btn-primary:hover { background: #d4a40a; }
.btn-secondary {
  padding: 12px 32px;
  background: white;
  color: #333;
  border: 2px solid #ddd;
  border-radius: 30px;
  font-size: 16px;
  cursor: pointer;
}
.btn-secondary:hover { border-color: #F0B90B; color: #F0B90B; }
.hero-right { flex-shrink: 0; }
.hero-illustration {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 20px;
}
.illust-icon {
  width: 100px;
  height: 100px;
  background: #f7f7f7;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}
.feature-card {
  background: #f7f7f7;
  border-radius: 16px;
  padding: 28px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.feature-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.card-icon { font-size: 32px; }
.feature-card h3 { font-size: 18px; margin: 10px 0 6px; }
.feature-card p { color: #666; font-size: 14px; }
.trace-input { display: flex; gap: 8px; margin-top: 12px; }
.trace-input input {
  flex: 1;
  height: 38px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 14px;
}
.trace-input button {
  padding: 0 20px;
  background: #333;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
.publish-form {
  background: #f7f7f7;
  border-radius: 16px;
  padding: 30px;
  max-width: 500px;
  margin: 0 auto;
}
.publish-form h3 { font-size: 20px; margin-bottom: 16px; }
.publish-form input,
.publish-form textarea,
.publish-form select {
  display: block;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  box-sizing: border-box;
}
.form-actions { display: flex; gap: 12px; margin-top: 8px; }
.btn-cancel {
  flex: 1;
  padding: 12px;
  background: #eee;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
}
.form-actions .btn-primary { flex: 1; border-radius: 8px; }
</style>