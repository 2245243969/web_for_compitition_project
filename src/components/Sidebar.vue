<template>
  <view class="sidebar-container">
    <!-- 侧边栏背景遮罩 (移动端) -->
    <view 
      v-if="showSidebar" 
      class="sidebar-overlay" 
      @click="closeSidebar"
    ></view>
    
    <!-- 侧边栏主体 -->
    <view class="sidebar" :class="{ 'sidebar-open': showSidebar }">
      <!-- 品牌Logo区域 -->
      <view class="sidebar-header">
        <view class="logo-area">
          <image class="logo" src="/static/logo1.png" mode="aspectFit"></image>
          <text class="brand-text">基金发行公告</text>
        </view>
      </view>

      <!-- 导航菜单 -->
      <view class="sidebar-nav">
        <view 
          v-for="(item, index) in menuItems" 
          :key="index"
          class="nav-item" 
          :class="{ 'nav-item-active': currentPage === item.path }"
          @click="navigateTo(item.path)"
        >
          <view class="nav-icon">
            <text class="icon">{{ item.icon }}</text>
          </view>
          <text class="nav-text">{{ item.text }}</text>
          <view v-if="currentPage === item.path" class="nav-indicator"></view>
        </view>
      </view>

    </view>
  </view>
</template>

<script>
export default {
  name: 'Sidebar',
  props: {
    showSidebar: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      currentPage: '',
      menuItems: [
        {
          path: '/pages/index/index',
          text: '首页',
          icon: '🏠'
        },
        {
          path: '/pages/upload/upload',
          text: '文件上传',
          icon: '📤'
        },
        {
          path: '/pages/results/results',
          text: '提取结果',
          icon: '📊'
        },
        {
          path: '/pages/history/history',
          text: '处理历史',
          icon: '📋'
        },
        {
          path: '/pages/statistics/statistics',
          text: '统计分析',
          icon: '📈'
        }
      ]
    }
  },
  mounted() {
    this.updateCurrentPage()
  },
  methods: {
    updateCurrentPage() {
      // 获取当前页面路径
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        this.currentPage = '/' + currentPage.route
      }
    },
    navigateTo(path) {
      if (this.currentPage !== path) {
        uni.reLaunch({
          url: path
        })
      }
      this.closeSidebar()
    },
    closeSidebar() {
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 1000;
  pointer-events: none;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sidebar {
  position: fixed;
  top: 0;
  left: -280px;
  width: 280px;
  height: 100vh;
  background: #1B2A41;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transition: left 0.3s ease;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-open {
  left: 0;
}

.sidebar-open ~ .sidebar-overlay {
  opacity: 1;
}

/* 品牌区域 */
.sidebar-header {
  padding: 30rpx 20rpx;
  border-bottom: 1px solid rgba(176, 179, 184, 0.2);
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.logo {
  width: 50rpx;
  height: 50rpx;
  border-radius: 8rpx;
}

.brand-text {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: bold;
}

/* 导航菜单 */
.sidebar-nav {
  flex: 1;
  padding: 20rpx 0;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 25rpx 30rpx;
  margin: 5rpx 15rpx;
  border-radius: 12rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-item:hover {
  background: rgba(201, 168, 107, 0.1);
  transform: translateX(5rpx);
}

.nav-item-active {
  background: rgba(201, 168, 107, 0.2);
  color: #C9A86B;
}

.nav-item-active .nav-text {
  color: #C9A86B;
  font-weight: bold;
}

.nav-icon {
  width: 40rpx;
  display: flex;
  justify-content: center;
  margin-right: 20rpx;
}

.icon {
  font-size: 32rpx;
}

.nav-text {
  color: #ffffff;
  font-size: 28rpx;
  flex: 1;
  transition: color 0.3s ease;
}

.nav-indicator {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4rpx;
  height: 60%;
  background: #C9A86B;
  border-radius: 2rpx 0 0 2rpx;
}

/* 底部用户信息 */
.sidebar-footer {
  padding: 30rpx 20rpx;
  border-top: 1px solid rgba(176, 179, 184, 0.2);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.user-avatar {
  width: 60rpx;
  height: 60rpx;
  background: #C9A86B;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: bold;
}

.user-details {
  flex: 1;
}

.user-name {
  display: block;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 5rpx;
}

.user-role {
  display: block;
  color: #B0B3B8;
  font-size: 22rpx;
}

/* 桌面端样式 */
@media screen and (min-width: 768px) {
  /* 保持导航栏始终固定在左侧 */
  .sidebar-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    z-index: 1000;
    pointer-events: auto;
  }

  .sidebar-overlay {
    display: none;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 280px;
    height: 100vh;
    box-shadow: none;
    border-right: 1px solid rgba(176, 179, 184, 0.2);
  }

  .sidebar-open {
    left: 0;
  }
}

/* 移动端隐藏侧边栏 */
@media screen and (max-width: 767px) {
  .sidebar-container {
    display: none;
  }
  
  .sidebar-container.mobile-show {
    display: block;
  }
}
</style>