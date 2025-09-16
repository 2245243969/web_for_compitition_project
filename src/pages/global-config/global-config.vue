<template>
  <view class="global-config-page">
    <!-- 头部标题 -->
    <view class="header">
      <view class="title">
        <text class="icon">⚙️</text>
        <text class="text">全局模型配置</text>
      </view>
      <view class="subtitle">设置一次后，所有PDF处理都会默认使用此配置</view>
    </view>

    <!-- 当前配置状态 -->
    <view class="config-status" v-if="currentConfig.has_global_config">
      <view class="status-header">
        <text class="status-icon">✅</text>
        <text class="status-text">当前已配置：{{ currentConfig.config.display_name }}</text>
      </view>
      <view class="config-info">
        <view class="config-item">
          <text class="label">模型名称：</text>
          <text class="value">{{ currentConfig.config.model_name }}</text>
        </view>
        <view class="config-item">
          <text class="label">服务提供商：</text>
          <text class="value">{{ currentConfig.config.provider }}</text>
        </view>
        <view class="config-item" v-if="currentConfig.config.base_url">
          <text class="label">API地址：</text>
          <text class="value">{{ currentConfig.config.base_url }}</text>
        </view>
        <view class="config-item">
          <text class="label">API密钥：</text>
          <text class="value">{{ currentConfig.config.has_api_key ? '已配置' : '未配置' }}</text>
        </view>
      </view>
    </view>

    <!-- 配置表单 -->
    <view class="config-form">
      <view class="form-section">
        <text class="section-title">模型配置</text>
        
        <!-- 模型选择 -->
        <view class="form-item model-select-item">
          <text class="label">模型名称 <text class="required">*</text></text>
          <picker 
            mode="selector" 
            :value="modelIndex" 
            :range="modelOptions" 
            range-key="label" 
            @change="onModelChange"
            class="picker"
          >
            <view class="picker-text">
              {{ config.model_name ? getModelDisplayName(config.model_name) : '请选择模型' }}
              <text class="picker-arrow">▼</text>
            </view>
          </picker>
        </view>

        <!-- API密钥 -->
        <view class="form-item">
          <text class="label">API密钥 <text class="required">*</text></text>
          <input 
            type="text"
            v-model="config.api_key"
            placeholder="请输入API密钥" 
            class="api-input-fix"
          />
        </view>

        <!-- API地址 -->
        <view class="form-item">
          <text class="label">API地址（可选）</text>
          <input 
            type="text" 
            v-model="config.base_url" 
            placeholder="留空使用默认地址" 
            class="api-input-fix"
          />
          <text class="help-text">留空将使用模型的默认API地址</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <button 
        class="btn btn-primary" 
        @click="saveGlobalConfig" 
        :disabled="!isFormValid || loading"
      >
        <text v-if="loading">保存中...</text>
        <text v-else>设置为全局默认</text>
      </button>
      
      <button 
        class="btn btn-secondary" 
        @click="testConnection" 
        :disabled="!isFormValid || testing"
      >
        <text v-if="testing">测试中...</text>
        <text v-else>测试连接</text>
      </button>
      
      <button 
        class="btn btn-danger" 
        @click="clearConfig" 
        v-if="currentConfig.has_global_config"
        :disabled="clearing"
      >
        <text v-if="clearing">清除中...</text>
        <text v-else>清除配置</text>
      </button>
    </view>

    <!-- 提示信息 -->
    <view class="tips">
      <view class="tip-item">
        <text class="tip-icon">💡</text>
        <text class="tip-text">设置全局配置后，所有PDF文档处理都将默认使用此配置</text>
      </view>
      <view class="tip-item">
        <text class="tip-icon">🔒</text>
        <text class="tip-text">API密钥将安全存储在服务器端，不会在前端暴露</text>
      </view>
      <view class="tip-item">
        <text class="tip-icon">⚡</text>
        <text class="tip-text">如果在特定操作中指定了其他模型，将优先使用指定的模型</text>
      </view>
    </view>
  </view>
</template>

<script>
import { 
  setGlobalConfigApi, 
  getGlobalConfigApi, 
  testGlobalConfigApi, 
  clearGlobalConfigApi 
} from '../../utils/api.js'

export default {
  name: 'GlobalConfig',
  data() {
    return {
      // 当前配置状态
      currentConfig: {
        has_global_config: false,
        config: {}
      },
      
      // 表单配置
      config: {
        model_name: '',
        api_key: '',
        base_url: ''
      },
      
      // 模型选项 - 根据后端支持的模型更新
      modelOptions: [
        {
          value: 'deepseek-chat',
          label: 'DeepSeek Chat',
          provider: 'deepseek',
          defaultBaseUrl: 'https://api.deepseek.com'
        },
        {
          value: 'deepseek-reasoner',
          label: 'DeepSeek Reasoner',
          provider: 'deepseek',
          defaultBaseUrl: 'https://api.deepseek.com'
        },
        {
          value: 'kimi-k2-0905-preview',
          label: 'Kimi K2 0905 Preview',
          provider: 'kimi',
          defaultBaseUrl: 'https://api.moonshot.cn/v1'
        },
        {
          value: 'kimi-k2-turbo-preview',
          label: 'Kimi K2 Turbo Preview',
          provider: 'kimi',
          defaultBaseUrl: 'https://api.moonshot.cn/v1'
        },
        {
          value: 'ep-20241206172706-5hqf9',
          label: '豆包 智能文档分析模型',
          provider: 'doubao',
          defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3'
        },
        {
          value: 'ep-20241127152712-ppt9z',
          label: '豆包 通用模型',
          provider: 'doubao',
          defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3'
        }
      ],
      
      // 状态
      loading: false,
      testing: false,
      clearing: false,
      modelIndex: 0
    }
  },
  
  computed: {
    isFormValid() {
      return this.config.model_name && this.config.api_key.trim()
    }
  },
  
  async onLoad() {
    await this.loadCurrentConfig()
  },
  
  methods: {
    // 加载当前配置
    async loadCurrentConfig() {
      try {
        // 使用兼容的加载提示
        if (typeof uni !== 'undefined' && uni.showLoading) {
          uni.showLoading({ title: '加载配置中...' })
        }
        
        const response = await getGlobalConfigApi()
        this.currentConfig = response
        
        // 如果有配置，填充表单
        if (response.has_global_config && response.config) {
          this.config.model_name = response.config.model_name || ''
          this.config.base_url = response.config.base_url || ''
          // API密钥不从服务器获取，保持为空
          this.config.api_key = ''
          
          // 设置模型选择器的索引
          this.updateModelIndex()
        }
        
      } catch (error) {
        console.error('加载配置失败:', error)
        // 设置默认空配置，避免undefined错误
        this.currentConfig = {
          has_global_config: false,
          config: {}
        }
        
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '加载配置失败：' + (error.message || '未知错误'),
            icon: 'none',
            duration: 3000
          })
        }
      } finally {
        // 安全地隐藏加载提示
        if (typeof uni !== 'undefined' && uni.hideLoading) {
          uni.hideLoading()
        }
      }
    },
    
    // 更新模型选择器索引
    updateModelIndex() {
      const index = this.modelOptions.findIndex(option => option.value === this.config.model_name)
      this.modelIndex = index >= 0 ? index : 0
    },
    
    // 模型选择改变
    onModelChange(e) {
      const index = e.detail.value
      this.modelIndex = index
      const selectedModel = this.modelOptions[index]
      
      this.config.model_name = selectedModel.value
      
      // 如果没有设置base_url，使用默认值
      if (!this.config.base_url) {
        this.config.base_url = selectedModel.defaultBaseUrl
      }
    },
    
    // 获取模型显示名称
    getModelDisplayName(modelName) {
      const model = this.modelOptions.find(option => option.value === modelName)
      return model ? model.label : modelName
    },
    
    // 保存全局配置
    async saveGlobalConfig() {
      if (!this.isFormValid) {
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '请填写所有必填项',
            icon: 'none'
          })
        }
        return
      }
      
      try {
        this.loading = true
        
        await setGlobalConfigApi(this.config)
        
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '全局配置设置成功！',
            icon: 'success',
            duration: 2000
          })
        }
        
        // 重新加载配置
        await this.loadCurrentConfig()
        
      } catch (error) {
        console.error('保存配置失败:', error)
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '保存失败：' + (error.message || '未知错误'),
            icon: 'none',
            duration: 3000
          })
        }
      } finally {
        this.loading = false
      }
    },
    
    // 测试连接
    async testConnection() {
      if (!this.isFormValid) {
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '请先填写完整配置',
            icon: 'none'
          })
        }
        return
      }
      
      try {
        this.testing = true
        
        // 先保存配置，然后测试
        await setGlobalConfigApi(this.config)
        const response = await testGlobalConfigApi()
        
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '连接测试成功！',
            icon: 'success',
            duration: 2000
          })
        }
        
        // 重新加载配置
        await this.loadCurrentConfig()
        
      } catch (error) {
        console.error('连接测试失败:', error)
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '连接测试失败：' + (error.message || '未知错误'),
            icon: 'none',
            duration: 3000
          })
        }
      } finally {
        this.testing = false
      }
    },
    
    // 清除配置
    async clearConfig() {
      try {
        // 安全检查uni API和确认对话框
        if (typeof uni !== 'undefined' && uni.showModal) {
          const res = await new Promise((resolve) => {
            uni.showModal({
              title: '确认清除',
              content: '确定要清除全局配置吗？清除后需要重新设置。',
              success: resolve
            })
          })
          
          if (!res.confirm) return
        }
        
        this.clearing = true
        
        await clearGlobalConfigApi()
        
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '配置已清除',
            icon: 'success'
          })
        }
        
        // 重置表单和状态
        this.config = {
          model_name: '',
          api_key: '',
          base_url: ''
        }
        this.modelIndex = 0
        
        // 重新加载配置
        await this.loadCurrentConfig()
        
      } catch (error) {
        console.error('清除配置失败:', error)
        if (typeof uni !== 'undefined' && uni.showToast) {
          uni.showToast({
            title: '清除失败：' + (error.message || '未知错误'),
            icon: 'none',
            duration: 3000
          })
        }
      } finally {
        this.clearing = false
      }
    }
  }
}
</script>

<style scoped>
.global-config-page {
  padding: 20rpx;
  background-color: #F5F7FA;
  min-height: 100vh;
}

.header {
  background: linear-gradient(135deg, #1B2A41 0%, #2C3E50 100%);
  padding: 40rpx 30rpx;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  color: white;
}

.title {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.title .icon {
  font-size: 48rpx;
  margin-right: 20rpx;
}

.title .text {
  font-size: 36rpx;
  font-weight: bold;
}

.subtitle {
  font-size: 28rpx;
  opacity: 0.8;
  line-height: 1.4;
}

.config-status {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.status-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.status-icon {
  font-size: 32rpx;
  margin-right: 15rpx;
}

.status-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #2E7D32;
}

.config-info {
  padding-left: 45rpx;
}

.config-item {
  display: flex;
  margin-bottom: 15rpx;
  font-size: 28rpx;
}

.config-item .label {
  color: #666;
  min-width: 180rpx;
}

.config-item .value {
  color: #333;
  font-weight: 500;
}

.config-form {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #1B2A41;
  margin-bottom: 30rpx;
  padding-bottom: 15rpx;
  border-bottom: 2rpx solid #E5E5E5;
  position: relative;
  overflow: hidden;
}

.section-title::before,
.section-title::after {
  display: none !important;
}

.form-section {
  position: relative;
  overflow: hidden;
}

.form-section::before,
.form-section::after {
  display: none !important;
}

/* 清理所有可能的伪元素 */
.config-form *::before,
.config-form *::after {
  display: none !important;
}

.config-form {
  position: relative;
  background: white !important;
}

/* 针对模型选择区域的特殊修复 */
.model-select-item {
  position: relative !important;
  background: transparent !important;
  overflow: visible !important;
}

.model-select-item::before,
.model-select-item::after {
  display: none !important;
  content: none !important;
}

.model-select-item * {
  position: relative !important;
  background: transparent !important;
}

.model-select-item *::before,
.model-select-item *::after {
  display: none !important;
  content: none !important;
}

.form-item {
  margin-bottom: 40rpx;
  position: relative;
  z-index: 1;
}

.form-item .label {
  display: block;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 15rpx;
}

.required {
  color: #E53E3E;
}

.picker {
  width: 100%;
  position: relative !important;
  background: transparent !important;
  overflow: visible !important;
}

.picker::before,
.picker::after {
  display: none !important;
  content: none !important;
}

.picker * {
  position: relative !important;
  background: transparent !important;
}

.picker *::before,
.picker *::after {
  display: none !important;
  content: none !important;
}

.picker-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 25rpx;
  border: 2rpx solid #E2E8F0;
  border-radius: 12rpx;
  background: white;
  font-size: 30rpx;
  color: #333;
}

.picker-arrow {
  color: #999;
  font-size: 24rpx;
}

.input {
  width: 100%;
  padding: 20rpx 25rpx;
  border: 2rpx solid #E2E8F0;
  border-radius: 12rpx;
  font-size: 30rpx;
  background: white;
  box-sizing: border-box;
  outline: none;
}

.input:focus {
  border-color: #C9A86B;
}

.api-input-fix {
  width: 100% !important;
  height: 80rpx !important;
  padding: 20rpx 25rpx !important;
  border: 3rpx solid #007AFF !important;
  border-radius: 12rpx !important;
  font-size: 32rpx !important;
  background: #FFFFFF !important;
  color: #333333 !important;
  box-sizing: border-box !important;
  outline: none !important;
  z-index: 999 !important;
  position: relative !important;
  display: block !important;
  line-height: normal !important;
  font-family: Arial, sans-serif !important;
}

.api-input-fix:focus {
  border-color: #FF3B30 !important;
  background: #FFFACD !important;
}

.help-text {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  display: block;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-bottom: 30rpx;
}

.btn {
  padding: 24rpx 40rpx;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #C9A86B 0%, #B8975A 100%);
  color: white;
}

.btn-primary:not(:disabled):active {
  background: linear-gradient(135deg, #B8975A 0%, #A78649 100%);
}

.btn-secondary {
  background: #F7FAFC;
  color: #4A5568;
  border: 2rpx solid #E2E8F0;
}

.btn-secondary:not(:disabled):active {
  background: #EDF2F7;
}

.btn-danger {
  background: #FED7D7;
  color: #C53030;
  border: 2rpx solid #FEB2B2;
}

.btn-danger:not(:disabled):active {
  background: #FBB6B9;
}

.tips {
  background: white;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 25rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
  margin-top: 5rpx;
}

.tip-text {
  font-size: 28rpx;
  color: #4A5568;
  line-height: 1.5;
  flex: 1;
}

/* 响应式设计 */
@media screen and (min-width: 768px) {
  .global-config-page {
    max-width: 800rpx;
    margin: 0 auto;
  }
  
  .action-buttons {
    flex-direction: row;
    justify-content: space-between;
  }
  
  .btn {
    flex: 1;
    margin: 0 10rpx;
  }
}
</style>
