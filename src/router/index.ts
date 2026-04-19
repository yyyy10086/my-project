// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'

import LoginPage from '@/components/LoginPage.vue'
import MainPage from '@/components/MainPage.vue'
import UserPage from '@/components/UserMessage.vue'
import Contract from '@/components/Contract.vue'
import Plaza from '@/components/Plaza.vue'
import Account from '@/components/Account.vue'
import Transaction from '@/components/transaction.vue'
import AllResources from '@/components/AllResources.vue'
import NewsDetail from '@/components/NewsDetail.vue'
import ResourceTrace from '@/components/ResourceTrace.vue'
import AllNews from '@/components/AllNews.vue'

const routes = [
  { path: '/', name: 'home', component: MainPage },
  { path: '/login', name: 'login', component: LoginPage },
  { path: '/user', name: 'user', component: UserPage },
  { path: '/contrace', name: 'contract', component: Contract },
  { path: '/publish', name: 'publish', component: Contract },  // 发布资源（复用 Contract 页面）
  { path: '/plaza', name: 'plaza', component: Plaza },
  { path: '/account', name: 'account', component: Account },
  { path: '/transaction', name: 'transaction', component: Transaction },
  { path: '/resources', name: 'resources', component: AllResources },
  { path: '/coins', name: 'coins', redirect: '/resources' },  // 旧路由重定向
  { path: '/news', name: 'newsList', component: AllNews },
  { path: '/news/:id', name: 'newsDetail', component: NewsDetail },
  { path: '/trace/:id?', name: 'trace', component: ResourceTrace },  // 资源溯源
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router