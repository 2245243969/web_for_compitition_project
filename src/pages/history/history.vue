<template>
  <view class="web-layout">
    <!-- 左侧导航栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <view class="web-content">
      <view class="content-wrapper">
        <!-- 页面标题 -->
        <view class="page-header fade-in-up">
          <text class="page-title">处理历史</text>
          <text class="page-subtitle">查看所有文档的处理记录和历史信息</text>
        </view>
        
        <view class="history-container">
    <!-- 统计概览 -->
    <view class="stats-section">
      <view class="stats-card">
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-number">{{ totalFiles }}</text>
            <text class="stat-label">总文件数</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ successCount }}</text>
            <text class="stat-label">成功提取</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ processingCount }}</text>
            <text class="stat-label">处理中</text>
          </view>
          <view class="stat-item">
            <text class="stat-number">{{ failedCount }}</text>
            <text class="stat-label">提取失败</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 筛选器 -->
    <view class="filter-section">
      <view class="filter-card">
        <view class="filter-header">
          <text class="filter-title">筛选条件</text>
          <button class="clear-filter-btn" @click="clearFilters">
            <text class="btn-text">清除筛选</text>
          </button>
        </view>
        <view class="filter-options">
          <view class="filter-group">
            <text class="filter-label">状态筛选</text>
            <view class="filter-buttons">
              <button 
                class="filter-btn" 
                :class="{ active: statusFilter === 'all' }"
                @click="setStatusFilter('all')"
              >
                <text class="btn-text">全部</text>
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: statusFilter === 'success' }"
                @click="setStatusFilter('success')"
              >
                <text class="btn-text">成功</text>
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: statusFilter === 'processing' }"
                @click="setStatusFilter('processing')"
              >
                <text class="btn-text">处理中</text>
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: statusFilter === 'failed' }"
                @click="setStatusFilter('failed')"
              >
                <text class="btn-text">失败</text>
              </button>
            </view>
          </view>
          <view class="filter-group">
            <text class="filter-label">类型筛选</text>
            <view class="filter-buttons">
              <button 
                class="filter-btn" 
                :class="{ active: typeFilter === 'all' }"
                @click="setTypeFilter('all')"
              >
                <text class="btn-text">全部</text>
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: typeFilter === '发售公告' }"
                @click="setTypeFilter('发售公告')"
              >
                <text class="btn-text">发售公告</text>
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: typeFilter === '招募说明书' }"
                @click="setTypeFilter('招募说明书')"
              >
                <text class="btn-text">招募说明书</text>
              </button>
              <button 
                class="filter-btn" 
                :class="{ active: typeFilter === '基金合同' }"
                @click="setTypeFilter('基金合同')"
              >
                <text class="btn-text">基金合同</text>
              </button>
            </view>
          </view>
          <view class="filter-group">
            <text class="filter-label">时间范围</text>
            <view class="date-inputs">
              <input 
                class="date-input" 
                type="date" 
                v-model="startDate"
                placeholder="开始日期"
              />
              <text class="date-separator">至</text>
              <input 
                class="date-input" 
                type="date" 
                v-model="endDate"
                placeholder="结束日期"
              />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史记录列表 -->
    <view class="history-section">
      <view class="history-header">
        <text class="history-title">处理历史</text>
        <view class="history-actions">
          <button class="action-btn" @click="exportHistory">
            <text class="btn-text">导出记录</text>
          </button>
          <button class="action-btn" @click="clearHistory">
            <text class="btn-text">清空历史</text>
          </button>
        </view>
      </view>
      
      <view class="history-list">
        <view 
          v-for="(item, index) in filteredHistoryList" 
          :key="index" 
          class="history-item"
          @click="viewHistoryDetail(item)"
        >
          <view class="item-header">
            <view class="item-info">
              <text class="item-name">{{ item.fileName }}</text>
              <text class="item-time">{{ item.time }}</text>
            </view>
            <view class="item-status" :class="item.status">
              <text class="status-text">{{ getStatusText(item.status) }}</text>
            </view>
          </view>
          
                     <view class="item-details">
             <view class="detail-row">
               <text class="detail-label">文件大小:</text>
               <text class="detail-value">{{ item.fileSize }}</text>
             </view>
             <view class="detail-row">
               <text class="detail-label">文档种类:</text>
               <text class="detail-value">{{ item.documentType }}</text>
             </view>
             <view class="detail-row">
               <text class="detail-label">提取字段:</text>
               <text class="detail-value">{{ item.extractedFields }} 个</text>
             </view>
             <view class="detail-row">
               <text class="detail-label">处理时间:</text>
               <text class="detail-value">{{ item.processingTime }}s</text>
             </view>
             <view class="detail-row" v-if="item.accuracy">
               <text class="detail-label">准确率:</text>
               <text class="detail-value">{{ item.accuracy }}%</text>
             </view>
           </view>
          
          <view class="item-actions">
            <button class="action-btn small view" @click.stop="viewResult(item)">
              <text class="btn-text">查看结果</text>
            </button>
            <button class="action-btn small download" @click.stop="downloadResult(item)">
              <text class="btn-text">下载</text>
            </button>
            <button class="action-btn small delete" @click.stop="deleteHistory(item)">
              <text class="btn-text">删除</text>
            </button>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="filteredHistoryList.length === 0" class="empty-state">
        <view class="empty-icon">
          <text class="icon">📋</text>
        </view>
        <text class="empty-title">暂无历史记录</text>
        <text class="empty-desc">上传文件开始提取数据</text>
      </view>
    </view>

    <!-- 分页 -->
    <view v-if="filteredHistoryList.length > 0" class="pagination-section">
      <view class="pagination">
        <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">
          <text class="btn-text">上一页</text>
        </button>
        <view class="page-info">
          <text class="page-text">第 {{ currentPage }} 页，共 {{ totalPages }} 页</text>
        </view>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">
          <text class="btn-text">下一页</text>
        </button>
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
      historyList: [
        {
          id: 1,
          fileName: '华夏成长混合基金发行公告.pdf',
          time: '2024-01-15 14:30',
          status: 'success',
          fileSize: '2.5 MB',
          extractedFields: 15,
          processingTime: 3.5,
          accuracy: 92,
          documentType: '发售公告'
        },
        {
          id: 2,
          fileName: '易方达消费行业股票基金.pdf',
          time: '2024-01-14 16:20',
          status: 'success',
          fileSize: '3.1 MB',
          extractedFields: 14,
          processingTime: 4.2,
          accuracy: 89,
          documentType: '招募说明书'
        },
        {
          id: 3,
          fileName: '嘉实新兴产业股票基金.pdf',
          time: '2024-01-13 09:15',
          status: 'processing',
          fileSize: '2.8 MB',
          extractedFields: 0,
          processingTime: 0,
          accuracy: 0,
          documentType: '基金合同'
        },
        {
          id: 4,
          fileName: '广发稳健增长混合基金.pdf',
          time: '2024-01-12 11:45',
          status: 'failed',
          fileSize: '1.9 MB',
          extractedFields: 0,
          processingTime: 0,
          accuracy: 0,
          documentType: '发售公告'
        },
        {
          id: 5,
          fileName: '招商中证白酒指数基金.pdf',
          time: '2024-01-11 15:30',
          status: 'success',
          fileSize: '2.2 MB',
          extractedFields: 13,
          processingTime: 3.1,
          accuracy: 94,
          documentType: '招募说明书'
        }
      ],
      statusFilter: 'all',
      typeFilter: 'all',
      startDate: '',
      endDate: '',
      currentPage: 1,
      pageSize: 10
    }
  },
  computed: {
    totalFiles() {
      return this.historyList.length
    },
    successCount() {
      return this.historyList.filter(item => item.status === 'success').length
    },
    processingCount() {
      return this.historyList.filter(item => item.status === 'processing').length
    },
    failedCount() {
      return this.historyList.filter(item => item.status === 'failed').length
    },
    filteredHistoryList() {
      let filtered = this.historyList
      
      // 状态筛选
      if (this.statusFilter !== 'all') {
        filtered = filtered.filter(item => item.status === this.statusFilter)
      }
      
      // 类型筛选
      if (this.typeFilter !== 'all') {
        filtered = filtered.filter(item => item.documentType === this.typeFilter)
      }
      
      // 日期筛选
      if (this.startDate) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.time.split(' ')[0])
          const startDate = new Date(this.startDate)
          return itemDate >= startDate
        })
      }
      
      if (this.endDate) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.time.split(' ')[0])
          const endDate = new Date(this.endDate)
          return itemDate <= endDate
        })
      }
      
      return filtered
    },
    totalPages() {
      return Math.ceil(this.filteredHistoryList.length / this.pageSize)
    }
  },
  methods: {
    setStatusFilter(status) {
      this.statusFilter = status
      this.currentPage = 1
    },
    
    setTypeFilter(type) {
      this.typeFilter = type
      this.currentPage = 1
    },
    
    clearFilters() {
      this.statusFilter = 'all'
      this.typeFilter = 'all'
      this.startDate = ''
      this.endDate = ''
      this.currentPage = 1
    },
    
    getStatusText(status) {
      const texts = {
        success: '提取成功',
        processing: '处理中',
        failed: '提取失败'
      }
      return texts[status] || status
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
    
    viewResult(item) {
      if (item.status === 'success') {
        uni.navigateTo({
          url: '/pages/results/results'
        })
      } else {
        uni.showToast({
          title: '该文件尚未处理完成',
          icon: 'none'
        })
      }
    },
    
    downloadResult(item) {
      if (item.status === 'success') {
        uni.showToast({
          title: '下载成功',
          icon: 'success'
        })
      } else {
        uni.showToast({
          title: '该文件尚未处理完成',
          icon: 'none'
        })
      }
    },
    
    deleteHistory(item) {
      uni.showModal({
        title: '确认删除',
        content: `确定要删除 "${item.fileName}" 的记录吗？`,
        success: (res) => {
          if (res.confirm) {
            const index = this.historyList.findIndex(h => h.id === item.id)
            if (index > -1) {
              this.historyList.splice(index, 1)
              uni.showToast({
                title: '删除成功',
                icon: 'success'
              })
            }
          }
        }
      })
    },
    
    exportHistory() {
      uni.showToast({
        title: '导出成功',
        icon: 'success'
      })
    },
    
    clearHistory() {
      uni.showModal({
        title: '确认清空',
        content: '确定要清空所有历史记录吗？此操作不可恢复。',
        success: (res) => {
          if (res.confirm) {
            this.historyList = []
            uni.showToast({
              title: '清空成功',
              icon: 'success'
            })
          }
        }
      })
    },
    
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--
      }
    },
    
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++
      }
    }
  }
}
</script>

<style>
.history-container {
  min-height: 100%;
  background: #f5f5f5;
  padding: 0;
  width: 100%;
  box-sizing: border-box;
}

.stats-section {
  margin-bottom: 40rpx;
  margin-left: -20rpx;
  padding: 20rpx 20rpx 20rpx 20rpx;
}

.stats-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20rpx;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 8rpx;
}

.stat-label {
  display: block;
  font-size: 22rpx;
  color: #666666;
}

.filter-section {
  margin-bottom: 40rpx;
  margin-left: -20rpx;
  padding: 0 20rpx 0 20rpx;
}

.filter-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.filter-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.clear-filter-btn {
  background: #666666;
  color: #ffffff;
  border: none;
  border-radius: 6rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
  align-items: flex-start;
}

.filter-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

.filter-buttons {
  display: flex;
  gap: 15rpx;
  justify-content: flex-start;
  align-items: flex-start;
  flex-wrap: wrap;
}

.filter-btn {
  flex: 0 0 auto;
  background: #f8f9fa;
  color: #666666;
  border: none;
  border-radius: 25rpx;
  padding: 15rpx 55rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
  white-space: nowrap;
  min-width: 160rpx;
}

.filter-btn.active {
  background: #333333;
  color: #ffffff;
}

.date-inputs {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.date-input {
  flex: 1;
  background: #f8f9fa;
  border: none;
  border-radius: 10rpx;
  padding: 20rpx;
  font-size: 26rpx;
  min-height: 60rpx;
}

.date-separator {
  font-size: 24rpx;
  color: #666666;
}

.history-section {
  margin-bottom: 40rpx;
  margin-left: -20rpx;
  padding: 0 20rpx 0 20rpx;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.history-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.history-actions {
  display: flex;
  gap: 15rpx;
}

.action-btn {
  background: #333333;
  color: #ffffff;
  border: none;
  border-radius: 6rpx;
  padding: 10rpx 20rpx;
  font-size: 24rpx;
}

.action-btn.small {
  /* 调整为较长长度 */
  padding: 8rpx 90rpx;
  font-size: 24rpx;
}

.action-btn.view {
  background: var(--color-primary);
  color: #ffffff;
}

.action-btn.download {
  background: var(--color-accent);
  color: #ffffff;
}

.action-btn.delete {
  background: #ff4757;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.history-item {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.history-item:hover {
  background-color: #f8f9fa;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.item-info {
  flex: 1;
}

.item-name {
  display: block;
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.item-time {
  display: block;
  font-size: 24rpx;
  color: #666666;
}

.item-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8rpx 30rpx;
  border-radius: 30rpx;
  font-size: 24rpx;
  font-weight: bold;
  text-align: center;
}

.item-status.success {
  color: #2D6A4F;
  border: 2rpx solid #2D6A4F;
  background: rgba(45, 106, 79, 0.1);
}

.item-status.processing {
  color: #856404;
  border: 2rpx solid #856404;
  background: rgba(133, 100, 4, 0.1);
}

.item-status.failed {
  color: #A63D40;
  border: 2rpx solid #A63D40;
  background: rgba(166, 61, 64, 0.1);
}

.status-text {
  font-weight: bold;
}

.item-details {
  margin-bottom: 20rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.detail-row:last-child {
  margin-bottom: 0;
}

.detail-label {
  font-size: 24rpx;
  color: #666666;
}

.detail-value {
  font-size: 24rpx;
  color: #333333;
  font-weight: bold;
}

.item-actions {
  display: flex;
  gap: 15rpx;
}

.empty-state {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.empty-icon {
  margin-bottom: 30rpx;
}

.empty-icon .icon {
  font-size: 100rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  color: #333333;
  font-weight: bold;
  margin-bottom: 15rpx;
}

.empty-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
}

.pagination-section {
  margin-bottom: 40rpx;
  margin-left: -20rpx;
  padding: 0 20rpx 0 20rpx;
}

.pagination {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.page-btn {
  background: #333333;
  color: #ffffff;
  border: none;
  border-radius: 6rpx;
  padding: 15rpx 30rpx;
  font-size: 24rpx;
}

.page-btn:disabled {
  background: #cccccc;
}

.page-info {
  text-align: center;
}

.page-text {
  font-size: 24rpx;
  color: #666666;
}

.btn-text {
  color: inherit;
}
</style> 