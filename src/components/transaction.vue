<template>
  <div class="page">
    <Header />

    <div class="transaction-container">
      <h2>资源借用中心</h2>
      <el-alert
        title="提示"
        type="info"
        description="申请借用后，请在我的借用页面确认收到；确认后积分才会转移。归还资源也需在此选择“归还”类型并签名。"
        show-icon
        :closable="false"
      />

      <!-- 未解锁时显示文件上传和密码输入 -->
      <div v-if="!isLoggedIn" class="login-box">
        <h3>请上传您的私钥文件</h3>
        <p>每次交易需要私钥签名，私钥仅临时使用，不会存储</p>
        <input type="file" @change="handlePrivateKeyFile" accept=".key,.txt" />
        <input v-model="passwordInput" type="password" placeholder="私钥加密密码（如未加密可不填）" />
        <button @click="loginWithPrivateKey" :disabled="!privateKeyContent" class="unlock-btn">
          解锁账户
        </button>
      </div>

      <!-- 已解锁后显示借用表单 -->
      <div v-else class="trade-box">
        <div class="info-bar">
          <span>当前积分：<strong>{{ money }} 分</strong></span>
        </div>

        <div class="form-section">
          <h3>选择要借用的资源</h3>
          <el-select
            v-model="selectedResource"
            filterable
            placeholder="搜索或选择资源"
            @change="onResourceSelect"
            style="width: 100%; margin-bottom: 20px;"
          >
            <el-option
              v-for="res in availableResources"
              :key="res.id"
              :label="`${res.name} (${res.pointsCost}积分)`"
              :value="res"
            />
          </el-select>

          <h4 style="margin: 10px 0 8px; color: #666;">借用信息（自动填写）</h4>
          <div class="auto-field">
            <span class="label">分享者公钥地址</span>
            <input v-model="recipientAddress" readonly />
          </div>
          <div class="auto-field">
            <span class="label">资源ID</span>
            <input v-model="resourceId" readonly />
          </div>
          <div class="auto-field">
            <span class="label">资源名称</span>
            <input v-model="resourceName" readonly />
          </div>

          <h4 style="margin: 24px 0 8px; color: #666;">借用参数</h4>
          <input v-model.number="amount" type="number" placeholder="积分数量" readonly />
          <select v-model="recordType">
            <option value="BORROW_REQUEST">借用申请</option>
            <option value="CONFIRM_RECEIVED">确认收到（积分转移）</option>
            <option value="RETURN">归还资源</option>
          </select>

          <button @click="sendTransaction" class="submit-btn">
            提交（ECDSA签名）
          </button>
        </div>

        <div class="history-section">
          <h3>最近操作记录</h3>
          <div v-if="localRecords.length === 0" class="empty">暂无记录</div>
          <div v-for="(record, i) in localRecords" :key="i" class="record-item">
            <span class="record-type">{{ getTypeLabel(record.recordType) }}</span>
            <span class="record-name">{{ record.resourceName }}</span>
            <span class="record-amount">{{ record.amount }} 积分</span>
            <span class="record-time">{{ record.time }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Header from '@/components/Header.vue'
import { useUserStore } from '@/store/UserStore'
import { getPublicKeyFromPrivate, signResourceMessage, type ResourceTransaction } from '@/utils/eccUtil'
import request from '@/api/request'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'

const userStore = useUserStore()

const isLoggedIn = ref(userStore.isWalletUnlocked())
const privateKeyContent = ref('')
const passwordInput = ref('')

const money = ref<number>(0)
const availableResources = ref<any[]>([])
const selectedResource = ref<any>(null)
const recipientAddress = ref('')
const amount = ref<number>()
const resourceId = ref<number>()
const resourceName = ref('')
const recordType = ref('BORROW_REQUEST')

interface LocalRecord {
  recordType: string
  resourceName: string
  amount: number
  time: string
}
const localRecords = ref<LocalRecord[]>([])

// 处理私钥文件上传
const handlePrivateKeyFile = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    privateKeyContent.value = (e.target?.result as string).trim()
    ElMessage.success('私钥已加载，输入密码后点击解锁')
  }
  reader.readAsText(file)
}

// 解锁账户
const loginWithPrivateKey = () => {
  if (!privateKeyContent.value) {
    ElMessage.warning('请先上传私钥文件')
    return
  }
  const encrypted = privateKeyContent.value
  try {
    let decryptedKey = ''
    if (/^[0-9a-fA-F]{64}$/.test(encrypted)) {
      decryptedKey = encrypted
    } else {
      if (!passwordInput.value) {
        ElMessage.warning('请输入私钥加密密码')
        return
      }
      const bytes = CryptoJS.AES.decrypt(encrypted, passwordInput.value)
      decryptedKey = bytes.toString(CryptoJS.enc.Utf8)
      if (!decryptedKey) {
        ElMessage.error('密码错误或私钥文件无效')
        return
      }
    }
    // 计算公钥并验证
    const derivedPublicKey = getPublicKeyFromPrivate(decryptedKey)
    if (derivedPublicKey !== userStore.publicKeyHex) {
      ElMessage.error('私钥与当前账户绑定的公钥不匹配')
      return
    }
    userStore.unlockWallet(decryptedKey)
    isLoggedIn.value = true
    privateKeyContent.value = ''
    passwordInput.value = ''
    fetchBalance()
    loadAvailableResources()
  } catch (e) {
    ElMessage.error('解锁失败')
  }
}

// 获取积分余额
const fetchBalance = async () => {
  if (!userStore.publicKeyHex) return
  const res = await request.get<number>('/userInfo/userAddress', {
    params: { public_key: userStore.publicKeyHex },
  })
  if (res.code === 200) money.value = res.data || 0
}

// 加载可用资源列表
const loadAvailableResources = async () => {
  const res = await request.get<any[]>('/resource/list')
  if (res.code === 200) availableResources.value = res.data || []
}

// 选择资源后自动填充
const onResourceSelect = (res: any) => {
  if (!res) return
  recipientAddress.value = res.ownerAddress || ''
  resourceId.value = res.id
  resourceName.value = res.name
  amount.value = res.pointsCost // 自动填充积分数量
  if (!recipientAddress.value) {
    ElMessage.warning('该资源分享者尚未创建区块链账户，无法借用')
    selectedResource.value = null
  }
}

const getCurrentTimestamp = (): string => {
  const now = new Date();
  const pad = (n: number, len: number = 2) => n.toString().padStart(len, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.` +
         `${pad(now.getMilliseconds(), 3)}`;  // 关键：毫秒固定3位
};

const getTypeLabel = (type: string): string => {
  const map: Record<string, string> = {
    BORROW_REQUEST: '借用申请',
    CONFIRM_RECEIVED: '确认收到',
    RETURN: '归还',
  }
  return map[type] || type
}

// 发送交易
const sendTransaction = async () => {
  if (!userStore.privateKey) return ElMessage.error('请先解锁区块链账户')
  if (!recipientAddress.value || amount.value === undefined || !resourceId.value) {
    return ElMessage.error('请填写完整信息')
  }

  const timestamp = getCurrentTimestamp()
  const msg: ResourceTransaction = {
    senderAddress: userStore.address,
    recipientAddress: recipientAddress.value,
    amount: amount.value,
    timestamp,
    resourceId: resourceId.value,
    recordType: recordType.value,
  }

  const sig = signResourceMessage(userStore.privateKey, msg)

  const payload = {
    senderAddress: userStore.address,
    recipientAddress: recipientAddress.value,
    amount: amount.value,
    timestamp,
    signature: { r: sig.r, s: sig.s },
    publicKey: userStore.address,
    resourceId: resourceId.value,
    resourceName: resourceName.value,
    resourceType: 'PHYSICAL',
    recordType: recordType.value,
    gasUsed: 1,
  }

  try {
    const res = await request.post('/transaction/sendAmount', payload)
    if (res.code === 200) {
      ElMessage.success('操作成功！')
      localRecords.value.unshift({
        recordType: recordType.value,
        resourceName: resourceName.value,
        amount: amount.value,
        time: timestamp,
      })
      amount.value = undefined
      await fetchBalance()
    } else {
      ElMessage.error(res.msg || '提交失败')
    }
  } catch (e) {
    ElMessage.error('网络错误')
  }
}

const route = useRoute();

onMounted(async () => {
  await userStore.initUser();
  const resourceId = route.query.resourceId;
  if (resourceId) {
    const res = await request.get(`/resource/detail/${resourceId}`);
    if (res.code === 200) {
      selectedResource.value = res.data;
      onResourceSelect(res.data);
    }
  }
  loadAvailableResources();
});
</script>

<style scoped>
.page { min-height: 100vh; background: #fefefe; }
.transaction-container { max-width: 720px; margin: 80px auto 0; padding: 2rem; }
.login-box, .trade-box { background: #f7f7f7; border-radius: 16px; padding: 30px; }
.login-box input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; }
.info-bar { background: white; padding: 12px 16px; border-radius: 10px; margin-bottom: 20px; }
.auto-field { margin-bottom: 12px; }
.auto-field .label { display: block; font-size: 13px; color: #666; margin-bottom: 4px; }
.auto-field input { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9; }
select { width: 100%; padding: 10px; margin-top: 10px; border: 1px solid #ddd; border-radius: 8px; }
.submit-btn, .unlock-btn { width: 100%; height: 52px; background: #F0B90B; color: white; border: none; border-radius: 12px; font-size: 17px; font-weight: bold; margin-top: 20px; cursor: pointer; }
.unlock-btn:disabled { background: #ccc; cursor: not-allowed; }
.history-section { margin-top: 30px; }
.history-section h3 { margin-bottom: 12px; }
.record-item { display: flex; gap: 12px; padding: 10px; background: white; border-radius: 8px; margin-bottom: 8px; font-size: 13px; }
.record-type { font-weight: bold; color: #F0B90B; width: 80px; }
.record-name { flex: 1; }
.record-amount { width: 80px; }
.record-time { width: 150px; color: #999; }
.empty { text-align: center; color: #aaa; padding: 20px; }
</style>