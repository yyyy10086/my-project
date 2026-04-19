// src/main.ts
import './assets/main.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'                    // ← 正确引入 router
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import pinia from './utils/pinia'               // 你原来的 pinia 配置
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

const app = createApp(App)

// 注册路由
app.use(router)

// 注册 ElementPlus
app.use(ElementPlus)

// 注册 Pinia
app.use(pinia)

// 注册 Element Plus Icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')