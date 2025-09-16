import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni(),
  ],
  // 为Gitee Pages设置正确的base路径
  base: process.env.NODE_ENV === 'production' ? '/web_for_compititon/' : '/',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://nybrzijdwpdn.sealoshzh.site',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path
      }
    }
  }
})
