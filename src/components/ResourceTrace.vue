<template>
  <div class="page">
    <Header />
    <div class="trace-container">
      <h2>资源溯源查询</h2>
      <p class="subtitle">通过区块链记录，查看资源的完整流转历史</p>

      <div class="search-bar">
        <input v-model.number="queryId" type="number" placeholder="输入资源ID" />
        <button @click="fetchTrace">查询</button>
      </div>

      <div v-if="loading" class="loading">查询中...</div>

      <div v-if="resource" class="result-section">
        <div class="resource-card">
          <h3>{{ resource.name }}</h3>
          <p>{{ resource.description }}</p>
          <div class="resource-meta">
            <span>类型：{{ resource.resourceType === 'DIGITAL' ? '电子文档' : '实体物品' }}</span>
            <span>分类：{{ resource.category }}</span>
            <span>积分：{{ resource.pointsCost }}</span>
            <span>状态：{{ statusLabel(resource.status) }}</span>
            <span>借用次数：{{ resource.borrowCount }}</span>
          </div>
        </div>

        <h3 class="timeline-title">流转时间线（共 {{ totalRecords }} 条记录）</h3>
        <div v-if="traceRecords.length === 0" class="empty">暂无流转记录</div>
        <div class="timeline">
          <div v-for="(record, i) in traceRecords" :key="i" class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="type-badge">{{ getTypeLabel(record.record_type) }}</span>
                <span class="time">{{ record.timestamp }}</span>
              </div>
              <div class="timeline-body">
                <p>借用者：{{ shortAddr(record.sender_address) }}</p>
                <p>分享者：{{ shortAddr(record.recipient_address) }}</p>
                <p>积分：{{ record.amount }} 分</p>
                <p v-if="record.tx_hash" class="hash">交易哈希：{{ shortAddr(record.tx_hash) }}</p>
                <p v-if="record.block_number" class="block">区块号：#{{ record.block_number }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/Header.vue';
import request from '@/api/request';

const route = useRoute();
const queryId = ref<number>();
const loading = ref(false);
const resource = ref<any>(null);
const traceRecords = ref<any[]>([]);
const totalRecords = ref(0);

const fetchTrace = async () => {
  if (!queryId.value) {
    alert('请输入资源ID');
    return;
  }
  loading.value = true;
  resource.value = null;
  traceRecords.value = [];
  try {
    const res = await request.get<any>('/resource/trace/' + queryId.value);
    if (res.code === 200 && res.data) {
      resource.value = res.data.resource;
      traceRecords.value = res.data.traceRecords || [];
      totalRecords.value = res.data.totalRecords || 0;
    } else {
      alert(res.msg || '查询失败');
    }
  } catch (e) {
    alert('网络错误');
  } finally {
    loading.value = false;
  }
};

const shortAddr = (addr: string) => addr || '-';

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    BORROW_REQUEST: '借用申请',
    CONFIRM_RECEIVED: '确认收到',
    RETURN: '归还',
  };
  return map[type] || type;
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    AVAILABLE: '可借用',
    LENT: '已借出',
    OFFLINE: '已下架',
  };
  return map[status] || status;
};

onMounted(() => {
  const id = route.params.id;
  if (id) {
    queryId.value = Number(id);
    fetchTrace();
  }
});
</script>

<style scoped>
.page { min-height: 100vh; background: #fefefe; }
.trace-container {
  max-width: 800px;
  margin: 80px auto 0;
  padding: 2rem;
}
.trace-container h2 { font-size: 24px; font-weight: bold; }
.subtitle { color: #888; margin-bottom: 24px; }
.search-bar { display: flex; gap: 12px; margin-bottom: 24px; }
.search-bar input {
  flex: 1;
  height: 44px;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 15px;
}
.search-bar button {
  padding: 0 32px;
  background: #F0B90B;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}
.loading { text-align: center; padding: 40px; color: #888; }
.resource-card {
  background: #f7f7f7;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
}
.resource-card h3 { font-size: 20px; margin-bottom: 8px; }
.resource-card p { color: #666; margin-bottom: 12px; }
.resource-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #888; }
.timeline-title { font-size: 18px; margin-bottom: 16px; }
.empty { text-align: center; color: #aaa; padding: 30px; }
.timeline { position: relative; padding-left: 24px; }
.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #eee;
}
.hash, .block {
  word-break: break-all;
  white-space: normal;
}
.timeline-item { position: relative; margin-bottom: 20px; }
.timeline-dot {
  position: absolute;
  left: -20px;
  top: 6px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #F0B90B;
  border: 2px solid white;
}
.timeline-content {
  background: #f9f9f9;
  border-radius: 12px;
  padding: 16px;
}
.timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.type-badge {
  background: #F0B90B;
  color: white;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}
.time { font-size: 12px; color: #999; }
.timeline-body p { font-size: 13px; color: #555; margin: 4px 0; }
.hash, .block { font-family: monospace; font-size: 12px; color: #999; }
</style>