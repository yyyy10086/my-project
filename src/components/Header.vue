<template>
  <header class="header">
    <div class="left">
      <button class="title" @click="goHome">CampusLink</button>
      <div class="leader">
        <button @click="goContract">资源中心</button>
        <button @click="goPlaza">广场</button>
        <button @click="goTrace">溯源查询</button>
      </div>
    </div>

    <div class="right">
      <!-- 未登录时显示登录按钮 -->
      <template v-if="!isLoggedIn">
        <button class="auth-button" @click="goLogin">登录</button>
      </template>

      <!-- 已登录时显示用户信息和积分 -->
      <div v-else class="user-area">
        <span class="balance-badge">{{ userStore.balance }} 积分</span>

        <!-- 钱包解锁状态指示器 -->
        <div v-if="userStore.address && !userStore.isWalletUnlocked()" 
             class="wallet-indicator locked" 
             @click="showUnlockDialog = true">
          <el-icon><Lock /></el-icon>
          <span>钱包已锁定</span>
        </div>
        <div v-else-if="userStore.isWalletUnlocked()" 
             class="wallet-indicator unlocked">
          <el-icon><Unlock /></el-icon>
          <span>钱包已解锁</span>
        </div>

        <!-- 用户头像，点击进入个人中心 -->
        <div class="avatar-container" @click="goUserInfo">
          <el-icon :size="28" class="userImg"><UserFilled /></el-icon>
        </div>
      </div>
    </div>

    <!-- 解锁弹窗 -->
    <el-dialog v-model="showUnlockDialog" title="解锁钱包" width="400px">
      <el-input v-model="unlockPassword" type="password" placeholder="请输入钱包密码" show-password />
      <template #footer>
        <el-button @click="showUnlockDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUnlock">解锁</el-button>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/UserStore'
import { UserFilled, Lock, Unlock } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'
import { getPublicKeyFromPrivate } from '@/utils/eccUtil'

const userStore = useUserStore()
const router = useRouter()

const isLoggedIn = computed(() => !!userStore.token)

// 解锁弹窗相关
const showUnlockDialog = ref(false)
const unlockPassword = ref('')

const goHome = () => router.push('/')
const goContract = () => router.push('/contrace')
const goPlaza = () => router.push('/plaza')
const goTrace = () => router.push('/trace')
const goLogin = () => router.push('/login')
const goUserInfo = () => router.push('/user')

const handleUnlock = async () => {
  const encrypted = localStorage.getItem(`wallet_${userStore.id}`)
  if (!encrypted) {
    ElMessage.error('未找到加密私钥')
    return
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, unlockPassword.value)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    if (!decrypted || !/^[0-9a-fA-F]{64}$/.test(decrypted)) {
      ElMessage.error('密码错误或私钥无效')
      return
    }
    const pubKey = getPublicKeyFromPrivate(decrypted)
    if (pubKey !== userStore.publicKeyHex) {
      ElMessage.error('私钥与当前账户不匹配')
      return
    }
    userStore.unlockWallet(decrypted)
    ElMessage.success('钱包已解锁')
    showUnlockDialog.value = false
    unlockPassword.value = ''
  } catch {
    ElMessage.error('解密失败')
  }
}
</script>

<style scoped>
.header {
  height: 60px;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  border-bottom: 1px solid #eee;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}
.left {
  display: flex;
  align-items: center;
  gap: 2rem;
}
.title {
  font-size: 22px;
  font-weight: bold;
  background: none;
  border: none;
  cursor: pointer;
  color: #F0B90B;
}
.leader button {
  background: none;
  border: none;
  font-size: 15px;
  cursor: pointer;
  padding: 8px 16px;
}
.leader button:hover {
  color: #F0B90B;
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.auth-button {
  background-color: #fcd535;
  color: black;
  border: none;
  font-weight: bold;
  border-radius: 6px;
  height: 32px;
  width: 68px;
  cursor: pointer;
}
.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
}
.balance-badge {
  background: #FFF8E1;
  color: #F0B90B;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: bold;
}
.wallet-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  background: #f5f5f5;
  color: #666;
}
.wallet-indicator.locked:hover {
  background: #ffe6e6;
}
.wallet-indicator.unlocked {
  background: #e1f3d8;
  color: #27ae60;
  cursor: default;
}
.avatar-container {
  cursor: pointer;
}
.userImg {
  margin-left: 10px;
}
</style>