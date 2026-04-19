<template>
  <div class="page">
    <Header />

    <!-- 隐藏的文件上传 input，已不再需要（保留可选用） -->
    <input
      ref="privateKeyFileInput"
      type="file"
      accept=".key,.txt,text/plain"
      style="display: none"
      @change="handlePrivateKeyFileSelected"
    />

    <!-- 解锁密码对话框 -->
    <el-dialog v-model="showUnlockDialog" title="解锁钱包" width="400px">
      <el-input v-model="unlockPassword" type="password" placeholder="请输入钱包密码" show-password />
      <template #footer>
        <el-button @click="showUnlockDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUnlockAndContinue">解锁并继续</el-button>
      </template>
    </el-dialog>

    <div class="profile-layout">
      <div class="sidebar">
        <button :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">
          <el-icon :size="17"><HomeFilled /></el-icon>总览
        </button>
        <button :class="{ active: activeTab === 'myResources' }" @click="activeTab = 'myResources'; loadMyResources()">
          <el-icon :size="17"><Goods /></el-icon>我的共享
        </button>
        <button :class="{ active: activeTab === 'borrowed' }" @click="activeTab = 'borrowed'; loadBorrowed()">
          <el-icon :size="17"><List /></el-icon>我的借用
        </button>
        <button :class="{ active: activeTab === 'account' }" @click="goToAccount">
          <el-icon :size="17"><Key /></el-icon>区块链账户
        </button>
        <button :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">
          <el-icon :size="17"><Tools /></el-icon>设置
        </button>
        <button class="logout-btn" @click="logout">
          <el-icon :size="17"><SwitchButton /></el-icon>退出登录
        </button>
      </div>

      <div class="main-content">
        <div class="user-card">
          <div class="user-avatar">
            <el-icon :size="48" style="color: #ccc;"><UserFilled /></el-icon>
          </div>
          <div class="user-info">
            <h3>{{ userStore.nickName || '未设置昵称' }}</h3>
            <p>UID: {{ userStore.id || '-' }}</p>
            
            <p v-if="userStore.address" class="public-key">
              区块链地址: 
              <span class="key-text">{{ userStore.address }}</span>
              <el-button size="small" @click="copyPublicKey">复制</el-button>
            </p>
            <p v-else style="color: #F0B90B;">尚未创建区块链账户，请前往"区块链账户"创建</p>
          </div>
          
          <div class="user-stats">
            <div class="stat-item">
              <span class="stat-value" style="color: #F0B90B;">{{ userStore.balance }}</span>
              <span class="stat-label">信用积分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ follow }}</span>
              <span class="stat-label">已关注</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ fans }}</span>
              <span class="stat-label">粉丝</span>
            </div>
          </div>
        </div>

        <!-- 总览 -->
        <div v-if="activeTab === 'overview'" class="tab-content">
          <h3>快捷操作</h3>
          <div class="quick-actions">
            <div class="action-card" @click="$router.push('/publish')">
              <span class="action-icon">📤</span>
              <h4>发布资源</h4>
              <p>分享闲置物品赚积分</p>
            </div>
            <div class="action-card" @click="$router.push('/transaction')">
              <span class="action-icon">📥</span>
              <h4>借用资源</h4>
              <p>消耗积分借用资源</p>
            </div>
            <div class="action-card" @click="$router.push('/trace')">
              <span class="action-icon">🔍</span>
              <h4>溯源查询</h4>
              <p>查看资源区块链记录</p>
            </div>
            <div class="action-card" @click="goToAccount">
              <span class="action-icon">🔑</span>
              <h4>区块链账户</h4>
              <p>管理密钥和签名</p>
            </div>
          </div>
        </div>

        <!-- 我的共享 -->
        <div v-if="activeTab === 'myResources'" class="tab-content">
          <h3>我发布的资源</h3>
          <div v-if="myResources.length === 0" class="empty-state">你还没有发布任何资源</div>
          <div v-for="item in myResources" :key="item.id" class="resource-row">
            <span class="row-name">{{ item.name }}</span>
            <span class="row-category">{{ item.category }}</span>
            <span class="row-cost">{{ item.pointsCost }} 积分</span>
            <span :class="['row-status', item.status === 'AVAILABLE' ? 'status-ok' : 'status-lent']">
              {{ item.status === 'AVAILABLE' ? '可借用' : item.status === 'LENT' ? '已借出' : '已下架' }}
            </span>
          </div>
        </div>

        <!-- 我的借用 -->
        <div v-if="activeTab === 'borrowed'" class="tab-content">
          <h3>我正在借用的资源</h3>
          <div v-if="borrowedResources.length === 0" class="empty-state">你还没有借用任何资源</div>
          <div v-for="item in borrowedResources" :key="item.id" class="resource-row">
            <span class="row-name">{{ item.name }}</span>
            <span class="row-category">{{ item.category }}</span>
            <span class="row-cost">{{ item.pointsCost }} 积分</span>
            <span class="row-owner">来自 {{ item.ownerName || '匿名' }}</span>
            
            <!-- 状态标签 -->
            <span :class="['row-status', item.status === 'PENDING' ? 'status-pending' : 'status-lent']">
              {{ item.status === 'PENDING' ? '待确认' : '已借出' }}
            </span>
            
            <!-- 操作按钮 -->
            <div class="row-actions">
              <el-button 
                v-if="item.status === 'PENDING'" 
                type="primary" 
                size="small" 
                @click="confirmReceive(item)">
                确认收到
              </el-button>
              <el-button 
                v-if="item.status === 'LENT'" 
                type="success" 
                size="small" 
                @click="returnResource(item)">
                归还
              </el-button>
            </div>
          </div>
        </div>

        <!-- 设置 -->
        <div v-if="activeTab === 'settings'" class="tab-content">
          <h3>账户设置</h3>
          <p style="color:#888; margin-top:12px;">设置功能开发中，敬请期待</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Header from '@/components/Header.vue';
import { useUserStore } from '@/store/UserStore';
import { HomeFilled, Goods, List, Key, Tools, SwitchButton, UserFilled } from '@element-plus/icons-vue';
import request from '@/api/request';
import { ElMessage } from 'element-plus';
import { signResourceMessage, getPublicKeyFromPrivate } from '@/utils/eccUtil';
import CryptoJS from 'crypto-js';

const router = useRouter();
const userStore = useUserStore();

const activeTab = ref('overview');
const follow = ref(0);
const fans = ref(0);
const myResources = ref<any[]>([]);
const borrowedResources = ref<any[]>([]);

// 解锁对话框相关
const showUnlockDialog = ref(false);
const unlockPassword = ref('');
const pendingResource = ref<any>(null);
const pendingAction = ref<'confirm' | 'return' | null>(null);

// 文件上传相关（保留备用，但主要使用内存私钥）
const privateKeyFileInput = ref<HTMLInputElement | null>(null);
const privateKeyContent = ref('');  // 添加缺失的变量声明

const getUserAddress = (): string => {
  return userStore.address || userStore.publicKeyHex || '';
};

const goToAccount = () => router.push('/account');

const logout = () => {
  userStore.clearToken();
  router.push('/');
};

const loadMyResources = async () => {
  try {
    const res = await request.get<any[]>('/resource/my');
    if (res.code === 200) myResources.value = res.data || [];
  } catch (e) { console.warn('加载我的资源失败'); }
};

const loadBorrowed = async () => {
  try {
    const res = await request.get<any[]>('/resource/borrowed');
    if (res.code === 200) borrowedResources.value = res.data || [];
  } catch (e) { console.warn('加载借用资源失败'); }
};

const copyPublicKey = async () => {
  if (userStore.address) {
    await navigator.clipboard.writeText(userStore.address);
    ElMessage.success('区块链地址已复制到剪贴板');
  }
};

const getCurrentTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.` +
         `${pad(now.getMilliseconds(), 3)}`;  // 关键：毫秒固定3位
};

// 处理私钥文件上传（备用方法，当用户想用文件而非密码时使用）
const handlePrivateKeyFileSelected = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) {
    pendingResource.value = null;
    pendingAction.value = null;
    return;
  }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const content = (e.target?.result as string).trim();
    privateKeyContent.value = content;
    
    // 尝试判断是明文私钥还是加密内容
    if (/^[0-9a-fA-F]{64}$/.test(content)) {
      // 明文私钥
      const derivedPublicKey = getPublicKeyFromPrivate(content);
      if (derivedPublicKey !== userStore.publicKeyHex) {
        ElMessage.error('私钥与当前账户不匹配');
        (event.target as HTMLInputElement).value = '';
        pendingResource.value = null;
        pendingAction.value = null;
        return;
      }
      userStore.unlockWallet(content);
      // 继续执行待处理操作
      if (pendingAction.value === 'confirm') {
        await doConfirmReceive(pendingResource.value);
      } else if (pendingAction.value === 'return') {
        await doReturnResource(pendingResource.value);
      }
      pendingResource.value = null;
      pendingAction.value = null;
    } else {
      // 加密内容，弹出密码输入框
      showUnlockDialog.value = true;
    }
    (event.target as HTMLInputElement).value = '';
  };
  reader.readAsText(file);
};

// 密码解锁并继续操作
const handleUnlockAndContinue = async () => {
  if (!privateKeyContent.value) {
    ElMessage.error('未加载私钥文件');
    return;
  }
  try {
    const bytes = CryptoJS.AES.decrypt(privateKeyContent.value, unlockPassword.value);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    if (!decrypted || !/^[0-9a-fA-F]{64}$/.test(decrypted)) {
      ElMessage.error('密码错误或私钥无效');
      return;
    }
    const pubKey = getPublicKeyFromPrivate(decrypted);
    if (pubKey !== userStore.publicKeyHex) {
      ElMessage.error('私钥与当前账户不匹配');
      return;
    }
    userStore.unlockWallet(decrypted);
    showUnlockDialog.value = false;
    unlockPassword.value = '';
    
    if (pendingAction.value === 'confirm') {
      await doConfirmReceive(pendingResource.value);
    } else if (pendingAction.value === 'return') {
      await doReturnResource(pendingResource.value);
    }
    pendingResource.value = null;
    pendingAction.value = null;
    privateKeyContent.value = '';
  } catch {
    ElMessage.error('解密失败');
  }
};

// 实际确认收到
const doConfirmReceive = async (resource: any) => {
  if (!userStore.isWalletUnlocked()) {
    ElMessage.error('钱包未解锁，请先解锁');
    return;
  }

  const timestamp = getCurrentTimestamp();
  const msg = {
    senderAddress: userStore.address,
    recipientAddress: resource.ownerAddress,
    amount: resource.pointsCost,
    timestamp,
    resourceId: resource.id,
    recordType: 'CONFIRM_RECEIVED',
  };

  const sig = signResourceMessage(userStore.privateKey, msg);

  const payload = {
    senderAddress: userStore.address,
    recipientAddress: resource.ownerAddress,
    amount: resource.pointsCost,
    timestamp,
    signature: { r: sig.r, s: sig.s },
    publicKey: userStore.address,
    resourceId: resource.id,
    resourceName: resource.name,
    resourceType: resource.resourceType,
    recordType: 'CONFIRM_RECEIVED',
    gasUsed: 1,
  };

  try {
    const res = await request.post('/transaction/sendAmount', payload);
    if (res.code === 200) {
      ElMessage.success('确认成功，积分已转移');
      loadBorrowed();
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (e) {
    ElMessage.error('网络错误，请重试');
  }
};

// 实际归还
const doReturnResource = async (resource: any) => {
  if (!userStore.isWalletUnlocked()) {
    ElMessage.error('钱包未解锁，请先解锁');
    return;
  }

  const timestamp = getCurrentTimestamp();
  const msg = {
    senderAddress: userStore.address,
    recipientAddress: resource.ownerAddress,
    amount: 0,
    timestamp,
    resourceId: resource.id,
    recordType: 'RETURN',
  };

  const sig = signResourceMessage(userStore.privateKey, msg);

  const payload = {
    senderAddress: userStore.address,
    recipientAddress: resource.ownerAddress,
    amount: 0,
    timestamp,
    signature: { r: sig.r, s: sig.s },
    publicKey: userStore.address,
    resourceId: resource.id,
    resourceName: resource.name,
    resourceType: resource.resourceType,
    recordType: 'RETURN',
    gasUsed: 1,
  };

  try {
    const res = await request.post('/transaction/sendAmount', payload);
    if (res.code === 200) {
      ElMessage.success('归还成功');
      loadBorrowed();
    } else {
      ElMessage.error(res.msg || '操作失败');
    }
  } catch (e) {
    ElMessage.error('网络错误，请重试');
  }
};

// 对外确认收到（优先使用内存私钥）
const confirmReceive = (resource: any) => {
  const address = getUserAddress();
  if (!address) {
    ElMessage.warning('请先创建区块链账户');
    return;
  }
  if (!userStore.address) userStore.address = address;

  if (userStore.isWalletUnlocked()) {
    doConfirmReceive(resource);
  } else {
    // 未解锁，尝试从本地加密存储中读取（如果存在）
    const encrypted = localStorage.getItem(`wallet_${userStore.id}`);
    if (encrypted) {
      privateKeyContent.value = encrypted;
      pendingResource.value = resource;
      pendingAction.value = 'confirm';
      showUnlockDialog.value = true;
    } else {
      // 没有加密私钥，提示用户上传文件
      ElMessage.warning('请先解锁钱包（点击Header中的钱包状态）');
    }
  }
};

// 对外归还
const returnResource = (resource: any) => {
  const address = getUserAddress();
  if (!address) {
    ElMessage.warning('请先创建区块链账户');
    return;
  }
  if (!userStore.address) userStore.address = address;

  if (userStore.isWalletUnlocked()) {
    doReturnResource(resource);
  } else {
    const encrypted = localStorage.getItem(`wallet_${userStore.id}`);
    if (encrypted) {
      privateKeyContent.value = encrypted;
      pendingResource.value = resource;
      pendingAction.value = 'return';
      showUnlockDialog.value = true;
    } else {
      ElMessage.warning('请先解锁钱包（点击Header中的钱包状态）');
    }
  }
};

onMounted(async () => {
  if (userStore.token) {
    await userStore.initUser();
    try {
      const [fansRes, followRes] = await Promise.all([
        request.get<number>('/userInfo/userFans'),
        request.get<number>('/userInfo/userFollow'),
      ]);
      if (fansRes.code === 200) fans.value = fansRes.data || 0;
      if (followRes.code === 200) follow.value = followRes.data || 0;
    } catch (e) {
      console.warn('加载用户数据失败');
    }
  } else {
    router.push('/login');
  }
});
</script>

<style scoped>
.page { min-height: 100vh; background: #fefefe; }
.profile-layout { display: flex; max-width: 1200px; margin: 70px auto 0; padding: 20px; gap: 24px; }
.sidebar {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
}
.sidebar button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 20px;
  background: #f7f7f7;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}
.sidebar button:hover { background: #f0f0f0; }
.sidebar button.active { background: #FFF8E1; color: #F0B90B; font-weight: bold; }
.logout-btn { margin-top: auto; color: #999 !important; }
.logout-btn:hover { color: #e74c3c !important; }

.main-content { flex: 1; }
.user-card {
  display: flex;
  align-items: center;
  background: #f7f7f7;
  border-radius: 16px;
  padding: 24px;
  gap: 20px;
  margin-bottom: 24px;
}
.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 16px;
  background: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.user-info { flex: 1; }
.user-info h3 { font-size: 20px; margin-bottom: 4px; }
.user-info p { font-size: 13px; color: #888; margin: 2px 0; }
.user-stats { display: flex; gap: 32px; }
.stat-item { text-align: center; }
.stat-value { display: block; font-size: 24px; font-weight: bold; }
.stat-label { font-size: 12px; color: #888; }

.tab-content h3 { font-size: 18px; margin-bottom: 16px; }
.quick-actions { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.action-card {
  background: #f7f7f7;
  border-radius: 14px;
  padding: 24px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.action-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
.action-icon { font-size: 28px; }
.action-card h4 { font-size: 16px; margin: 8px 0 4px; }
.action-card p { font-size: 13px; color: #888; }

.empty-state { text-align: center; color: #aaa; padding: 40px; }
.resource-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f9f9f9;
  border-radius: 10px;
  margin-bottom: 8px;
  font-size: 14px;
  flex-wrap: wrap;
}
.row-name { flex: 1 1 120px; font-weight: 500; }
.row-category { width: 90px; color: #888; }
.row-cost { width: 80px; font-weight: bold; color: #F0B90B; }
.row-owner { width: 120px; color: #888; font-size: 13px; }
.row-status { width: 70px; font-size: 13px; }
.status-ok { color: #27ae60; }
.status-lent { color: #e67e22; }
.status-pending { color: #e6a23c; }
.row-actions { margin-left: auto; display: flex; gap: 8px; }

.public-key {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.key-text {
  font-family: monospace;
  font-size: 13px;
  word-break: break-all;
  max-width: 280px;
}
</style>