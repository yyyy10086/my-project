<template>
  <div class="page">
    <Header />
    <div class="account-container">
      <h2>区块链账户</h2>

      <!-- 已有账户时直接显示公钥信息 -->
      <div v-if="userStore.address" class="key-display">
        <div class="key-card">
          <p class="label">区块链地址 (公钥)</p>
          <div class="value-row">
            <span class="value">{{ userStore.address }}</span>
            <el-button size="small" @click="copy(userStore.address)">复制</el-button>
          </div>
        </div>

        <!-- 如果本地存有加密私钥，提供查看/下载功能（可选） -->
        <div v-if="hasEncryptedPrivateKey" class="key-card">
          <p class="label">私钥 <span class="tip">(已加密存储)</span></p>
          <div class="value-row">
            <el-button size="small" @click="showPrivateKeyModal">查看私钥</el-button>
            <el-button size="small" @click="downloadEncryptedPrivateKey">下载加密私钥</el-button>
          </div>
        </div>

        <el-button type="success" class="btn-finish" @click="goToContract">
          进入资源中心
        </el-button>
      </div>

      <!-- 未创建时才显示生成按钮 -->
      <div v-else class="generate-section">
        <button class="btn-generate" @click="showConfirmDialog = true">
          生成区块链账户
        </button>
      </div>
    </div>

    <!-- 确认对话框 -->
    <el-dialog v-model="showConfirmDialog" title="安全提醒" width="420px" center>
      <div class="confirm-content">
        <p>生成后请设置密码加密私钥，系统不会保存您的私钥。</p>
        <el-checkbox v-model="checked">我已了解，私钥丢失无法找回</el-checkbox>
      </div>
      <template #footer>
        <el-button @click="showConfirmDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!checked" @click="generatePrivateKey">确定生成</el-button>
      </template>
    </el-dialog>

    <!-- 密码设置对话框 -->
    <el-dialog v-model="showPasswordDialog" title="设置私钥加密密码" width="400px">
      <el-form :model="passwordForm">
        <el-form-item label="密码">
          <el-input v-model="passwordForm.password" type="password" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelSetPassword">取消</el-button>
        <el-button type="primary" @click="encryptAndSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看私钥对话框（需要输入密码解密） -->
    <el-dialog v-model="showPrivateKeyModal" title="查看私钥" width="400px">
      <el-form>
        <el-form-item label="请输入加密密码">
          <el-input v-model="decryptPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <div v-if="decryptedPrivateKeyDisplay" class="decrypted-key">
        <p><strong>私钥：</strong></p>
        <p style="word-break: break-all; font-family: monospace;">{{ decryptedPrivateKeyDisplay }}</p>
        <el-button size="small" @click="copy(decryptedPrivateKeyDisplay)">复制</el-button>
      </div>
      <template #footer>
        <el-button @click="showPrivateKeyModal = false">关闭</el-button>
        <el-button type="primary" @click="decryptAndShow">解密</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import generateMnemonicAndKey from '@/utils/passphraseUtil'
import request from '@/api/request'
import { useUserStore } from '@/store/UserStore'
import Header from '@/components/Header.vue'
import { saveAs } from 'file-saver'
import CryptoJS from 'crypto-js'

const router = useRouter()
const userStore = useUserStore()

const showConfirmDialog = ref(false)
const checked = ref(false)
const showPasswordDialog = ref(false)
const passwordForm = ref({ password: '', confirmPassword: '' })
const tempPrivateKey = ref('')

// 已有账户相关
const hasEncryptedPrivateKey = computed(() => {
  return !!localStorage.getItem(`wallet_${userStore.id}`)
})

const showPrivateKeyModal = ref(false)
const decryptPassword = ref('')
const decryptedPrivateKeyDisplay = ref('')

const generatedWallet = ref<{ privateKey: string; publicKey: string; address: string } | null>(null)

// 生成私钥（第一步：确认后弹出密码设置）
const generatePrivateKey = () => {
  const wallet = generateMnemonicAndKey()
  generatedWallet.value = wallet
  showConfirmDialog.value = false
  checked.value = false
  showPasswordDialog.value = true
}

// 取消设置密码
const cancelSetPassword = () => {
  showPasswordDialog.value = false
  tempPrivateKey.value = ''
}

// 加密并保存
const encryptAndSave = async () => {
  if (!generatedWallet.value) return
  if (passwordForm.value.password !== passwordForm.value.confirmPassword) {
    ElMessage.error('两次密码不一致')
    return
  }
  const encrypted = CryptoJS.AES.encrypt(generatedWallet.value.privateKey, passwordForm.value.password).toString()
  localStorage.setItem(`wallet_${userStore.id}`, encrypted)
  ElMessage.success('私钥已加密存储，请牢记密码')

  // 发送公钥到后端
  await request.post('/userInfo/userAccount', null, { params: { public_key: generatedWallet.value.publicKey } })
  await request.post('/userInfo/createUserVIP')
  // Account.vue encryptAndSave 方法中
  userStore.setWallet(generatedWallet.value.publicKey, generatedWallet.value.publicKey, generatedWallet.value.privateKey);
  await userStore.initUser();
  ElMessage.success('账户创建成功，钱包已自动解锁');
  router.push('/contrace');
}

// 下载加密私钥文件
const downloadEncryptedPrivateKey = () => {
  const encrypted = localStorage.getItem(`wallet_${userStore.id}`)
  if (!encrypted) {
    ElMessage.error('未找到加密私钥')
    return
  }
  const blob = new Blob([encrypted], { type: 'text/plain' })
  saveAs(blob, `wallet_${userStore.id}.key`)
  ElMessage.success('加密私钥文件已下载')
}

// 查看私钥（需要密码解密）
const decryptAndShow = () => {
  const encrypted = localStorage.getItem(`wallet_${userStore.id}`)
  if (!encrypted) {
    ElMessage.error('未找到加密私钥')
    return
  }
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, decryptPassword.value)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    if (!decrypted || !/^[0-9a-fA-F]{64}$/.test(decrypted)) {
      ElMessage.error('密码错误或私钥无效')
      return
    }
    decryptedPrivateKeyDisplay.value = decrypted
  } catch (e) {
    ElMessage.error('解密失败')
  }
}

const copy = async (text: string) => {
  await navigator.clipboard.writeText(text)
  ElMessage.success('已复制')
}

const goToContract = () => {
  router.push('/contrace')
}

onMounted(async () => {
  if (userStore.token) {
    await userStore.initUser()
  } else {
    router.push('/login')
  }
})
</script>

<style scoped>
.page { min-height: 100vh; background: #f8f9fa; }
.account-container { max-width: 620px; margin: 100px auto; padding: 40px; background: white; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
h2 { text-align: center; margin-bottom: 30px; color: #333; }
.btn-generate { width: 100%; height: 56px; font-size: 18px; font-weight: bold; background: linear-gradient(90deg, #f0b90b, #ffc107); color: white; border: none; border-radius: 12px; cursor: pointer; }
.key-display { margin-top: 20px; }
.key-card { background: #f8f9fa; border-radius: 12px; padding: 18px; margin-bottom: 16px; }
.label { font-size: 14px; color: #666; margin-bottom: 6px; }
.value-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.value { flex: 1; font-family: monospace; font-size: 15px; word-break: break-all; }
.tip { font-size: 12px; color: #999; }
.btn-finish { width: 100%; height: 52px; font-size: 17px; font-weight: bold; margin-top: 10px; background: #F0B90B; color: white; border: none; border-radius: 12px; cursor: pointer; }
.decrypted-key { margin-top: 16px; padding: 12px; background: #f5f5f5; border-radius: 8px; }
</style>