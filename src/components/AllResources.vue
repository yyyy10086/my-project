<template>
  <div class="page">
    <Header />
    <div class="resources-container">
      <h2>全部共享资源</h2>
      <div class="filter-bar">
        <input v-model="searchKeyword" placeholder="搜索资源..." @keyup.enter="doSearch" />
        <select v-model="selectedCategory" @change="filterByCategory">
          <option value="">全部分类</option>
          <option value="教材">教材</option>
          <option value="学习笔记">学习笔记</option>
          <option value="电子设备">电子设备</option>
          <option value="体育器材">体育器材</option>
          <option value="日常用品">日常用品</option>
          <option value="其他">其他</option>
        </select>
        <button class="search-btn" @click="doSearch">搜索</button>
      </div>
      <div v-loading="resourceStore.loading" class="resource-grid">
        <div v-for="item in resourceStore.resources" :key="item.id" class="resource-card"
             @click="$router.push('/trace/' + item.id)">
          <div class="card-header">
            <span class="card-icon">{{ getCategoryIcon(item.category) }}</span>
            <span class="card-id">ID: {{ item.id }}</span>
            <span :class="['status-badge', item.status]">{{ statusLabel(item.status) }}</span>
        </div>
          <h4>{{ item.name }}</h4>
          <p class="desc">{{ item.description || '暂无描述' }}</p>
          <div class="card-meta">
            <span class="cost">{{ item.pointsCost }} 积分</span>
            <span class="type-tag">{{ item.resourceType === 'DIGITAL' ? '电子文档' : '实体物品' }}</span>
            <span :class="['status-tag', getStatusClass(item.status)]">
              {{ getStatusLabel(item.status) }}
            </span>
          </div>
          <div class="card-footer">
            <span>{{ item.ownerName || '匿名' }} 分享</span>
            <span>借用 {{ item.borrowCount }} 次</span>
          </div>
          <div class="card-tip">点击查看溯源记录</div>
          <button class="borrow-btn" @click.stop="goToBorrow(item)">借用</button>
        </div>
        <div v-if="resourceStore.resources.length === 0 && !resourceStore.loading" class="empty">
          暂无资源
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Header from '@/components/Header.vue';
import { useResourceStore, type ResourceItem } from '@/store/resource';
import request from '@/api/request';
import { useRouter } from 'vue-router'

const router = useRouter()


const resourceStore = useResourceStore();
const searchKeyword = ref('');
const selectedCategory = ref('');

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    '教材': '📚', '学习笔记': '📝', '电子设备': '📱',
    '体育器材': '⚽', '日常用品': '🎒', '其他': '📦',
  };
  return icons[category] || '📦';
};

const doSearch = () => {
  if (searchKeyword.value.trim()) {
    resourceStore.searchResources(searchKeyword.value.trim());
  } else {
    resourceStore.fetchAllResources();
  }
};

const filterByCategory = () => {
  if (selectedCategory.value) {
    resourceStore.searchResources(selectedCategory.value);
  } else {
    resourceStore.fetchAllResources();
  }
};

const fetchAllResources = async () => {
    resourceStore.loading = true;
    const res = await request.get<ResourceItem[]>('/resource/all');
    if (res.code === 200) resourceStore.resources = res.data;
    resourceStore.loading = false;
};

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    AVAILABLE: '可借用',
    PENDING: '待确认',
    LENT: '已借出',
    OFFLINE: '已下架',
  };
  return map[status] || status;
};

const getStatusClass = (status: string) => {
  return {
    'status-available': status === 'AVAILABLE',
    'status-pending': status === 'PENDING',
    'status-lent': status === 'LENT',
    'status-offline': status === 'OFFLINE',
  };
};

const statusLabel = (status: string) => {
    const map: Record<string, string> = {
        AVAILABLE: '可借用',
        LENT: '已借出',
        PENDING: '待确认',
        OFFLINE: '已下架'
    };
    return map[status] || status;
};

const goToBorrow = (resource: ResourceItem) => {
  router.push({ name: 'transaction', query: { resourceId: resource.id } })
}

onMounted(() => resourceStore.fetchAllResources());
</script>

<style scoped>
.page { min-height: 100vh; background: #fefefe; }
.resources-container {
  max-width: 1100px;
  margin: 80px auto 0;
  padding: 2rem;
}
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}
.status-available { background: #e1f3d8; color: #27ae60; }
.status-pending { background: #fef0e6; color: #e6a23c; }
.status-lent { background: #e6f7ff; color: #1890ff; }
.status-offline { background: #f5f5f5; color: #999; }
.resources-container h2 { font-size: 24px; margin-bottom: 20px; }
.filter-bar { display: flex; gap: 12px; margin-bottom: 24px; }
.filter-bar input {
  flex: 1; height: 40px; border: 1px solid #ddd; border-radius: 10px;
  padding: 0 16px; font-size: 14px;
}
.filter-bar select {
  height: 40px; border: 1px solid #ddd; border-radius: 10px;
  padding: 0 12px; font-size: 14px;
}
.search-btn {
  padding: 0 24px; background: #F0B90B; color: white; border: none;
  border-radius: 10px; font-weight: bold; cursor: pointer;
}
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.resource-card {
  background: #f7f7f7;
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: box-shadow 0.2s;
  position: relative;
}
.resource-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.resource-card:hover .card-tip { opacity: 1; }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.card-icon { font-size: 28px; }
.card-id { font-size: 12px; color: #aaa; background: #eee; padding: 2px 8px; border-radius: 4px; }
.resource-card h4 { font-size: 16px; margin-bottom: 6px; }
.desc { font-size: 13px; color: #888; margin-bottom: 10px; height: 36px; overflow: hidden; }
.card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.cost { font-weight: bold; color: #F0B90B; }
.type-tag { font-size: 12px; color: #888; background: #eee; padding: 2px 8px; border-radius: 4px; }
.card-footer { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
.card-tip {
  position: absolute;
  bottom: 8px;
  right: 16px;
  font-size: 11px;
  color: #F0B90B;
  opacity: 0;
  transition: opacity 0.2s;
}
.empty { grid-column: 1 / -1; text-align: center; padding: 60px; color: #aaa; }
.status-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    margin-left: 8px;
}
.status-badge.AVAILABLE { background: #e1f3d8; color: #67c23a; }
.status-badge.LENT { background: #fef0f0; color: #f56c6c; }
.status-badge.PENDING { background: #fdf6ec; color: #e6a23c; }
.status-badge.OFFLINE { background: #f4f4f5; color: #909399; }
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;
}
.borrow-btn {
  margin-top: 12px;
  width: 100%;
  padding: 8px 0;
  background-color: #F0B90B;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.borrow-btn:hover {
  background-color: #d4a40a;
}
.status-available {
  background: #e1f3d8;
  color: #67c23a;
}
.status-unavailable {
  background: #fef0f0;
  color: #f56c6c;
}
</style>