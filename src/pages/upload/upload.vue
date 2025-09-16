<template>
  <view class="web-layout">
    <!-- 左侧导航栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <view class="web-content">
      <view class="content-wrapper">
        <!-- 页面标题 -->
        <view class="page-header fade-in-up">
          <text class="page-title">文件上传</text>
          <text class="page-subtitle">上传基金发行公告PDF文档，系统将自动提取关键信息</text>
        </view>
        
        <view class="upload-container">
    <!-- 文档类型选择 -->
    <view class="document-type-section">
      <view class="section-title">
        <text class="title-text">📋 选择文档类型</text>
        <text class="title-desc">请先选择要上传的基金公告文档类型</text>
      </view>
      <view class="type-cards">
        <view class="type-card" :class="{ 'selected': selectedDocumentType === 'fund_contract' }" @click="selectDocumentType('fund_contract')">
          <view class="type-icon">📄</view>
          <text class="type-name">基金合同</text>
          <text class="type-desc">基金合同相关文档</text>
          <text class="type-fields">提取 44 个字段</text>
        </view>
        <view class="type-card" :class="{ 'selected': selectedDocumentType === 'custody_agreement' }" @click="selectDocumentType('custody_agreement')">
          <view class="type-icon">🏦</view>
          <text class="type-name">托管协议</text>
          <text class="type-desc">基金托管协议文档</text>
          <text class="type-fields">提取 22 个字段</text>
        </view>
        <view class="type-card" :class="{ 'selected': selectedDocumentType === 'prospectus' }" @click="selectDocumentType('prospectus')">
          <view class="type-icon">📊</view>
          <text class="type-name">招募说明书</text>
          <text class="type-desc">基金招募说明书文档</text>
          <text class="type-fields">提取 22 个字段</text>
        </view>
      </view>
    </view>

    <!-- 上传区域 -->
    <view class="upload-area" :class="{ 'disabled': !selectedDocumentType }">
      <view class="upload-card" :class="{ 'drag-over': isDragOver, 'disabled': !selectedDocumentType }" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
        <view class="upload-icon">
          <text class="icon">📄</text>
        </view>
        <text class="upload-title">{{ selectedDocumentType ? '拖拽PDF文件到此处或点击选择' : '请先选择文档类型' }}</text>
        <text class="upload-desc">{{ selectedDocumentType ? '支持基金公告PDF文件，最大50MB' : '选择文档类型后即可上传文件' }}</text>
        
        <button class="select-btn" @click="chooseFile" :disabled="!selectedDocumentType">
          <text class="btn-text">选择文件</text>
        </button>
      </view>
    </view>

    <!-- 文件信息 -->
    <view v-if="selectedFile" class="file-info-section">
      <view class="file-card">
        <view class="file-header">
          <text class="file-name">{{ selectedFile.name }}</text>
          <button class="remove-btn" @click="removeFile">×</button>
        </view>
        <view class="file-details">
          <text class="file-size">大小: {{ formatFileSize(selectedFile.size) }}</text>
          <text class="file-type">类型: PDF文档</text>
        </view>
        
        <!-- 上传进度 -->
        <view v-if="uploadProgress > 0 && uploadProgress < 100" class="progress-section">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: uploadProgress + '%' }"></view>
          </view>
          <text class="progress-text">{{ uploadProgress }}%</text>
        </view>
      </view>
    </view>

    <!-- 提取按钮 -->
    <view v-if="selectedFile && uploadProgress === 100" class="extract-section">
      <button class="extract-btn" @click="startExtract" :disabled="isProcessing">
        <text class="btn-text">{{ isProcessing ? '正在启动AI提取程序...' : '🚀 开始AI数据提取' }}</text>
      </button>
      <view class="extract-tip">
        <text class="tip-text">点击后将启动AI程序，自动提取文档中的关键信息</text>
      </view>
    </view>

    <!-- 提取进度 -->
    <view v-if="isProcessing" class="processing-section">
      <view class="processing-card">
        <view class="processing-icon">
          <text class="icon">⚙️</text>
        </view>
        <text class="processing-title">正在提取数据</text>
        <text class="processing-desc">{{ processingStep }}</text>
        
        <view class="processing-steps">
          <view class="step" :class="{ 'active': currentStep >= 1 }">
            <text class="step-number">1</text>
            <text class="step-text">解析PDF文档</text>
          </view>
          <view class="step" :class="{ 'active': currentStep >= 2 }">
            <text class="step-number">2</text>
            <text class="step-text">识别文本内容</text>
          </view>
          <view class="step" :class="{ 'active': currentStep >= 3 }">
            <text class="step-number">3</text>
            <text class="step-text">提取关键信息</text>
          </view>
          <view class="step" :class="{ 'active': currentStep >= 4 }">
            <text class="step-number">4</text>
            <text class="step-text">生成结构化数据</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 提取完成 -->
    <view v-if="extractComplete" class="complete-section">
      <view class="complete-card">
        <view class="complete-icon">
          <text class="icon">✅</text>
        </view>
        <text class="complete-title">提取完成</text>
        <text class="complete-desc">成功提取了 {{ extractedFieldsCount }} 个字段</text>
        
        <view class="action-buttons">
          <button class="view-btn" @click="viewResults">
            <text class="btn-text">查看结果</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 使用说明 -->
    <view class="help-section">
      <text class="help-title">使用说明</text>
      <view class="help-list">
        <view class="help-item">
          <text class="help-number">1</text>
          <text class="help-text">上传基金发行公告PDF文件</text>
        </view>
        <view class="help-item">
          <text class="help-number">2</text>
          <text class="help-text">系统自动解析文档内容</text>
        </view>
        <view class="help-item">
          <text class="help-number">3</text>
          <text class="help-text">提取关键信息并结构化</text>
        </view>
        <view class="help-item">
          <text class="help-number">4</text>
          <text class="help-text">查看提取结果</text>
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
import { 
  uploadDocumentApi, 
  startExtractionApi, 
  getExtractionProgressApi, 
  getExtractionResultsApi,
  getGlobalConfigApi,
  getDocumentHistoryApi
} from '../../utils/api.js'
import { checkAuthAndRedirect } from '../../utils/auth.js'
import { fullUploadVerification } from '../../utils/backend-test.js'

export default {
  components: {
    Sidebar
  },
  onLoad() {
    // 检查用户是否已登录，未登录则跳转到登录页
    checkAuthAndRedirect()
  },
  data() {
    return {
      selectedFile: null,
      selectedDocumentType: '', // 选中的文档类型
      isDragOver: false,
      uploadProgress: 0,
      isProcessing: false,
      extractComplete: false,
      currentStep: 0,
      processingStep: '正在解析PDF文档...',
      extractedFieldsCount: 0,
      
      // API相关状态
      uploadedFileId: null,
      extractionTaskId: null,
      extractionResults: null,  // 存储完整的提取结果
      progressPollingTimer: null  // 进度轮询定时器
    }
  },
  methods: {
    selectDocumentType(type) {
      this.selectedDocumentType = type
      // 清除之前选择的文件
      this.selectedFile = null
      this.uploadProgress = 0
      this.isProcessing = false
      this.extractComplete = false
      this.currentStep = 0
      
      uni.showToast({
        title: `已选择：${DOCUMENT_TYPES[type.toUpperCase()].label}`,
        icon: 'success'
      })
    },
    
    chooseFile() {
      if (!this.selectedDocumentType) {
        uni.showToast({
          title: '请先选择文档类型',
          icon: 'none'
        })
        return
      }
      
      uni.chooseFile({
        count: 1,
        type: 'file',
        extension: ['.pdf'],
        success: (res) => {
          this.selectedFile = {
            name: res.tempFiles[0].name,
            size: res.tempFiles[0].size,
            path: res.tempFiles[0].path,
            documentType: this.selectedDocumentType
          }
          this.uploadFile()
        },
        fail: (err) => {
          uni.showToast({
            title: '文件选择失败',
            icon: 'none'
          })
        }
      })
    },
    
    handleDrop(e) {
      e.preventDefault()
      this.isDragOver = false
      // 处理拖拽文件
    },
    
    handleDragOver(e) {
      e.preventDefault()
      this.isDragOver = true
    },
    
    handleDragLeave(e) {
      e.preventDefault()
      this.isDragOver = false
    },
    
    removeFile() {
      this.selectedFile = null
      this.uploadProgress = 0
      this.isProcessing = false
      this.extractComplete = false
      this.currentStep = 0
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    },
    
    async uploadFile() {
      try {
        this.uploadProgress = 0
        
        // 构建上传选项
        const uploadOptions = {
          description: `${DOCUMENT_TYPES[this.selectedDocumentType.toUpperCase()]?.label || this.selectedDocumentType}文档上传`,
          folder: 'fund_documents',
          tags: ['基金文档', DOCUMENT_TYPES[this.selectedDocumentType.toUpperCase()]?.label || this.selectedDocumentType]
        }
        
        // 调用真实文件上传API
        const result = await uploadDocumentApi(
          this.selectedFile.path,
          this.selectedDocumentType,
          uploadOptions,
          (progress) => {
            this.uploadProgress = progress
          }
        )
        
        // 保存上传结果
        console.log('🔍 上传结果详情:', result)
        console.log('📋 提取到的文档ID:', result.id)
        
        // 确保ID存在
        if (!result.id) {
          console.error('❌ 上传结果中没有文档ID！')
          throw new Error('上传成功但无法获取文档ID，请重试')
        }
        
        this.uploadedFileId = result.id
        this.selectedFile.id = result.id
        this.uploadProgress = 100
        
        // 验证ID是否正确保存
        console.log('✅ 已保存的uploadedFileId:', this.uploadedFileId)
        
        // 双重检查
        if (!this.uploadedFileId) {
          console.error('❌ uploadedFileId保存失败！')
          throw new Error('文档ID保存失败，请重试')
        }
        
        uni.showToast({
          title: '文件上传成功！请点击"开始提取数据"',
          icon: 'success',
          duration: 3000
        })
        
        // 验证文件是否真正上传到后端
        setTimeout(async () => {
          try {
            console.log('🔍 开始验证文件是否真正上传到后端...')
            const verification = await fullUploadVerification(this.uploadedFileId)
            console.log('📋 上传验证完成:', verification)
          } catch (error) {
            console.error('❌ 上传验证失败:', error)
          }
        }, 1000)
        
      } catch (error) {
        console.error('文件上传失败:', error)
        this.uploadProgress = 0
        uni.showToast({
          title: error.message || '文件上传失败',
          icon: 'none'
        })
      }
    },
    
    async startExtract() {
      if (!['fund_contract', 'custody_agreement', 'prospectus'].includes(this.selectedDocumentType)) {
        uni.showToast({
          title: '该文档类型暂不支持提取',
          icon: 'none'
        })
        return
      }
      
      console.log('🔍 检查上传状态:', {
        uploadedFileId: this.uploadedFileId,
        selectedFile: this.selectedFile,
        uploadProgress: this.uploadProgress
      })
      
      if (!this.uploadedFileId) {
        console.error('❌ 没有找到uploadedFileId')
        uni.showToast({
          title: '请先上传文件',
          icon: 'none'
        })
        return
      }
      
      try {
        this.isProcessing = true
        this.currentStep = 0
        this.processingStep = '正在启动AI数据提取程序...'
        
        // 显示开始提取的提示
        uni.showLoading({
          title: '正在启动提取程序...',
          mask: true
        })
        
        // 检查是否有全局配置
        const globalConfig = await getGlobalConfigApi()
        console.log('🔍 全局配置检查结果:', globalConfig)
        
        // 现在API已经处理好了has_global_config字段
        if (!globalConfig.has_global_config) {
          this.isProcessing = false
          uni.hideLoading()
          uni.showModal({
            title: '需要配置全局模型',
            content: '请先在设置页面配置全局模型和API密钥后再进行提取',
            showCancel: true,
            confirmText: '去设置',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/settings/settings'
                })
              }
            }
          })
          return
        }
        
        console.log('✅ 全局配置检查通过，开始提取')
        
        uni.hideLoading()
        
        this.processingStep = '正在启动提取任务...'
        
        // 构建提取配置，后端将自动使用全局配置
        const extractionConfig = {
          documentType: this.selectedDocumentType,
          fieldsToExtract: [], // 空数组表示提取所有字段
          mode: 'full',
          extractionDepth: 'detailed',
          priority: 'normal',
          minimumConfidence: 0.8
        }
        
        console.log('📋 提取配置详情:', extractionConfig)
        
        // 启动提取任务 - 同步处理，直接返回完成结果
        const extractionResult = await startExtractionApi(this.uploadedFileId, extractionConfig)
        console.log('✅ 提取完成，结果:', extractionResult)
        
        // 后端直接返回完成状态，无需轮询
        if (extractionResult.status === 'COMPLETED') {
          this.extractionTaskId = extractionResult.id
          this.isProcessing = false
          this.extractComplete = true
          this.currentStep = 4
          
          // 保存提取结果供结果页面使用
          this.extractionResults = extractionResult
          
          // 获取提取字段统计
          this.extractedFieldsCount = extractionResult.extractionSummary?.extractedFields || 0
          
          uni.showToast({
            title: '数据提取完成',
            icon: 'success'
          })
          
          // 验证历史记录是否已保存
          this.verifyHistoryRecord()
        } else {
          throw new Error('提取未完成，状态：' + extractionResult.status)
        }
        
      } catch (error) {
        console.error('启动提取失败:', error)
        this.isProcessing = false
        uni.hideLoading()
        
        // 检查是否是全局配置相关的错误
        if (error.message && error.message.includes('配置')) {
          uni.showModal({
            title: '配置错误',
            content: error.message + '\n\n请检查设置页面的全局模型配置',
            showCancel: true,
            confirmText: '去设置',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: '/pages/settings/settings'
                })
              }
            }
          })
        } else {
          uni.showToast({
            title: error.message || '启动提取失败',
            icon: 'none'
          })
        }
      }
    },
    
    
    viewResults() {
      if (this.extractionResults) {
        // 将完整的提取结果存储到本地供结果页面使用
        uni.setStorageSync('currentExtractionResults', this.extractionResults)
        uni.setStorageSync('currentTaskId', this.extractionTaskId)
        uni.navigateTo({
          url: '/pages/results/results'
        })
      } else {
        uni.navigateTo({
          url: '/pages/results/results'
        })
      }
    },
    

    // 验证历史记录是否已保存
    async verifyHistoryRecord() {
      try {
        console.log('🔍 验证历史记录是否已保存...')
        console.log('🔍 当前任务信息:', {
          taskId: this.extractionTaskId,
          fileName: this.selectedFile?.name,
          documentType: this.selectedDocumentType
        })

        // 等待一段时间让后端保存记录
        await new Promise(resolve => setTimeout(resolve, 2000))

        // 获取最近的历史记录
        const historyResponse = await getDocumentHistoryApi({
          page: 1,
          pageSize: 5,
          documentType: this.selectedDocumentType
        })

        console.log('📋 最近的历史记录:', historyResponse)

        if (historyResponse && historyResponse.records && historyResponse.records.length > 0) {
          // 查找当前任务的记录
          const currentRecord = historyResponse.records.find(record => 
            record.taskId === this.extractionTaskId || 
            record.fileName === this.selectedFile?.name
          )

          if (currentRecord) {
            console.log('✅ 找到历史记录:', currentRecord)
          } else {
            console.warn('⚠️ 未找到当前任务的历史记录')
            console.warn('⚠️ 查找条件:', {
              searchTaskId: this.extractionTaskId,
              searchFileName: this.selectedFile?.name,
              availableRecords: historyResponse.records.map(r => ({
                taskId: r.taskId,
                fileName: r.fileName
              }))
            })
            
            // 显示提示给用户
            setTimeout(() => {
              uni.showToast({
                title: '提示：历史记录可能需要几分钟才能显示',
                icon: 'none',
                duration: 3000
              })
            }, 1000)
          }
        } else {
          console.warn('⚠️ 没有获取到任何历史记录')
        }

      } catch (error) {
        console.error('❌ 验证历史记录失败:', error)
        // 不影响主流程，只是记录错误
      }
    },

    // 停止进度轮询（保留此函数以防onUnload调用）
    stopProgressPolling() {
      if (this.progressPollingTimer) {
        clearInterval(this.progressPollingTimer)
        this.progressPollingTimer = null
        console.log('🛑 已停止进度轮询')
      }
    }
  },
  
  // 页面卸载时清理定时器
  onUnload() {
    this.stopProgressPolling()
  }
}
</script>

<style>
.upload-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

/* 文档类型选择区域 */
.document-type-section {
  margin-bottom: 40rpx;
}

.section-title {
  text-align: center;
  margin-bottom: 30rpx;
}

.title-text {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 10rpx;
}

.title-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
  line-height: 1.5;
}

.type-cards {
  display: flex;
  gap: 20rpx;
  justify-content: center;
  flex-wrap: wrap;
}

.type-card {
  width: 280rpx;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  border: 3rpx solid transparent;
  transition: all 0.3s ease;
  cursor: pointer;
}

.type-card:hover {
  transform: translateY(-5rpx);
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
}

.type-card.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.type-icon {
  font-size: 60rpx;
  margin-bottom: 20rpx;
}

.type-name {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
  color: #333333;
}

.type-card.selected .type-name {
  color: #ffffff;
}

.type-desc {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 15rpx;
  line-height: 1.4;
}

.type-card.selected .type-desc {
  color: rgba(255, 255, 255, 0.9);
}

.type-fields {
  display: block;
  font-size: 22rpx;
  color: #999999;
  font-weight: bold;
}

.type-card.selected .type-fields {
  color: rgba(255, 255, 255, 0.8);
}

.upload-area {
  margin-bottom: 40rpx;
}

.upload-area.disabled {
  opacity: 0.6;
  pointer-events: none;
}

.upload-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  border: 3rpx dashed #e0e0e0;
  transition: all 0.3s ease;
}

.upload-card.drag-over {
  border-color: #333333;
  background: #f8f8f8;
}

.upload-icon {
  margin-bottom: 30rpx;
}

.upload-icon .icon {
  font-size: 100rpx;
}

.upload-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.upload-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 40rpx;
}

.select-btn {
  /* 与首页文件上传按钮颜色一致 */
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: #ffffff;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 60rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.select-btn:disabled {
  background: #e9ecef;
  color: #6c757d;
  cursor: not-allowed;
}

.file-info-section {
  margin-bottom: 40rpx;
}

.file-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.file-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
  flex: 1;
}

.remove-btn {
  background: #ff4757;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 60rpx;
  height: 60rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-details {
  margin-bottom: 20rpx;
}

.file-size, .file-type {
  display: block;
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.progress-section {
  margin-top: 20rpx;
}

.progress-bar {
  width: 100%;
  height: 10rpx;
  background: #f0f0f0;
  border-radius: 5rpx;
  overflow: hidden;
  margin-bottom: 10rpx;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 24rpx;
  color: #666666;
  text-align: center;
}

.extract-section {
  margin-bottom: 40rpx;
}

.extract-btn {
  width: 100%;
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #ffffff;
  border: none;
  border-radius: 50rpx;
  padding: 25rpx;
  font-size: 32rpx;
  font-weight: bold;
}

.extract-btn:disabled {
  background: #cccccc;
}

.extract-tip {
  text-align: center;
  margin-top: 20rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.4;
}

.processing-section {
  margin-bottom: 40rpx;
}

.processing-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.processing-icon {
  margin-bottom: 30rpx;
}

.processing-icon .icon {
  font-size: 80rpx;
}

.processing-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.processing-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 40rpx;
}

.processing-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 40rpx;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  opacity: 0.3;
  transition: opacity 0.3s ease;
}

.step.active {
  opacity: 1;
}

.step-number {
  width: 60rpx;
  height: 60rpx;
  background: #333333;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.step-text {
  font-size: 24rpx;
  color: #666666;
  text-align: center;
}

.complete-section {
  margin-bottom: 40rpx;
}

.complete-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  text-align: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.complete-icon {
  margin-bottom: 30rpx;
}

.complete-icon .icon {
  font-size: 80rpx;
}

.complete-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 20rpx;
}

.complete-desc {
  display: block;
  font-size: 28rpx;
  color: #666666;
  margin-bottom: 40rpx;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20rpx;
}

.view-btn {
  background: #333333;
  color: #ffffff;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx 60rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.help-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.help-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
  text-align: center;
}

.help-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.help-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.help-number {
  width: 50rpx;
  height: 50rpx;
  background: #333333;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
}

.help-text {
  font-size: 28rpx;
  color: #333333;
  flex: 1;
}

.btn-text {
  color: inherit;
}
</style> 