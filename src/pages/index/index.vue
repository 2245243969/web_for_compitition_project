<template>
  <view class="web-layout">
    <!-- 左侧导航栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <view class="web-content">
      <view class="content-wrapper">
        <!-- 页面标题 -->
        <view class="page-header fade-in-up">
          <text class="page-title">首页概览</text>
          <text class="page-subtitle">欢迎使用基金发行公告提取系统，智能化基金文档信息提取与分析平台</text>
        </view>

        <!-- 快速功能卡片 -->
        <view class="card-grid card-grid-3 fade-in-up">
          <!-- 文件上传卡片 -->
          <view class="web-card card-primary" @click="navigateToUpload">
            <view class="card-header">
              <text class="card-title">文件上传</text>
              <text class="card-icon">📤</text>
            </view>
            <view class="card-content">
              <text class="card-text">上传基金发行公告PDF文档</text>
              <view class="web-button btn-accent" style="margin-top: 20rpx; margin-left: 180rpx;">
                <text>立即上传</text>
              </view>
            </view>
          </view>

          <!-- 提取结果卡片 -->
          <view class="web-card" @click="navigateToResults">
            <view class="card-header">
              <text class="card-title">提取结果</text>
              <text class="card-icon">📊</text>
            </view>
            <view class="card-content">
              <text class="card-text">查看最新的文档提取结果和分析报告</text>
              <view class="web-button btn-outline" style="margin-top: 20rpx; margin-left: 60rpx;">
                <text>查看结果</text>
              </view>
            </view>
          </view>

          <!-- 统计分析卡片 -->
          <view class="web-card" @click="navigateToStatistics">
            <view class="card-header">
              <text class="card-title">统计分析</text>
              <text class="card-icon">📈</text>
            </view>
            <view class="card-content">
              <text class="card-text">查看文档处理统计和趋势分析</text>
              <view class="web-button btn-outline" style="margin-top: 20rpx; margin-left: 140rpx;">
                <text>查看统计</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 最近处理记录 -->
        <view class="web-card fade-in-up" style="margin-bottom: 60rpx;">
          <view class="card-header">
            <text class="card-title">最近处理记录</text>
            <view class="web-button btn-outline" @click="navigateToHistory">
              <text>查看全部</text>
            </view>
          </view>
          <view class="card-content">
            <view class="web-table">
              <view class="table-header">
                <view class="table-row">
                  <text class="table-cell">文档名称</text>
                  <text class="table-cell">处理时间</text>
                  <text class="table-cell">状态</text>
                  <text class="table-cell">准确率</text>
                </view>
              </view>
              <view v-for="(item, index) in recentHistory" :key="index" class="table-row" @click="viewHistoryDetail(item)">
                <text class="table-cell">{{ item.fileName }}</text>
                <text class="table-cell">{{ item.processTime }}</text>
                <text class="table-cell" :class="'status-' + item.status">{{ getStatusText(item.status) }}</text>
                <text class="table-cell">{{ item.accuracy }}%</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 系统性能概览 -->
        <view class="card-grid card-grid-2 fade-in-up">
          <view class="web-card">
            <view class="card-header">
              <text class="card-title">处理性能</text>
              <text class="card-icon">⚡</text>
            </view>
            <view class="card-content">
              <view class="progress-bar">
                <view class="progress-fill" style="width: 85%;"></view>
              </view>
              <text class="card-text">系统处理效率: 85%</text>
              <text class="card-text">平均处理时间: 3.2秒/文档</text>
            </view>
          </view>

          <view class="web-card">
            <view class="card-header">
              <text class="card-title">质量评分</text>
              <text class="card-icon">🎯</text>
            </view>
            <view class="card-content">
              <view class="progress-bar">
                <view class="progress-fill" style="width: 92%;"></view>
              </view>
              <text class="card-text">提取准确率: 92%</text>
              <text class="card-text">用户满意度: 4.6/5.0</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Sidebar from '../../components/Sidebar.vue'

export default {
  components: {
    Sidebar
  },
  data() {
    return {

      totalUsers: 89,
      recentHistory: [
        {
          fileName: '华夏基金发行公告.pdf',
          processTime: '2024-01-15 14:30',
          status: 'success',
          accuracy: 94
        },
        {
          fileName: '易方达基金招募说明书.pdf',
          processTime: '2024-01-15 13:45',
          status: 'success',
          accuracy: 91
        },
        {
          fileName: '南方基金产品公告.pdf',
          processTime: '2024-01-15 12:20',
          status: 'processing',
          accuracy: 0
        },
        {
          fileName: '博时基金发行通知.pdf',
          processTime: '2024-01-15 11:10',
          status: 'failed',
          accuracy: 0
        }
      ]
    }
  },
  onLoad() {
    console.log('Index page loaded')
  },
  methods: {
    navigateToUpload() {
      uni.navigateTo({
        url: '/pages/upload/upload'
      })
    },
    navigateToResults() {
      uni.navigateTo({
        url: '/pages/results/results'
      })
    },
    navigateToStatistics() {
      uni.navigateTo({
        url: '/pages/statistics/statistics'
      })
    },
    navigateToHistory() {
      uni.navigateTo({
        url: '/pages/history/history'
      })
    },
    viewHistoryDetail(item) {
      if (item.status === 'success') {
        uni.navigateTo({
          url: '/pages/results/results'
        })
      } else {
        uni.showToast({
          title: '该文件尚未处理完成，无法查看详情',
          icon: 'none'
        })
      }
    },
    getStatusText(status) {
      const texts = {
        success: '提取成功',
        processing: '处理中',
        failed: '提取失败'
      }
      return texts[status] || status
    }
  }
}
</script>

<style scoped>
/* 页面特定样式覆盖 */
.fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.fade-in-up:nth-child(2) {
  animation-delay: 0.1s;
}

.fade-in-up:nth-child(3) {
  animation-delay: 0.2s;
}

.fade-in-up:nth-child(4) {
  animation-delay: 0.3s;
}

.fade-in-up:nth-child(5) {
  animation-delay: 0.4s;
}

/* 交互效果增强 */
.web-card {
  cursor: pointer;
}

.web-card:active {
  transform: translateY(2rpx);
}

.table-row {
  cursor: pointer;
}

/* 状态颜色 */
.status-success {
  color: var(--color-success) !important;
  font-weight: 600;
}

.status-processing {
  color: var(--color-warning) !important;
  font-weight: 600;
}

.status-failed {
  color: var(--color-error) !important;
  font-weight: 600;
}

/* 响应式调整 */
@media screen and (max-width: 1200px) {
  .card-grid-3 {
    grid-template-columns: 1fr 1fr;
  }
}

@media screen and (max-width: 768px) {
  .card-grid-3,
  .card-grid-2 {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media screen and (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>