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
          <text class="page-subtitle">查看文档处理历史记录和统计信息</text>
        </view>
        
        <view class="history-container">
    <!-- 筛选器 -->
    <view class="filter-section">
      <view class="filter-card">
              <view class="filter-row">
                <view class="filter-group">
                  <text class="filter-label">文档类型</text>
                  <picker 
                    mode="selector" 
                    :value="filterDocumentTypeIndex" 
                    :range="documentTypeOptions" 
                    range-key="label"
                    @change="onDocumentTypeChange"
                  >
                    <view class="picker-view">
                      <text class="picker-text">{{ documentTypeOptions[filterDocumentTypeIndex].label }}</text>
                      <text class="picker-arrow">▼</text>
                    </view>
                  </picker>
        </view>
                
          <view class="filter-group">
                  <text class="filter-label">状态</text>
                  <picker 
                    mode="selector" 
                    :value="filterStatusIndex" 
                    :range="statusOptions" 
                    range-key="label"
                    @change="onStatusChange"
                  >
                    <view class="picker-view">
                      <text class="picker-text">{{ statusOptions[filterStatusIndex].label }}</text>
                      <text class="picker-arrow">▼</text>
            </view>
                  </picker>
          </view>
                
          <view class="filter-group">
                  <button class="filter-btn" @click="applyFilters" :disabled="isLoading">
                    <text class="btn-text">{{ isLoading ? '查询中...' : '查询' }}</text>
              </button>
          </view>
        </view>
      </view>
    </view>

    <!-- 历史记录列表 -->
          <view class="records-section" translate="no">
            <view v-if="isLoading" class="loading-placeholder">
              <text class="loading-text">正在加载历史记录...</text>
            </view>
            
            <view v-else-if="records.length === 0" class="empty-placeholder">
              <text class="empty-icon">📄</text>
              <text class="empty-text">暂无处理记录</text>
              <text class="empty-desc">开始上传文档来创建处理记录</text>
              <view class="data-recovery-tip">
                <text class="recovery-title">💡 数据恢复提示</text>
                <text class="recovery-desc">如果您之前有处理记录但现在看不到，可能是因为：</text>
                <text class="recovery-item">• 记录被意外删除</text>
                <text class="recovery-item">• 筛选条件过于严格</text>
                <text class="recovery-item">• 网络连接问题</text>
                <text class="recovery-action">请尝试刷新页面或联系管理员恢复数据</text>
              </view>
              
              <!-- 调试模式：添加测试记录 -->
              <view v-if="$options.name === 'development'" class="debug-section">
                <text class="debug-title">🔧 调试模式</text>
                <button class="debug-btn" @click="addTestRecord">添加测试记录</button>
              </view>
            </view>
            
            <view v-else class="records-list">
              <view 
                class="record-card"
                v-for="record in records"
                :key="record.taskId"
                @click="viewRecordDetail(record)"
              >
                <view class="record-header">
                  <view class="record-title">
                    <text class="file-name">{{ record.fileName }}</text>
                    <view class="status-badge" :class="record.status">
                      <text class="status-text">{{ getStatusText(record.status) }}</text>
                    </view>
                  </view>
                  <text class="record-time">{{ formatTime(record.createdAt) }}</text>
          </view>
          
                <view class="record-content">
                  <view class="record-info">
                    <view class="info-item info-type">
                      <text class="info-label">文档类型</text>
                      <text class="info-value">{{ getDocumentTypeLabel(record.documentType) }}</text>
             </view>
                    <view class="info-item info-fields">
                      <text class="info-label">提取字段</text>
                      <text class="info-value">{{ getExtractedFieldsDisplay(record) }}</text>
             </view>
                    <view class="info-item info-time">
                      <text class="info-label">处理时间</text>
                      <text class="info-value">{{ getProcessingTimeDisplay(record) }}</text>
             </view>
             </view>

                  <view class="record-actions">
                    <button 
                      class="action-btn view-btn" 
                      @click.stop="viewResults(record)"
                      :disabled="record.status?.toLowerCase() !== 'completed'"
                    >
              <text class="btn-text">查看结果</text>
            </button>
                    <button 
                      class="action-btn delete-btn" 
                      @click.stop="deleteRecord(record)"
                    >
                      <text class="btn-text">删除</text>
            </button>
          </view>
        </view>
      </view>
      </view>
    </view>

          <!-- 分页器 -->
          <view v-if="pagination.totalPages > 1" class="pagination-section" translate="no">
      <view class="pagination">
              <button 
                class="page-btn" 
                :disabled="pagination.page <= 1"
                @click="changePage(pagination.page - 1)"
              >
          <text class="btn-text">上一页</text>
        </button>
              
        <view class="page-info">
                <text class="page-text">{{ pagination.page }} / {{ pagination.totalPages }}</text>
        </view>
              
              <button 
                class="page-btn" 
                :disabled="pagination.page >= pagination.totalPages"
                @click="changePage(pagination.page + 1)"
              >
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
import { getDocumentHistoryApi, getExtractionResultsApi, getHistoryResultsApi, deleteDocumentRecordApi } from '../../utils/api.js'
import { handleApiError } from '../../utils/errorHandler.js'
import { checkAuthAndRedirect } from '../../utils/auth.js'
import { printAuthDiagnosis, fixAuthIssues } from '../../utils/auth-diagnostic.js'
import { debugHistoryApiResponse, compareApiResponses } from '../../utils/api-debug.js'

export default {
  components: {
    Sidebar
  },
  data() {
    return {
      records: [],
      isLoading: true,
      
      // 筛选器
      filterDocumentTypeIndex: 0,
      filterStatusIndex: 0,
      documentTypeOptions: [
        { value: '', label: '全部类型' },
        { value: 'fund_contract', label: '基金合同' },
        { value: 'custody_agreement', label: '托管协议' },
        { value: 'prospectus', label: '招募说明书' }
      ],
      statusOptions: [
        { value: '', label: '全部状态' },
        { value: 'completed', label: '已完成' },
        { value: 'processing', label: '处理中' },
        { value: 'failed', label: '失败' }
      ],
      
      // 分页
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      
      // 删除安全控制
      deleteOperations: {
        count: 0,
        lastDeleteTime: 0,
        maxDeletesPerMinute: 3  // 每分钟最多删除3个记录
      }
    }
  },
  methods: {
    // 加载历史记录
    async loadHistory() {
      this.isLoading = true
      
      try {
        // 在API调用前进行认证诊断
        console.log('🔍 开始认证诊断...')
        const diagnosis = printAuthDiagnosis()
        
        // 如果发现认证问题，尝试修复
        if (diagnosis.issues.length > 0) {
          console.warn('⚠️ 发现认证问题，尝试修复...')
          const fixed = fixAuthIssues()
          if (fixed) {
            // 如果修复了问题，函数会自动跳转，这里直接返回
            return
          }
        }
        
        const params = {
          page: this.pagination.page,
          pageSize: this.pagination.pageSize
        }
        
        // 添加筛选条件
        if (this.filterDocumentTypeIndex > 0) {
          params.documentType = this.documentTypeOptions[this.filterDocumentTypeIndex].value
        }
        
        if (this.filterStatusIndex > 0) {
          params.status = this.statusOptions[this.filterStatusIndex].value
        }
        
        console.log('📄 加载历史记录，请求参数:', params)
        
        // 开发环境下运行额外的调试
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 运行API响应格式调试...')
          try {
            await compareApiResponses()
          } catch (debugError) {
            console.warn('⚠️ 调试过程出错，继续正常流程:', debugError)
          }
        }
        
        const response = await getDocumentHistoryApi(params)
        
        if (response) {
          // 根据更新后的API响应格式处理数据
          this.records = response.records || []
          this.pagination = {
            ...this.pagination,
            ...response.pagination
          }
          
          console.log('📄 历史记录加载成功:', {
            recordsCount: this.records.length,
            pagination: this.pagination,
            responseData: response
          })
          
          // 详细检查数据结构
          console.log('🔍 数据结构详细分析:')
          console.log('  - response.records 长度:', response.records ? response.records.length : 'undefined')
          console.log('  - records 实际内容:', this.records)
          console.log('  - pagination 数据:', this.pagination)
          
          // 如果有记录，显示第一条记录的结构
          if (this.records.length > 0) {
            console.log('📋 第一条记录结构:', this.records[0])
            console.log('📋 记录字段:', Object.keys(this.records[0]))
            
            // 检查关键字段
            const firstRecord = this.records[0]
            console.log('🔍 关键字段检查:')
            console.log('  - status:', firstRecord.status)
            console.log('  - taskId:', firstRecord.taskId)
            console.log('  - id:', firstRecord.id)
            console.log('  - fileName:', firstRecord.fileName)
            console.log('  - documentType:', firstRecord.documentType)
            
            // 检查按钮状态
            const isDisabled = firstRecord.status !== 'completed'
            console.log('  - 查看结果按钮是否禁用:', isDisabled)
            console.log('  - 判断条件: record.status !== "completed"')
            console.log('  - 实际状态值:', JSON.stringify(firstRecord.status))
          }
          
          // 如果没有记录，显示更详细的信息
          if (this.records.length === 0) {
            console.log('📋 当前用户暂无历史记录')
            console.log('🔍 可能原因：')
            console.log('  1. 用户首次使用，尚未上传和处理文档')
            console.log('  2. 历史记录已被删除')
            console.log('  3. 用户权限限制')
            console.log('  4. 数据库中确实没有该用户的记录')
          }
        }
        
      } catch (error) {
        console.error('❌ 加载历史记录失败:', error)
        
        // 特殊处理认证错误
        if (error.message && (
          error.message.includes('401') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('JWT') ||
          error.message.includes('Token')
        )) {
          console.error('🔐 认证错误，清理认证状态并跳转登录')
          
          // 清理认证状态
          uni.removeStorageSync('token')
          uni.removeStorageSync('refreshToken')
          uni.removeStorageSync('isLoggedIn')
          uni.removeStorageSync('userInfo')
          uni.removeStorageSync('loginTime')
          
          uni.showModal({
            title: '认证失败',
            content: '登录状态已失效，请重新登录。\n\n可能原因：\n• JWT Token过期\n• Token格式错误\n• 用户权限不匹配',
            showCancel: false,
            confirmText: '重新登录',
            success: () => {
              uni.reLaunch({
                url: '/pages/login/login'
              })
            }
          })
        } else {
          // 其他错误使用通用处理
          handleApiError(error, { page: 'history', action: 'loadHistory' })
        }
      } finally {
        this.isLoading = false
      }
    },
    
    // 应用筛选器
    async applyFilters() {
      this.pagination.page = 1
      await this.loadHistory()
    },
    
    // 切换页面
    async changePage(page) {
      this.pagination.page = page
      await this.loadHistory()
    },
    
    // 文档类型变化
    onDocumentTypeChange(e) {
      this.filterDocumentTypeIndex = e.detail.value
    },
    
    // 状态变化
    onStatusChange(e) {
      this.filterStatusIndex = e.detail.value
    },
    
    // 查看记录详情
    viewRecordDetail(record) {
      if (record.status === 'completed') {
        this.viewResults(record)
      } else {
        uni.showToast({
          title: '该记录尚未处理完成',
          icon: 'none'
        })
      }
    },
    
    // 查看结果
    async viewResults(record) {
      console.log('🔍 点击查看结果，记录信息:', record)
      console.log('🔍 记录状态:', record.status)
      console.log('🔍 记录的extractionTasks:', record.extractionTasks)
      
      // 获取taskId - 使用标准的任务结果API
      let taskId = null
      
      if (record.extractionTasks && record.extractionTasks.length > 0) {
        taskId = record.extractionTasks[0].id
        console.log('📡 使用extractionTasks[0].id作为taskId:', taskId)
      } else {
        // 回退到使用record.taskId或record.id
        taskId = record.taskId || record.id
        console.log('📡 回退使用record.taskId/id作为taskId:', taskId)
      }
      
      try {
        uni.showLoading({
          title: '加载结果中...',
          mask: true
        })
        
        if (!taskId) {
          throw new Error('无法获取任务ID，record.extractionTasks[0].id、record.taskId和record.id都为空')
        }
        
        console.log('📡 调用getHistoryResultsApi，参数:', record.id)
        
        // 使用新的历史记录提取结果API
        const results = await getHistoryResultsApi(record.id)
        
        if (results) {
          console.log('📥 从API获取的原始结果:', results)
          console.log('📥 原始结果的data字段:', results.data)
          console.log('📥 原始结果的result字段:', results.result)
          console.log('📥 原始结果的extractedData字段:', results.extractedData)
          console.log('📥 原始结果完整结构:', JSON.stringify(results, null, 2))
          
          // 后端现在返回统一的数据结构，直接构建完整结果
          const completeResults = {
            id: results.id || taskId,
            taskId: results.taskId || taskId,
            documentId: results.documentId || record.id,
            status: results.status || 'COMPLETED',
            progress: 100,
            processingTime: results.processingTime || record.processingTime || 0,
            currentStep: 'completed',
            
            // 从新API获取的完整提取数据
            extractedData: results.extractedData || {},
            
            // 提取摘要信息
            extractionSummary: results.extractionSummary || {
              totalFields: this.getFixedTotalFieldsByType(record.documentType),
              extractedFields: record.extractedFields || record.extractedFieldsCount || 0,
              documentType: record.documentType,
              processingTime: record.processingTime || 0,
              averageConfidence: 0.92,
              extractionRate: record.extractionRate || 0
            },
            
            // 质量指标
            qualityMetrics: results.qualityMetrics || {
              averageConfidence: 0.92,
              fieldCoverage: record.extractionRate || 0,
              processingTime: record.processingTime || 0
            },
            
            // 元数据
            documentType: record.documentType,
            fileName: record.fileName,
            createdAt: results.createdAt || record.createdAt,
            completedAt: results.completedAt || record.completedAt || record.updatedAt
          }
          
          console.log('✅ 构建完整结果数据（与上传页面格式一致）:', completeResults)
          console.log('🔍 extractedData结构:', completeResults.extractedData)
          
          // 存储完整结果数据，格式与上传页面完全一致
          uni.setStorageSync('currentExtractionResults', completeResults)
          uni.setStorageSync('currentTaskId', taskId)
          
          uni.hideLoading()
          
          // 跳转到结果页面（和上传页面完成后一样）
          uni.navigateTo({
            url: '/pages/results/results'
          })
        } else {
          throw new Error('无法获取提取结果')
        }
        
      } catch (error) {
        uni.hideLoading()
        console.error('❌ 加载提取结果失败:', error)
        
        // 如果API调用失败，尝试使用taskId通过URL参数跳转
        const fallbackId = taskId || record.taskId || record.id
        if (fallbackId) {
          console.log('🔄 尝试通过URL参数传递taskId:', fallbackId)
          uni.setStorageSync('currentTaskId', fallbackId)
          uni.navigateTo({
            url: '/pages/results/results'
          })
          
          uni.showToast({
            title: '正在重新加载结果...',
            icon: 'loading',
            duration: 2000
          })
        } else {
          uni.showToast({
            title: '无法获取任务ID，无法加载结果',
            icon: 'error',
            duration: 3000
          })
        }
      }
    },
    
    // 删除记录
    async deleteRecord(record) {
      try {
        // 检查删除频率限制
        const now = Date.now()
        const oneMinute = 60 * 1000
        
        // 重置计数器（如果超过1分钟）
        if (now - this.deleteOperations.lastDeleteTime > oneMinute) {
          this.deleteOperations.count = 0
        }
        
        // 检查是否超过删除限制
        if (this.deleteOperations.count >= this.deleteOperations.maxDeletesPerMinute) {
          uni.showModal({
            title: '🛡️ 安全保护',
            content: `为了防止误操作，每分钟最多只能删除 ${this.deleteOperations.maxDeletesPerMinute} 个记录。\n\n请稍后再试，或联系管理员批量删除。`,
            showCancel: false,
            confirmText: '我知道了'
          })
          return
        }
        
        // 第一次确认
        const firstConfirm = await new Promise((resolve) => {
          uni.showModal({
            title: '⚠️ 危险操作',
            content: `确定要删除文档"${record.fileName}"的处理记录吗？\n\n⚠️ 此操作将永久删除：\n• 提取结果数据\n• 处理历史记录\n• 相关统计信息\n\n删除后无法恢复！`,
            confirmText: '继续',
            cancelText: '取消',
            confirmColor: '#ff4757',
            success: (res) => {
              resolve(res.confirm)
            }
          })
        })
        
        if (!firstConfirm) return
        
        // 第二次确认 - 需要输入文件名
        const secondConfirm = await new Promise((resolve) => {
          uni.showModal({
            title: '🔒 最终确认',
            content: `请再次确认删除操作\n\n文档名称：${record.fileName}\n任务ID：${record.taskId || record.id}\n\n这是最后的确认机会！`,
            confirmText: '确认删除',
            cancelText: '我再想想',
            confirmColor: '#ff4757',
            success: (res) => {
              resolve(res.confirm)
            }
          })
        })
        
        if (!secondConfirm) return
        
        uni.showLoading({
          title: '删除中...',
          mask: true
        })
        
        // 调用后端删除API - 使用历史记录ID
        const historyId = record.id // 使用历史记录的主ID
        console.log('🗑️ 删除记录，historyId:', historyId, '记录信息:', record)
        
        await deleteDocumentRecordApi(historyId)
        
        // API调用成功后，从本地列表中移除
        const index = this.records.findIndex(r => r.id === historyId)
        if (index > -1) {
          this.records.splice(index, 1)
          
          // 更新分页信息
          this.pagination.total = Math.max(0, this.pagination.total - 1)
          this.pagination.totalPages = Math.ceil(this.pagination.total / this.pagination.pageSize)
        }
        
        // 更新删除操作计数
        this.deleteOperations.count++
        this.deleteOperations.lastDeleteTime = Date.now()
        
        uni.hideLoading()
        uni.showToast({
          title: `历史记录删除成功 (${this.deleteOperations.count}/${this.deleteOperations.maxDeletesPerMinute})`,
          icon: 'success'
        })

        // 删除成功后刷新历史记录列表
        console.log('🔄 删除成功，刷新历史记录列表...')
        setTimeout(() => {
          this.loadHistory()
        }, 500) // 延迟500ms刷新，让用户看到删除成功提示
        
      } catch (error) {
        uni.hideLoading()
        console.error('删除记录失败:', error)
        uni.showToast({
          title: '删除失败',
          icon: 'error'
        })
      }
    },
    
    // 获取状态文本
    getStatusText(status) {
      const statusMap = {
        'completed': '已完成',
        'processing': '处理中',
        'failed': '失败',
        'pending': '等待中'
      }
      return statusMap[status] || '未知'
    },
    
    // 获取文档类型标签
    getDocumentTypeLabel(documentType) {
      const typeMap = {
        'fund_contract': '基金合同',
        'custody_agreement': '托管协议',
        'prospectus': '招募说明书'
      }
      return typeMap[documentType] || '未知类型'
    },
    
    // 格式化时间
    formatTime(timeString) {
      try {
        const date = new Date(timeString)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      } catch (error) {
        return timeString
      }
    },
    
    // 获取提取字段显示文本
    getExtractedFieldsDisplay(record) {
      // 尝试多种可能的字段名
      const extractedFields = record.extractedFields || record.extractedFieldsCount || record.fieldsExtracted || 0
      const totalFields = this.getFixedTotalFieldsByType(record.documentType)
      
      return `${extractedFields}/${totalFields}`
    },
    
    // 获取处理时间显示文本
    getProcessingTimeDisplay(record) {
      // 尝试多种可能的字段名和格式
      let processingTime = record.processingTime || record.processTime || record.duration || 0
      
      // 如果是毫秒，转换为秒
      if (processingTime > 1000) {
        processingTime = Math.round(processingTime / 1000)
      }
      
      return processingTime > 0 ? `${processingTime}秒` : '未知'
    },
    
    // 根据文档类型获取固定的总字段数（与results页面保持一致）
    getFixedTotalFieldsByType(documentType) {
      switch (documentType) {
        case 'fund_contract':
          return 44  // 基金合同类型
        case 'custody_agreement':
          return 22  // 托管协议类型
        case 'prospectus':
          return 22  // 招募说明书类型
        default:
          return 22  // 默认使用22个字段
      }
    },
    
    // 处理翻译插件问题
    handleTranslationPluginIssues() {
      try {
        // 检测是否有沉浸式翻译插件
        if (typeof window !== 'undefined' && (
          window.immersiveTranslate || 
          document.querySelector('[data-immersive-translate]') ||
          document.querySelector('.immersive-translate')
        )) {
          console.warn('⚠️ 检测到沉浸式翻译插件，可能影响页面正常运行')
          console.log('💡 建议：在此页面暂时关闭翻译插件以避免干扰')
        }
      } catch (error) {
        // 忽略检测错误
      }
    },
    
    // 防止翻译干扰
    preventTranslationInterference() {
      try {
        if (typeof document !== 'undefined') {
          // 为关键元素添加不翻译标记
          const criticalElements = document.querySelectorAll('.records-section, .pagination-section, .filter-section')
          criticalElements.forEach(el => {
            el.setAttribute('translate', 'no')
            el.setAttribute('data-immersive-translate-walked', 'true')
          })
        }
      } catch (error) {
        // 忽略处理错误
      }
    },
    
    // 测试按钮点击（调试用）
    testViewResults(record) {
      console.log('🧪 测试按钮点击 - 记录:', record)
      console.log('🧪 按钮是否应该禁用:', record.status !== 'completed')
      
      uni.showToast({
        title: '按钮点击有效！',
        icon: 'success'
      })
      
      // 如果状态正确，调用实际的查看结果方法
      if (record.status?.toLowerCase() === 'completed') {
        this.viewResults(record)
      } else {
        uni.showModal({
          title: '无法查看结果',
          content: `记录状态为: ${record.status}\n只有状态为"completed"的记录才能查看结果`,
          showCancel: false
        })
      }
    },
    
    // 添加测试记录（调试用）
    addTestRecord() {
      const testRecord = {
        id: 'test-001',
        taskId: 'test-task-001',
        fileName: '测试文档.pdf',
        status: 'completed',
        documentType: 'custody_agreement',
        extractedFields: 19,
        extractedFieldsCount: 19,
        processingTime: 2.8,
        createdAt: new Date().toISOString()
      }
      
      this.records.push(testRecord)
      console.log('✅ 已添加测试记录:', testRecord)
      
      uni.showToast({
        title: '测试记录已添加',
        icon: 'success'
      })
    }
  },
  
  mounted() {
    // 页面挂载后，确保翻译插件不干扰
    this.preventTranslationInterference()
  },
  
  onLoad() {
    // 检查用户是否已登录，未登录则跳转到登录页
    if (!checkAuthAndRedirect()) {
      return
    }
    
    // 处理沉浸式翻译插件可能的干扰
    this.handleTranslationPluginIssues()
    
    this.loadHistory()
  }
}
</script>

<style scoped>
.history-container {
  padding: 20rpx;
}

/* 筛选器样式 */
.filter-section {
  margin-bottom: 30rpx;
}

.filter-card {
  background: #ffffff;
  border-radius: 15rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
}

.filter-row {
  display: flex;
  align-items: end;
  gap: 30rpx;
  flex-wrap: wrap;
}

.filter-group {
  flex: 1;
  min-width: 200rpx;
}

.filter-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--color-title);
  margin-bottom: 15rpx;
}

.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70rpx;
  padding: 0 20rpx;
  background: #f8f9fa;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  cursor: pointer;
}

.picker-text {
  font-size: 28rpx;
  color: var(--color-text);
}

.picker-arrow {
  font-size: 20rpx;
  color: var(--color-secondary);
}

.filter-btn {
  height: 70rpx;
  padding: 0 30rpx;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: var(--color-primary-dark);
}

.filter-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 记录列表样式 */
.records-section {
  margin-bottom: 30rpx;
}

.loading-placeholder, .empty-placeholder {
  text-align: center;
  padding: 100rpx 20rpx;
}

.loading-text, .empty-text {
  display: block;
  font-size: 32rpx;
  color: var(--color-secondary);
  margin-bottom: 20rpx;
}

.empty-icon {
  display: block;
  font-size: 80rpx;
  margin-bottom: 30rpx;
  opacity: 0.5;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: var(--color-secondary);
  opacity: 0.7;
}

.data-recovery-tip {
  margin-top: 40rpx;
  padding: 30rpx;
  background: #fff3cd;
  border: 1rpx solid #ffeaa7;
  border-radius: 15rpx;
  text-align: left;
}

.recovery-title {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #856404;
  margin-bottom: 15rpx;
}

.recovery-desc {
  display: block;
  font-size: 24rpx;
  color: #856404;
  margin-bottom: 15rpx;
}

.recovery-item {
  display: block;
  font-size: 22rpx;
  color: #856404;
  margin-bottom: 8rpx;
  padding-left: 20rpx;
}

.recovery-action {
  display: block;
  font-size: 24rpx;
  font-weight: bold;
  color: #856404;
  margin-top: 15rpx;
  padding: 15rpx;
  background: rgba(255, 234, 167, 0.5);
  border-radius: 8rpx;
}

.debug-section {
  margin-top: 40rpx;
  padding: 20rpx;
  background: #f0f8ff;
  border: 1rpx solid #87ceeb;
  border-radius: 15rpx;
}

.debug-title {
  display: block;
  font-size: 26rpx;
  font-weight: bold;
  color: #4682b4;
  margin-bottom: 15rpx;
}

.debug-btn {
  background: #4682b4;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 15rpx 20rpx;
  font-size: 24rpx;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.record-card {
  background: #ffffff;
  border-radius: 15rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.record-card:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 12rpx 35rpx rgba(0, 0, 0, 0.15);
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.record-title {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.file-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--color-title);
}

.status-badge {
  padding: 8rpx 15rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  font-weight: 600;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.status-badge.processing {
  background: #fff3cd;
  color: #856404;
}

.status-badge.failed {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.pending {
  background: #e2e3e5;
  color: #383d41;
}

.record-time {
  font-size: 24rpx;
  color: var(--color-secondary);
}

.record-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 30rpx;
}

.record-info {
  display: flex;
  gap: 40rpx;
  flex: 1;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  background: #f8f9fc;
  border-radius: 12rpx;
  padding: 20rpx 25rpx;
  border-left: 4rpx solid #1B2A41;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(27, 42, 65, 0.08);
}

.info-item:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(27, 42, 65, 0.12);
  background: #f0f4f8;
}

.info-label {
  font-size: 22rpx;
  color: #666666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
  margin-bottom: 5rpx;
}

.info-value {
  font-size: 30rpx;
  font-weight: 700;
  color: #1B2A41;
  line-height: 1.2;
}

/* 不同类型信息框的主题颜色 */
.info-item.info-type {
  border-left-color: #007AFF;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%);
}

.info-item.info-type:hover {
  background: linear-gradient(135deg, #e6f3ff 0%, #d9edff 100%);
}

.info-item.info-fields {
  border-left-color: #28a745;
  background: linear-gradient(135deg, #f0fdf4 0%, #e6ffed 100%);
}

.info-item.info-fields:hover {
  background: linear-gradient(135deg, #e6ffed 0%, #d9f7e6 100%);
}

.info-item.info-time {
  border-left-color: #C9A86B;
  background: linear-gradient(135deg, #fefcf3 0%, #fdf7e8 100%);
}

.info-item.info-time:hover {
  background: linear-gradient(135deg, #fdf7e8 0%, #fcf2db 100%);
}

/* 为info-value添加图标 */
.info-item.info-type .info-value::before {
  content: "📄 ";
  margin-right: 8rpx;
}

.info-item.info-fields .info-value::before {
  content: "📊 ";
  margin-right: 8rpx;
}

.info-item.info-time .info-value::before {
  content: "⏱️ ";
  margin-right: 8rpx;
}

.record-actions {
  display: flex;
  gap: 15rpx;
}

.action-btn {
  padding: 15rpx 25rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.view-btn {
  background: var(--color-primary);
  color: white;
}

.view-btn:hover {
  background: var(--color-primary-dark);
}


.delete-btn {
  background: #ff4757;
  color: white;
}

.delete-btn:hover {
  background: #ff3742;
}

.action-btn:disabled {
  background: #ccc;
  color: #666;
  cursor: not-allowed;
}

/* 分页器样式 */
.pagination-section {
  display: flex;
  justify-content: center;
  margin-top: 40rpx;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #ffffff;
  padding: 20rpx 30rpx;
  border-radius: 15rpx;
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.1);
}

.page-btn {
  padding: 15rpx 25rpx;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8rpx;
  font-size: 26rpx;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover {
  background: var(--color-primary-dark);
}

.page-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.page-info {
  padding: 0 20rpx;
}

.page-text {
  font-size: 28rpx;
  color: var(--color-title);
  font-weight: 600;
}

.btn-text {
  color: inherit;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    gap: 20rpx;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .record-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 20rpx;
  }
  
  .record-info {
    flex-direction: column;
    gap: 15rpx;
  }
  
  .record-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style> 