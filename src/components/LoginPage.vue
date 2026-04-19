<template>
  <div class="container">
    <div class="message">
      <el-alert v-if="successMes" :title="successMes" type="success" />
      <el-alert v-if="errorMes" :title="errorMes" type="error" />
    </div>

    <div class="login">
      <h2>欢迎来到 CampusLink</h2>

      <div class="form-group">
        <!-- 切换按钮 -->
        <button class="chang-button" @click="toggleLoginType">
          {{ loginType === 'code' ? '密码登录' : '验证码登录' }}
        </button>

        <!-- 手机号输入框（根据登录类型使用不同样式类） -->
        <div class="input-container">
          <label>手机号：</label>
          <input
            type="text"
            v-model="phone"
            :class="loginType === 'code' ? 'input-field-code' : 'input-field-full'"
            placeholder="请输入手机号"
          />
        </div>

        <!-- 验证码登录模式 -->
        <template v-if="loginType === 'code'">
          <div class="input-container">
            <label>验证码：</label>
            <input type="text" v-model="code" class="input-field-code" placeholder="请输入验证码" />
            <button
              class="code-button"
              @click="sendCode(phone)"
              :disabled="isCodeButtonDisabled"
            >
              {{ countdown > 0 ? countdown + '秒' : '获取验证码' }}
            </button>
          </div>
        </template>

        <!-- 密码登录模式 -->
        <template v-else>
          <div class="input-container">
            <label>密码：</label>
            <input
              type="password"
              v-model="password"
              class="input-field-full"
              placeholder="请输入密码"
              @keyup.enter="loginBtn"
            />
          </div>
        </template>

        <!-- 登录按钮 -->
        <button class="login-button" @click="loginBtn">登录</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import useLogin from '@/api/login';

const {
  phone,
  code,
  password,
  loginType,
  successMes,
  errorMes,
  countdown,
  isCodeButtonDisabled,
  sendCode,
  loginBtn,
  toggleLoginType,
} = useLogin();
</script>

<style scoped>
.container {
  font-size: 17px;
  position: relative;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.8);
}

.el-alert {
  margin: 20px 0 0;
}
.el-alert:first-child {
  margin: 0;
}
.message {
  max-width: 600px;
  width: 150px;
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.login {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  min-height: 400px;
  width: 600px;
  border-radius: 20px;
  opacity: 0.95;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.login h2 {
  position: absolute;
  align-items: center;
  font-weight: bold;
  top: 50px;
}

.form-group {
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-container {
  width: 100%;
  display: flex;
  align-items: center;
  margin: 10px 0;
}

.chang-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 120px;
  height: 40px;
  background: none;
  border: none;
  color: #66afe9;
  cursor: pointer;
  text-decoration: none;
  font-size: 17px;
}
.chang-button:hover {
  text-decoration: underline;
  text-underline-position: under;
}

/* 验证码模式下的输入框（较短，给按钮留空间） */
.input-field-code {
  width: 60%;
  padding: 5px;
  margin: 5px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;
}

/* 密码模式下的输入框（占满剩余宽度） */
.input-field-full {
  flex: 1;
  padding: 5px;
  margin: 5px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.3s;
}

.input-field-code:focus,
.input-field-full:focus {
  border-color: #66afe9;
}

.code-button {
  background-color: #66afe9;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 8px 12px;
  transition: background-color 0.3s;
  font-size: 16px;
  margin-left: 10px;
}
.code-button:hover {
  background-color: #5ba8e0;
}
.code-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.login-button {
  background-color: #f4c300;
  color: white;
  border: none;
  border-radius: 4px;
  width: 40%;
  height: 50px;
  margin-top: 30px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 17px;
}
.login-button:hover {
  background-color: #fdd806;
}
</style>