<template>
  <view class="web-layout">
    <!-- 左侧导航栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <view class="web-content">
      <view class="content-wrapper">
        <!-- 页面标题 -->
        <view class="page-header fade-in-up">
          <text class="page-title">统计分析</text>
          <text class="page-subtitle">查看文档处理统计数据和趋势分析</text>
        </view>
        
        <!-- 加载状态 -->
        <view v-if="isLoading" class="loading-section">
          <view class="loading-card">
            <view class="loading-spinner"></view>
            <text class="loading-text">正在加载统计数据...</text>
          </view>
        </view>
        
        <view class="statistics-container">
    <!-- 时间范围选择 -->
    <view class="time-filter-section">
      <view class="filter-card">
        <view class="filter-header">
          <text class="filter-title">时间范围</text>
        </view>
        <view class="time-buttons">
          <button 
            v-for="period in timePeriods" 
            :key="period.value"
            class="time-btn" 
            :class="{ active: selectedPeriod === period.value }"
            @click="selectTimePeriod(period.value)"
          >
            <text class="btn-text">{{ period.label }}</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 统计概览 -->
    <view class="overview-section">
      <view class="overview-card">
        <view class="overview-header">
          <text class="overview-title">文档类型统计</text>
          <text class="overview-subtitle">{{ getTimeRangeText() }}</text>
        </view>
        <view class="overview-stats">
          <view class="stat-item">
            <text class="stat-number">{{ totalDocuments }}</text>
            <text class="stat-label">总文档数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ successCount }}</text>
            <text class="stat-label">成功提取</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 类型统计 -->
    <view class="type-stats-section">
      <view class="type-stats-card">
        <view class="section-title">
          <text class="title-text">各类型文档数量</text>
        </view>
        
        <!-- 环形图容器 -->
        <view class="chart-container">
          <!-- 环形图 -->
          <view class="pie-chart-wrapper">
            <view class="pie-chart" ref="pieChart">
              <!-- 中心文字 -->
              <view class="chart-center">
                <text class="center-number">{{ successCount }}</text>
                <text class="center-label">总计</text>
              </view>
              
              <!-- 悬停信息 -->
              <view 
                v-if="hoveredSegment" 
                class="hover-info"
                :style="{ 
                  left: hoverPosition.x + 'px', 
                  top: hoverPosition.y + 'px' 
                }"
              >
                <text class="hover-type">{{ hoveredSegment.name }}</text>
                <text class="hover-count">{{ hoveredSegment.count }} 份</text>
                <text class="hover-percentage">{{ hoveredSegment.percentage }}%</text>
              </view>
            </view>
            
            <!-- SVG 环形图 -->
            <svg class="pie-svg" viewBox="0 0 220 220" @mouseleave="clearHover">
              <g transform="translate(110,110)">
                <!-- 环形图片段 -->
                <path
                  v-for="(segment, index) in chartSegments"
                  :key="`segment-${segment.id}-${index}`"
                  :d="segment.isHovered ? segment.hoverPath : segment.path"
                  :fill="segment.color"
                  :stroke="segment.isHovered ? '#fff' : 'transparent'"
                  :stroke-width="segment.isHovered ? '2' : '0'"
                  :opacity="segment.opacity"
                  class="pie-segment"
                  :class="{ 'animating': isAnimating }"

                  @mouseenter="onSegmentHover(segment, $event)"
                  @mousemove="onSegmentMove($event)"
                  @mouseleave="clearHover"
                />
              </g>
            </svg>
          </view>
          
          <!-- 图例 -->
          <view class="chart-legend">
            <view 
              v-for="(segment, index) in chartSegments" 
              :key="index" 
              class="legend-item"
              @mouseenter="onLegendHover(segment)"
              @mouseleave="clearHover"
            >
              <view 
                class="legend-color" 
                :style="{ backgroundColor: segment.color }"
              ></view>
              <view class="legend-text">
                <text class="legend-name">{{ segment.name }}</text>
                <text class="legend-count">{{ segment.count }} 份 ({{ segment.percentage }}%)</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import Sidebar from '../../components/Sidebar.vue'
import { DOCUMENT_TYPES } from '../../config/fund-fields.js'
import { checkAuthAndRedirect } from '../../utils/auth.js'
import { getSystemStatisticsApi, getDocumentHistoryApi } from '../../utils/api.js'
import { handleApiError } from '../../utils/errorHandler.js'

export default {
  components: {
    Sidebar
  },
  data() {
    return {
      selectedPeriod: '7d', // 默认显示7天
      isLoading: true,
      apiStatistics: null, // 从API获取的统计数据
      timePeriods: [
        { label: '今日', value: '1d' },
        { label: '7天', value: '7d' },
        { label: '30天', value: '30d' },
        { label: '90天', value: '90d' },
        { label: '全部', value: 'all' }
      ],
      documentData: [

      ],
      hoveredSegment: null,
      hoverPosition: { x: 0, y: 0 },
      typeColors: {
        '发售公告': '#4F46E5',
        '招募说明书': '#059669',
        '基金合同': '#DC2626',
        '其他': '#6B7280'
      },
      animationProgress: 0,
      isAnimating: false,
      animationFrameId: null
    }
  },
  computed: {
    filteredData() {
      const now = new Date()
      let filtered = this.documentData
      
      switch (this.selectedPeriod) {
        case '1day':
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          filtered = filtered.filter(item => new Date(item.time) >= oneDayAgo)
          break
        case '3days':
          const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(item => new Date(item.time) >= threeDaysAgo)
          break
        case '1week':
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(item => new Date(item.time) >= oneWeekAgo)
          break
        case '1month':
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(item => new Date(item.time) >= oneMonthAgo)
          break
        case 'all':
        default:
          break
      }
      
      return filtered
    },
    
    documentTypeStats() {
      const stats = {
        'fund_contract': 0,
        'custody_agreement': 0,
        'prospectus': 0
      }
      this.filteredData.forEach(item => {
        if (item.status === 'success') {
          const type = item.documentType
          if (stats.hasOwnProperty(type)) {
            stats[type] = (stats[type] || 0) + 1
          }
        }
      })
      return stats
    },
    
    totalDocuments() {
      // 优先使用API数据
      if (this.apiStatistics) {
        return this.apiStatistics.totalDocuments || this.filteredData.length
      }
      return this.filteredData.length
    },
    
    successCount() {
      // 优先使用API数据
      if (this.apiStatistics) {
        return this.apiStatistics.totalDocuments || this.filteredData.filter(item => item.status === 'success').length
      }
      return this.filteredData.filter(item => item.status === 'success').length
    },
    
    chartSegments() {
      const stats = this.documentTypeStats
      const total = this.successCount
      
      if (total === 0) return []
      
      let currentAngle = 0
      const segments = []
      const maxAngle = 360 * this.animationProgress
      
      // 预计算所有角度，避免重复计算
      const entries = Object.entries(stats)
      const angles = entries.map(([type, count]) => (count / total) * 360)
      
      entries.forEach(([type, count], index) => {
        const fullAngle = angles[index]
        const midAngle = currentAngle + fullAngle * 0.5
        
        // 计算动画中的实际角度
        const animatedEndAngle = Math.min(currentAngle + fullAngle, Math.max(currentAngle, maxAngle))
        
        // 只有在动画范围内的片段才显示
        if (currentAngle < maxAngle && animatedEndAngle > currentAngle) {
          const segment = {
            id: type,
            name: this.getDocumentTypeLabel(type),
            count,
            percentage: Math.round((count / total) * 100),
            color: this.getTypeColor(type),
            startAngle: currentAngle,
            endAngle: animatedEndAngle,
            midAngle: midAngle,
            path: this.createArcPath(currentAngle, animatedEndAngle, false),
            hoverPath: this.createArcPath(currentAngle, animatedEndAngle, true),
            hoverTransform: this.createHoverTransform(midAngle),
            isHovered: this.hoveredSegment && this.hoveredSegment.name === this.getDocumentTypeLabel(type),
            opacity: Math.min(1, this.animationProgress * 1.2) // 稍微提前显示透明度
          }
          
          segments.push(segment)
        }
        
        currentAngle += fullAngle
      })
      
      return segments
    }
  },
  
  methods: {
    // 加载统计数据
    async loadStatistics() {
      this.isLoading = true
      try {
        // 获取系统统计数据
        const statisticsData = await getSystemStatisticsApi()
        if (statisticsData) {
          this.apiStatistics = statisticsData
          
          // 获取文档历史记录
          const historyParams = {
            page: 1,
            pageSize: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc'
          }
          
          if (this.selectedPeriod !== 'all') {
            const endDate = new Date().toISOString().split('T')[0]
            let startDate = new Date()
            
            switch (this.selectedPeriod) {
              case '1d':
                startDate.setDate(startDate.getDate() - 1)
                break
              case '7d':
                startDate.setDate(startDate.getDate() - 7)
                break
              case '30d':
                startDate.setDate(startDate.getDate() - 30)
                break
              case '90d':
                startDate.setDate(startDate.getDate() - 90)
                break
            }
            
            historyParams.startDate = startDate.toISOString().split('T')[0]
            historyParams.endDate = endDate
          }
          
          try {
            console.log('📊 获取历史数据，查询参数:', historyParams)
            
            const historyData = await getDocumentHistoryApi(historyParams)
            if (historyData && (historyData.documents || historyData.records)) {
              // 将API数据转换为组件使用的格式
              const documents = historyData.documents || historyData.records || []
              this.documentData = documents.map(doc => ({
                fileName: doc.fileName || doc.originalName,
                time: new Date(doc.createdAt || doc.uploadTime).toLocaleString('zh-CN'),
                status: doc.status === 'COMPLETED' || doc.status === 'completed' ? 'success' : 
                       doc.status === 'PROCESSING' || doc.status === 'processing' ? 'processing' : 'failed',
                documentType: doc.documentType
              }))
            } else {
              this.documentData = []
            }
          } catch (historyError) {
            console.warn('获取文档历史失败，使用演示数据:', historyError)
            // 继续使用默认演示数据
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
        handleApiError(error, { context: 'statistics_load' })
        // 使用默认演示数据
      } finally {
        this.isLoading = false
        // 启动图表动画
        setTimeout(() => {
          this.startChartAnimation()
        }, 100)
      }
    },
    
    selectTimePeriod(period) {
      if (this.selectedPeriod === period) return
      
      this.selectedPeriod = period
      this.loadStatistics() // 重新加载数据
    },
    
    // 开始图表动画
    startChartAnimation() {
      // 清除之前的动画
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
      }
      
      this.isAnimating = true
      this.animationProgress = 0
      
      const startTime = performance.now()
      const duration = 1500 // 进一步缩短到1.5秒
      let lastUpdateTime = 0
      const updateInterval = 16.67 // 约60fps，限制更新频率
      
      const animate = (currentTime) => {
        // 节流：限制更新频率
        if (currentTime - lastUpdateTime < updateInterval) {
          this.animationFrameId = requestAnimationFrame(animate)
          return
        }
        
        lastUpdateTime = currentTime
        const elapsed = currentTime - startTime
        let progress = elapsed / duration
        
        if (progress >= 1) {
          this.animationProgress = 1
          this.isAnimating = false
          this.animationFrameId = null
        } else {
          // 使用更轻量的缓动函数
          this.animationProgress = this.easeOutQuart(progress)
          this.animationFrameId = requestAnimationFrame(animate)
        }
      }
      
      this.animationFrameId = requestAnimationFrame(animate)
    },
    
    // 缓动函数 - 四次方缓出（更流畅）
    easeOutQuart(t) {
      return 1 - Math.pow(1 - t, 4)
    },
    
    getTimeRangeText() {
      const period = this.timePeriods.find(p => p.value === this.selectedPeriod)
      return period ? period.label : '全部时间'
    },
    
    getDocumentTypeName(type) {
      const typeNames = {
        '发售公告': '发售公告',
        '招募说明书': '招募说明书',
        '基金合同': '基金合同',
        '其他': '其他'
      }
      return typeNames[type] || type
    },
    
    getTypePercentage(count) {
      if (this.successCount === 0) return 0
      return Math.round((count / this.successCount) * 100)
    },
    
    // 创建SVG弧形路径（优化版）
    createArcPath(startAngle, endAngle, isHovered = false) {
      // 避免创建过小的弧形，减少计算
      if (endAngle - startAngle < 0.1) return ''
      
      const baseOuterRadius = 80
      const baseInnerRadius = 40
      const hoverOffset = isHovered ? 12 : 0
      
      const outerRadius = baseOuterRadius + hoverOffset
      const innerRadius = baseInnerRadius + hoverOffset
      
      // 转换为弧度，减少重复计算
      const startRad = (startAngle - 90) * 0.017453292519943295 // Math.PI / 180 的预计算值
      const endRad = (endAngle - 90) * 0.017453292519943295
      
      // 预计算三角函数值
      const cosStart = Math.cos(startRad)
      const sinStart = Math.sin(startRad)
      const cosEnd = Math.cos(endRad)
      const sinEnd = Math.sin(endRad)
      
      const x1 = cosStart * outerRadius
      const y1 = sinStart * outerRadius
      const x2 = cosEnd * outerRadius
      const y2 = sinEnd * outerRadius
      
      const x3 = cosEnd * innerRadius
      const y3 = sinEnd * innerRadius
      const x4 = cosStart * innerRadius
      const y4 = sinStart * innerRadius
      
      const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
      
      // 使用模板字符串减少字符串拼接
      return `M${x1.toFixed(2)},${y1.toFixed(2)}A${outerRadius},${outerRadius},0,${largeArcFlag},1,${x2.toFixed(2)},${y2.toFixed(2)}L${x3.toFixed(2)},${y3.toFixed(2)}A${innerRadius},${innerRadius},0,${largeArcFlag},0,${x4.toFixed(2)},${y4.toFixed(2)}Z`
    },
    
    // 创建悬停时的变换
    createHoverTransform(midAngle) {
      const offset = 5
      const midAngleRad = (midAngle - 90) * Math.PI / 180
      const x = Math.cos(midAngleRad) * offset
      const y = Math.sin(midAngleRad) * offset
      return `translate(${x}, ${y})`
    },
    
    // 处理图形片段悬停
    onSegmentHover(segment, event) {
      this.hoveredSegment = {
        name: segment.name,
        count: segment.count,
        percentage: segment.percentage
      }
      
      this.updateHoverPosition(event)
    },
    
    // 处理图例悬停
    onLegendHover(segment) {
      this.hoveredSegment = {
        name: segment.name,
        count: segment.count,
        percentage: segment.percentage
      }
    },
    
    // 处理鼠标移动
    onSegmentMove(event) {
      this.updateHoverPosition(event)
    },
    
    // 更新悬停位置
    updateHoverPosition(event) {
      this.hoverPosition = {
        x: event.clientX,
        y: event.clientY
      }
    },
    
    // 清除悬停状态
    clearHover() {
      this.hoveredSegment = null
    },
    
    getDocumentTypeLabel(type) {
      const labels = {
        'fund_contract': '基金合同',
        'custody_agreement': '托管协议', 
        'prospectus': '招募说明书'
      }
      return labels[type] || type
    },
    
    getDocumentTypeIcon(type) {
      const icons = {
        'fund_contract': '📄',
        'custody_agreement': '🏦',
        'prospectus': '📊'
      }
      return icons[type] || '📄'
    },
    
    getTypeColor(type) {
      const colors = {
        'fund_contract': '#667eea',
        'custody_agreement': '#f093fb',
        'prospectus': '#4facfe'
      }
      return colors[type] || '#999999'
    }
  },
  
  onLoad() {
    // 检查用户是否已登录，未登录则跳转到登录页
    if (!checkAuthAndRedirect()) {
      return
    }
    
    // 加载统计数据
    this.loadStatistics()
  },
  
  mounted() {
    // 页面加载时启动初始动画
    this.$nextTick(() => {
      this.startChartAnimation()
    })
  },
  
  beforeUnmount() {
    // 组件销毁前清理动画
    this.isAnimating = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }
}
</script>

<style>
/* 加载状态样式 */
.loading-section {
  margin-bottom: 40rpx;
}

.loading-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 6rpx solid #f3f3f3;
  border-top: 6rpx solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: var(--color-secondary);
}

.statistics-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.time-filter-section {
  margin-bottom: 40rpx;
}

.filter-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.filter-header {
  margin-bottom: 30rpx;
}

.filter-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.time-buttons {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.time-btn {
  flex: 1;
  min-width: 120rpx;
  background: #f8f9fa;
  color: #666666;
  border: none;
  border-radius: 25rpx;
  padding: 15rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
}

.time-btn.active {
  background: #333333;
  color: #ffffff;
}

.overview-section {
  margin-bottom: 40rpx;
}

.overview-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.overview-header {
  text-align: center;
  margin-bottom: 30rpx;
}

.overview-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.overview-subtitle {
  display: block;
  font-size: 24rpx;
  color: #666666;
}

.overview-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30rpx;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
}

.type-stats-section {
  margin-bottom: 40rpx;
}

.type-stats-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  margin-bottom: 30rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

/* 环形图容器 */
.chart-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40rpx;
}

.pie-chart-wrapper {
  position: relative;
  width: 400rpx;
  height: 400rpx;
  flex-shrink: 0;
}

.pie-chart {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  /* 启用硬件加速和优化渲染 */
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

.pie-segment {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
  transform-origin: center;
  will-change: opacity, filter; /* 启用GPU加速 */
}

.pie-segment.animating {
  /* 动画期间禁用过渡，让动画更流畅 */
  transition: none;
}

.pie-segment:hover {
  filter: brightness(1.1) drop-shadow(0 8rpx 16rpx rgba(0, 0, 0, 0.2));
}

.chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}

.center-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 5rpx;
}

.center-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
}

/* 悬停信息 */
.hover-info {
  position: fixed;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15rpx 20rpx;
  border-radius: 10rpx;
  font-size: 24rpx;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
  margin-top: -10rpx;
}

.hover-type {
  display: block;
  font-weight: bold;
  margin-bottom: 5rpx;
}

.hover-count {
  display: block;
  margin-bottom: 2rpx;
}

.hover-percentage {
  display: block;
  font-size: 20rpx;
  opacity: 0.8;
}

/* 图例 */
.chart-legend {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 15rpx;
  border-radius: 10rpx;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.legend-item:hover {
  background-color: #f8f9fa;
}

.legend-color {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-text {
  flex: 1;
}

.legend-name {
  display: block;
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
  margin-bottom: 5rpx;
}

.legend-count {
  display: block;
  font-size: 24rpx;
  color: #666666;
}

.btn-text {
  color: inherit;
}
</style> 