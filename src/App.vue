<template>
  <view class="app">
    <!-- 移动端汉堡菜单按钮 -->
    <view class="mobile-header" v-if="isMobile">
      <view class="hamburger-btn" @click="toggleSidebar">
        <text class="hamburger-icon">☰</text>
      </view>
      <text class="mobile-title">{{ pageTitle }}</text>
    </view>

    <!-- 主布局容器 -->
    <view class="main-layout" :class="{ 'mobile-layout': isMobile }">
      <!-- 左侧导航栏 -->
      <Sidebar 
        :show-sidebar="showSidebar || !isMobile" 
        @close="closeSidebar"
        :class="{ 'mobile-show': showSidebar && isMobile }"
      />
      
      <!-- 主内容区域 -->
      <view class="content-area" :class="{ 'content-mobile': isMobile }">
        <!-- 直接显示登录页面 -->
        <LoginPage />
      </view>
    </view>
  </view>
</template>

<script>
import Sidebar from './components/Sidebar.vue'
import LoginPage from './pages/login/login.vue'
import { checkAndRefreshToken } from './utils/api.js'

export default {
  components: {
    Sidebar,
    LoginPage
  },
  data() {
    return {
      showSidebar: false,
      isMobile: false,
      pageTitle: '基金公告提取系统',
      tokenCheckTimer: null
    }
  },
  onLaunch: function () {
    console.log('App Launch')
    this.checkMobile()
    this.setupResizeListener()
    this.startTokenCheckTimer()
  },
  onShow: function () {
    console.log('App Show')
  },
  onHide: function () {
    console.log('App Hide')
  },
  methods: {
    checkMobile() {
      // 检测是否为移动端
      const systemInfo = uni.getSystemInfoSync()
      this.isMobile = systemInfo.windowWidth < 768
    },
    setupResizeListener() {
      // 监听窗口大小变化
      uni.onWindowResize((res) => {
        this.isMobile = res.size.windowWidth < 768
        if (!this.isMobile) {
          this.showSidebar = false
        }
      })
    },
    toggleSidebar() {
      this.showSidebar = !this.showSidebar
    },
    closeSidebar() {
      this.showSidebar = false
    },
    
    // 启动Token检查定时器
    startTokenCheckTimer() {
      // 每10分钟检查一次Token状态
      this.tokenCheckTimer = setInterval(async () => {
        try {
          const isLoggedIn = uni.getStorageSync('isLoggedIn')
          if (isLoggedIn) {
            console.log('⏰ 定期检查Token状态...')
            await checkAndRefreshToken()
          }
        } catch (error) {
          console.error('定期Token检查失败:', error)
        }
      }, 10 * 60 * 1000) // 10分钟
    },
    
    // 清理定时器
    clearTokenCheckTimer() {
      if (this.tokenCheckTimer) {
        clearInterval(this.tokenCheckTimer)
        this.tokenCheckTimer = null
      }
    }
  },
  
  // 应用销毁时清理定时器
  onUnload() {
    this.clearTokenCheckTimer()
  }
}
</script>

<style>
/*每个页面公共css */
.app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* 移动端顶部栏 */
.mobile-header {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60rpx;
  background: #1B2A41;
  z-index: 999;
  padding: 20rpx;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.hamburger-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8rpx;
  transition: background 0.3s ease;
}

.hamburger-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.hamburger-icon {
  color: #ffffff;
  font-size: 36rpx;
}

.mobile-title {
  flex: 1;
  text-align: center;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 60rpx; /* 平衡汉堡按钮 */
}

/* 主布局 */
.main-layout {
  width: 100%;
  height: 100vh;
  position: relative;
}

.mobile-layout {
  padding-top: 100rpx; /* 为移动端头部留空间 */
}

.content-area {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  background: #F5F7FA;
  padding: 0;
  padding-left: 300px; /* 为固定的侧边栏留出 20px 间隔 */
  box-sizing: border-box;
}

.content-mobile {
  height: calc(100vh - 100rpx);
  margin-top: 0;
  padding-left: 0; /* 移动端不需要为侧边栏留空间 */
}

/* 移动端样式 */
@media screen and (max-width: 767px) {
  .mobile-header {
    display: flex;
  }
  
  .main-layout {
    padding-top: 100rpx;
    display: flex; /* 移动端恢复flex布局 */
  }
  
  .content-area {
    padding-left: 0; /* 移动端不需要为侧边栏留空间 */
  }
}

/* 桌面端样式 */
@media screen and (min-width: 768px) {
  .mobile-header {
    display: none;
  }
  
  .main-layout {
    padding-top: 0;
  }
  
  .mobile-layout {
    padding-top: 0;
  }
  
  .content-mobile {
    height: 100vh;
    margin-top: 0;
  }
  
  .content-area {
    padding-left: 300px; /* 桌面端为固定侧边栏留出 20px 间隔 */
  }
  
  .main-layout {
    display: block; /* 桌面端不使用flex布局，因为侧边栏是fixed */
  }
}

/* 滚动条美化 */
.content-area::-webkit-scrollbar {
  width: 8rpx;
}

.content-area::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.content-area::-webkit-scrollbar-thumb {
  background: #B0B3B8;
  border-radius: 4rpx;
}

.content-area::-webkit-scrollbar-thumb:hover {
  background: #C9A86B;
}
</style>
