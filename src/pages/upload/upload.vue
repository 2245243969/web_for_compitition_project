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
    <!-- 上传区域 -->
    <view class="upload-area">
      <view class="upload-card" :class="{ 'drag-over': isDragOver }" @drop="handleDrop" @dragover="handleDragOver" @dragleave="handleDragLeave">
        <view class="upload-icon">
          <text class="icon">📄</text>
        </view>
        <text class="upload-title">拖拽PDF文件到此处或点击选择</text>
        <text class="upload-desc">支持基金发行公告PDF文件，最大50MB</text>
        
        <button class="select-btn" @click="chooseFile">
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
        <text class="btn-text">{{ isProcessing ? '正在提取...' : '开始提取数据' }}</text>
      </button>
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
          <button class="export-btn" @click="exportResults">
            <text class="btn-text">导出数据</text>
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
          <text class="help-text">查看和导出提取结果</text>
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

export default {
  components: {
    Sidebar
  },
  data() {
    return {
      selectedFile: null,
      isDragOver: false,
      uploadProgress: 0,
      isProcessing: false,
      extractComplete: false,
      currentStep: 0,
      processingStep: '正在解析PDF文档...',
      extractedFieldsCount: 0
    }
  },
  methods: {
    chooseFile() {
      uni.chooseFile({
        count: 1,
        type: 'file',
        extension: ['.pdf'],
        success: (res) => {
          this.selectedFile = {
            name: res.tempFiles[0].name,
            size: res.tempFiles[0].size,
            path: res.tempFiles[0].path
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
    
    uploadFile() {
      // 模拟上传过程
      this.uploadProgress = 0
      const interval = setInterval(() => {
        this.uploadProgress += 10
        if (this.uploadProgress >= 100) {
          clearInterval(interval)
          uni.showToast({
            title: '文件上传成功',
            icon: 'success'
          })
        }
      }, 200)
    },
    
    startExtract() {
      this.isProcessing = true
      this.currentStep = 0
      this.processingStep = '正在解析PDF文档...'
      
      // 模拟提取过程
      const steps = [
        '正在解析PDF文档...',
        '正在识别文本内容...',
        '正在提取关键信息...',
        '正在生成结构化数据...'
      ]
      
      let stepIndex = 0
      const stepInterval = setInterval(() => {
        this.currentStep = stepIndex + 1
        this.processingStep = steps[stepIndex]
        
        if (stepIndex >= steps.length - 1) {
          clearInterval(stepInterval)
          setTimeout(() => {
            this.isProcessing = false
            this.extractComplete = true
            this.extractedFieldsCount = 15
          }, 1000)
        }
        stepIndex++
      }, 1500)
    },
    
    viewResults() {
      uni.navigateTo({
        url: '/pages/results/results'
      })
    },
    
    exportResults() {
      uni.showToast({
        title: '数据导出成功',
        icon: 'success'
      })
    }
  }
}
</script>

<style>
.upload-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
}

.upload-area {
  margin-bottom: 40rpx;
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
  gap: 20rpx;
}

.view-btn, .export-btn {
  flex: 1;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.view-btn {
  background: #333333;
  color: #ffffff;
}

.export-btn {
  background: #666666;
  color: #ffffff;
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