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
        <view class="card-grid card-grid-1 fade-in-up">
          <view class="web-card">
            <view class="card-header">
              <text class="card-title">处理性能</text>
              <text class="card-icon">⚡</text>
            </view>
            <view class="card-content">
              <view class="progress-bar">
                <view class="progress-fill" style="width: {{ systemStats.systemPerformance }}%;"></view>
              </view>
              <text class="card-text">系统处理效率: {{ systemStats.systemPerformance }}%</text>
              <text class="card-text">平均处理时间: {{ systemStats.averageProcessTime }}秒/文档</text>
            </view>
          </view>


        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Sidebar from '../../components/Sidebar.vue'
import { checkAuthAndRedirect, requireAuth } from '../../utils/auth.js'
import { getSystemStatisticsApi, getDocumentHistoryApi, getHistoryResultsApi } from '../../utils/api.js'
import { debugAuthState, testApiConnection, testApiConnectionWithAuth } from '../../utils/debug-auth.js'

export default {
  components: {
    Sidebar
  },
  data() {
    return {
      // 系统统计数据
      systemStats: {
        totalDocuments: 0,
        todayDocuments: 0,
        successRate: 0,
        averageProcessTime: 0,
        systemPerformance: 0,
        documentTypes: []
      },
      isLoadingStats: true,
      totalUsers: 0,
      recentHistory: []
    }
  },
  onShow() {
    // 页面显示时刷新最近历史记录
    console.log('📱 首页重新显示，刷新最近历史记录')
    this.loadRecentHistory()
  },
  onLoad() {
    console.log('Index page loaded')
    
    // 设置全局错误处理，避免第三方扩展错误影响应用
    this.setupErrorHandling()
    
    // 检查登录状态
    const isLoggedIn = uni.getStorageSync('isLoggedIn')
    const token = uni.getStorageSync('token')
    
    console.log('🔍 页面加载检查:', {
      isLoggedIn,
      hasToken: !!token,
      tokenLength: token ? token.length : 0
    })
    
    if (!isLoggedIn || !token) {
      console.log('❌ 未登录，跳转到登录页')
      uni.reLaunch({
        url: '/pages/login/login'
      })
      return
    }
    
    console.log('✅ 用户已登录，开始调试')
    
    // 延迟加载，确保token存储同步完成
    setTimeout(async () => {
      // 调试认证状态
      debugAuthState()
      
      // 只在开发环境下进行API测试，避免影响生产环境
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 开发环境 - 开始API连接测试...')
        try {
          const result = await testApiConnection()
          if (result && result.statusCode === 200) {
            console.log('✅ API连接测试成功')
            // 如果基础连接成功，可以尝试认证API测试
            // await testApiConnectionWithAuth()
          } else {
            console.info('ℹ️ 后端服务暂时不可用，应用将使用默认数据运行')
          }
        } catch (error) {
          // 静默处理API测试错误，不影响用户体验
          console.info('ℹ️ API连接测试跳过，应用将使用默认数据运行')
        }
      }
      
      this.loadSystemStats()
      this.loadRecentHistory()
    }, 300) // 减少延迟时间，提升用户体验
  },
  methods: {
    // 设置错误处理，避免第三方扩展错误影响应用
    setupErrorHandling() {
      // 捕获Promise未处理的错误（包括扩展程序的错误）
      if (typeof window !== 'undefined') {
        const originalHandler = window.onunhandledrejection
        window.onunhandledrejection = (event) => {
          // 检查是否是扩展程序相关的错误
          if (event.reason && typeof event.reason === 'string') {
            if (event.reason.includes('Pro feature') || 
                event.reason.includes('content_script') ||
                event.reason.includes('extension') ||
                event.reason.includes('chrome-extension') ||
                event.reason.includes('moz-extension')) {
              console.warn('🔧 检测到浏览器扩展错误，已忽略:', event.reason)
              // 阻止错误显示在控制台
              event.preventDefault()
              return
            }
          }
          
          // 检查错误是否来自扩展程序文件
          if (event.reason && event.reason.stack) {
            if (event.reason.stack.includes('content_script') ||
                event.reason.stack.includes('extension') ||
                event.reason.stack.includes('chrome-extension') ||
                event.reason.stack.includes('moz-extension')) {
              console.warn('🔧 检测到扩展程序错误，已忽略:', event.reason.message || event.reason)
              event.preventDefault()
              return
            }
          }
          
          // 检查是否是网络相关错误
          if (event.reason && event.reason.message) {
            if (event.reason.message.includes('ERR_EMPTY_RESPONSE') ||
                event.reason.message.includes('ERR_CONNECTION_REFUSED') ||
                event.reason.message.includes('request:fail') ||
                event.reason.message.includes('Network Error')) {
              console.warn('🌐 检测到网络连接错误，已处理:', event.reason.message)
              event.preventDefault()
              return
            }
          }
          
          // 如果不是扩展程序错误，调用原始处理器
          if (originalHandler) {
            originalHandler.call(window, event)
          }
        }
        
        // 设置错误边界
        const originalErrorHandler = window.onerror
        window.onerror = (message, source, lineno, colno, error) => {
          // 检查是否是扩展程序错误
          if (source && (source.includes('extension') || 
                        source.includes('content_script') ||
                        source.includes('chrome-extension') ||
                        source.includes('moz-extension'))) {
            console.warn('🔧 检测到扩展程序JS错误，已忽略:', message)
            return true // 阻止默认错误处理
          }
          
          // 检查是否是网络错误
          if (typeof message === 'string' && 
              (message.includes('ERR_EMPTY_RESPONSE') || 
               message.includes('ERR_CONNECTION_REFUSED') ||
               message.includes('request:fail') ||
               message.includes('Network Error'))) {
            console.warn('🌐 检测到网络错误，已处理:', message)
            return true
          }
          
          // 如果不是扩展程序错误，调用原始处理器
          if (originalErrorHandler) {
            return originalErrorHandler.call(window, message, source, lineno, colno, error)
          }
          return false
        }
      }
    },
    
    // 加载系统统计数据
    async loadSystemStats() {
      console.log('📊 开始加载系统统计...')
      this.isLoadingStats = true
      
      try {
        // 先尝试获取真实数据，但不让错误影响用户体验
        const stats = await getSystemStatisticsApi()
        
        if (stats && stats.overview) {
          console.log('✅ 成功获取系统统计数据:', stats)
          this.systemStats = {
            totalDocuments: stats.overview.totalDocuments || 0,
            todayDocuments: stats.periodStats?.documentsUploaded || 0,
            successRate: Math.round(stats.overview.successRate || 0),
            averageProcessTime: stats.overview.averageProcessingTime || 0,
            systemPerformance: Math.round(stats.overview.systemHealth || 95),
            documentTypes: stats.documentTypes || []
          }
        } else if (stats && stats.totalDocuments !== undefined) {
          // 兼容旧格式
          console.log('✅ 获取系统统计数据（旧格式）:', stats)
          this.systemStats = {
            totalDocuments: stats.totalDocuments || 0,
            todayDocuments: stats.todayDocuments || 0,
            successRate: stats.successRate || 0,
            averageProcessTime: stats.averageProcessTime || 0,
            systemPerformance: stats.systemPerformance || 95,
            documentTypes: stats.documentTypes || []
          }
        } else {
          console.log('📊 API无有效数据，使用默认数据')
          this.useDefaultStats()
        }
        
      } catch (error) {
        // 不在控制台显示网络错误，避免干扰用户
        if (error.message && (
            error.message.includes('ERR_EMPTY_RESPONSE') ||
            error.message.includes('ERR_CONNECTION_REFUSED') ||
            error.message.includes('request:fail') ||
            error.message.includes('Network Error') ||
            error.message.includes('服务器内部错误')
          )) {
          console.info('📊 后端服务暂时不可用，使用默认数据展示')
        } else {
          console.warn('📊 加载系统统计失败，使用默认数据:', error.message)
        }
        this.useDefaultStats()
      } finally {
        this.isLoadingStats = false
      }
    },
    
    // 加载最近处理历史记录
    async loadRecentHistory() {
      console.log('📋 开始加载最近处理历史记录...')
      try {
        // 获取最近5条处理记录
        const response = await getDocumentHistoryApi({
          page: 1,
          pageSize: 5
        })
        
        if (response && response.records && response.records.length > 0) {
          console.log('✅ 成功获取最近历史记录:', response.records)
          
          // 转换数据格式以匹配首页显示需求
          this.recentHistory = response.records.map(record => {
            // 计算准确率
            const accuracy = record.extractedFields && record.totalFields 
              ? Math.round((record.extractedFields / record.totalFields) * 100)
              : 0
            
            return {
              id: record.id,
              taskId: record.extractionTasks?.[0]?.id || record.id,
              fileName: record.fileName || record.originalName || '未知文档',
              processTime: this.formatProcessTime(record.processingTime || record.extractionTasks?.[0]?.processingTime),
              status: record.status?.toLowerCase() || 'unknown',
              accuracy: accuracy,
              documentType: record.documentType,
              createdAt: record.createdAt
            }
          })
          
          console.log('✅ 转换后的历史记录:', this.recentHistory)
        } else {
          console.log('📋 暂无历史记录')
          this.recentHistory = []
        }
        
      } catch (error) {
        console.warn('📋 加载最近历史记录失败:', error.message)
        this.recentHistory = []
      }
    },
    
    // 格式化处理时间
    formatProcessTime(seconds) {
      if (!seconds) return '0s'
      
      if (seconds < 60) {
        return `${seconds}s`
      } else {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
      }
    },
    
    // 使用空数据
    useDefaultStats() {
      this.systemStats = {
        totalDocuments: 0,
        todayDocuments: 0,
        successRate: 0,
        averageProcessTime: 0,
        systemPerformance: 0,
        documentTypes: []
      }
      this.isLoadingStats = false
    },
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
    async viewHistoryDetail(item) {
      if (item.status !== 'completed') {
        uni.showToast({
          title: '该文件尚未处理完成，无法查看详情',
          icon: 'none'
        })
        return
      }

      try {
        uni.showLoading({
          title: '加载结果中...',
          mask: true
        })
        
        console.log('🔍 首页点击查看历史详情，记录信息:', item)
        
        // 使用与处理历史页面相同的API
        const results = await getHistoryResultsApi(item.id)
        
        if (results) {
          console.log('📥 从API获取的原始结果:', results)
          
          // 构建完整结果数据，格式与处理历史页面完全一致
          const completeResults = {
            id: results.id || item.taskId,
            taskId: results.taskId || item.taskId,
            documentId: results.documentId || item.id,
            status: results.status || 'COMPLETED',
            progress: 100,
            processingTime: results.processingTime || 0,
            currentStep: 'completed',
            
            // 从新API获取的完整提取数据
            extractedData: results.extractedData || {},
            
            // 提取摘要信息
            extractionSummary: results.extractionSummary || {
              totalFields: this.getFixedTotalFieldsByType(item.documentType),
              extractedFields: item.accuracy ? Math.round(item.accuracy * this.getFixedTotalFieldsByType(item.documentType) / 100) : 0,
              documentType: item.documentType,
              processingTime: 0,
              averageConfidence: 0.92,
              extractionRate: item.accuracy / 100 || 0
            },
            
            // 质量指标
            qualityMetrics: results.qualityMetrics || {
              averageConfidence: 0.92,
              fieldCoverage: item.accuracy / 100 || 0,
              processingTime: 0
            },
            
            // 元数据
            documentType: item.documentType,
            fileName: item.fileName,
            createdAt: results.createdAt || item.createdAt,
            completedAt: results.completedAt || item.createdAt
          }
          
          console.log('✅ 构建完整结果数据（与处理历史页面格式一致）:', completeResults)
          
          // 存储完整结果数据，格式与处理历史页面完全一致
          uni.setStorageSync('currentExtractionResults', completeResults)
          
          // 跳转到结果页面
          uni.navigateTo({
            url: '/pages/results/results'
          })
          
        } else {
          throw new Error('无法获取提取结果数据')
        }
        
      } catch (error) {
        console.error('❌ 加载历史详情失败:', error)
        uni.showToast({
          title: error.message || '加载失败，请重试',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },

    // 获取固定字段总数（与处理历史页面保持一致）
    getFixedTotalFieldsByType(documentType) {
      switch (documentType) {
        case 'fund_contract':
          return 44
        case 'custody_agreement':
        case 'prospectus':
        default:
          return 22
      }
    },
    getStatusText(status) {
      const texts = {
        completed: '处理完成',
        processing: '处理中',
        failed: '处理失败',
        pending: '等待处理',
        error: '处理错误'
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