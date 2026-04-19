import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      buffer: 'buffer', // 引入 buffer 模块
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
    }
  },
  server:{
    proxy:{
      '/api':{//获取路径中包含api的请求
          target:'http://localhost:8081',//后台所在的源
          changeOrigin:true,//修改源
          rewrite:(path)=>path.replace(/^\/api/,'')//将api替换成''
      }
    }
  }
})
