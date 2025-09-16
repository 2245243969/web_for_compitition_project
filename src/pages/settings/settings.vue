<template>
  <view class="web-layout">
    <!-- 左侧导航栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <view class="web-content">
      <view class="content-wrapper">
        <!-- 页面标题 -->
        <view class="page-header fade-in-up">
          <text class="page-title">用户设置</text>
          <text class="page-subtitle">管理您的个人信息、模型配置和API设置</text>
        </view>
        
        <view class="settings-container">
          <!-- 个人信息设置 -->
          <view class="settings-section">
            <view class="section-header">
              <text class="section-title">👤 个人信息</text>
            </view>
            <view class="settings-card">
          <!-- 基本信息 -->
          <view class="info-section">
            <view class="form-group">
              <text class="form-label">用户名</text>
              <input 
                class="form-input"
                type="text"
                placeholder="请输入用户名"
                v-model="userProfile.username"
                :disabled="!isEditingProfile"
              />
            </view>

            <view class="form-group">
              <text class="form-label">邮箱地址</text>
              <input 
                class="form-input"
                type="email"
                placeholder="请输入邮箱地址"
                v-model="userProfile.email"
                :disabled="!isEditingProfile"
              />
            </view>

            <view class="form-actions">
              <button 
                v-if="!isEditingProfile"
                class="action-btn primary"
                @click="startEditProfile"
              >
                <text class="btn-text">编辑信息</text>
              </button>
              <template v-else>
                <button 
                  class="action-btn success"
                  @click="saveProfile"
                  :disabled="isSaving"
                >
                  <text class="btn-text">{{ isSaving ? '保存中...' : '保存' }}</text>
                </button>
                <button 
                  class="action-btn outline"
                  @click="cancelEditProfile"
                >
                  <text class="btn-text">取消</text>
                </button>
              </template>
            </view>

            <!-- 快速更新按钮 -->
            <view v-if="!isEditingProfile" class="quick-actions">
              <text class="quick-title">快速更新：</text>
              <view class="quick-buttons">
                <button class="quick-btn" @click="quickUpdateUsername">
                  <text class="quick-icon">👤</text>
                  <text class="quick-text">更新用户名</text>
                </button>
                <button class="quick-btn" @click="quickUpdateEmail">
                  <text class="quick-icon">📧</text>
                  <text class="quick-text">更新邮箱</text>
                </button>
              </view>
            </view>
          </view>
            </view>
          </view>

          <!-- 密码修改 -->
          <view class="settings-section">
            <view class="section-header">
              <text class="section-title">🔐 密码管理</text>
            </view>
            <view class="settings-card">
              <view class="password-section">
                <view class="form-group">
                  <text class="form-label">当前密码</text>
                  <view class="password-input-wrapper">
                    <input 
                      class="form-input"
                      :type="showCurrentPassword ? 'text' : 'password'"
                      placeholder="请输入当前密码"
                      v-model="passwordForm.currentPassword"
                    />
                    <text 
                      class="password-toggle" 
                      @click="toggleCurrentPasswordVisibility"
                    >{{ showCurrentPassword ? '👁️' : '👁️‍🗨️' }}</text>
                  </view>
                </view>

                <view class="form-group">
                  <text class="form-label">新密码</text>
                  <view class="password-input-wrapper">
                    <input 
                      class="form-input"
                      :type="showNewPassword ? 'text' : 'password'"
                      placeholder="请输入新密码"
                      v-model="passwordForm.newPassword"
                    />
                    <text 
                      class="password-toggle" 
                      @click="toggleNewPasswordVisibility"
                    >{{ showNewPassword ? '👁️' : '👁️‍🗨️' }}</text>
                  </view>
                </view>

                <view class="form-group">
                  <text class="form-label">确认新密码</text>
                  <view class="password-input-wrapper">
                    <input 
                      class="form-input"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      placeholder="请再次输入新密码"
                      v-model="passwordForm.confirmPassword"
                    />
                    <text 
                      class="password-toggle" 
                      @click="toggleConfirmPasswordVisibility"
                    >{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</text>
                  </view>
                </view>

                <view class="password-actions">
                  <button 
                    class="action-btn primary"
                    @click="handleChangePassword"
                    :disabled="!isPasswordFormValid || isChangingPassword"
                  >
                    <text class="btn-text">{{ isChangingPassword ? '修改中...' : '修改密码' }}</text>
                  </button>
                </view>
              </view>
            </view>
          </view>

          <!-- 全局模型配置 -->
          <view class="settings-section">
            <view class="section-header">
              <text class="section-title">🌐 全局模型配置</text>
            </view>
            <view class="settings-card">
              <view class="global-config-section">
                <view class="config-description">
                  <text class="description-title">统一设置默认模型</text>
                  <text class="description-text">设置一次后，所有PDF处理都会默认使用此配置，无需重复配置</text>
                </view>
                

                <!-- 模型配置表单 -->
                <view class="model-selection">
                  <view class="form-group">
                    <text class="form-label">AI模型名称</text>
                    <view class="model-input-wrapper">
                      <input 
                        class="form-input"
                        type="text"
                        placeholder="请输入模型名称，如：deepseek-chat, deepseek-reasoner"
                        v-model="globalModelConfig.modelName"
                      />
                    </view>
                    <text class="form-help">输入您要使用的AI模型的准确名称，这将在所有提取任务中使用</text>
                  </view>

                  <!-- 常用模型快速选择 -->
                  <view class="model-presets">
                    <text class="presets-title">常用模型：</text>
                    <view class="preset-buttons">
                      <button 
                        class="preset-btn"
                        v-for="preset in modelPresets"
                        :key="preset.name"
                        @click="selectGlobalPresetModel(preset.name)"
                        :class="{ 'active': globalModelConfig.modelName === preset.name }"
                      >
                        <text class="preset-name">{{ preset.label }}</text>
                        <text class="preset-model">{{ preset.name }}</text>
                      </button>
                    </view>
                  </view>

                  <!-- API密钥配置 -->
                  <view class="form-group">
                    <view class="label-with-help">
                      <text class="form-label">API密钥</text>
                      <text class="help-text" @click="showApiHelp">❓</text>
                    </view>
                    <view class="api-input-wrapper">
                      <input 
                        class="form-input api-input"
                        :type="showGlobalApiKey ? 'text' : 'password'"
                        placeholder="请输入您的API密钥"
                        v-model="globalModelConfig.apiKey"
                      />
                      <text 
                        class="password-toggle" 
                        @click="toggleGlobalApiKeyVisibility"
                      >{{ showGlobalApiKey ? '👁️' : '👁️‍🗨️' }}</text>
                    </view>
                  </view>

                  <!-- API Base URL -->
                  <view class="form-group">
                    <text class="form-label">API Base URL（可选）</text>
                    <input 
                      class="form-input"
                      type="text"
                      placeholder="留空使用模型默认地址"
                      v-model="globalModelConfig.baseUrl"
                    />
                    <text class="form-help">留空将使用模型的默认API地址</text>
                  </view>
                </view>

                <!-- 操作按钮 -->
                <view class="config-actions">
                  <button 
                    class="config-btn primary" 
                    @click="saveGlobalConfig"
                    :disabled="!isGlobalConfigValid || isSavingGlobal"
                  >
                    <text class="config-icon">⚙️</text>
                    <text class="config-text">{{ isSavingGlobal ? '保存中...' : '保存全局配置' }}</text>
                  </button>
                  <button 
                    class="config-btn outline" 
                    @click="testGlobalConfig"
                    :disabled="!isGlobalConfigValid || isTestingGlobal"
                  >
                    <text class="config-icon">🔗</text>
                    <text class="config-text">{{ isTestingGlobal ? '测试中...' : '测试连接' }}</text>
                  </button>
                  <button 
                    v-if="currentGlobalConfig.has_global_config"
                    class="config-btn danger" 
                    @click="clearGlobalConfig"
                    :disabled="isClearingGlobal"
                  >
                    <text class="config-icon">🗑️</text>
                    <text class="config-text">{{ isClearingGlobal ? '清除中...' : '清除配置' }}</text>
                  </button>
                </view>
                
                <!-- 配置提示 -->
                <view class="config-tips">
                  <view class="tip-item">
                    <text class="tip-icon">💡</text>
                    <text class="tip-text">全局配置会应用到所有PDF提取任务</text>
                  </view>
                  <view class="tip-item">
                    <text class="tip-icon">🔒</text>
                    <text class="tip-text">API密钥安全存储在服务器端</text>
                  </view>
                  <view class="tip-item">
                    <text class="tip-icon">⚡</text>
                    <text class="tip-text">设置后无需在每次提取时重复配置</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 旧版API设置提示 -->
          <view class="settings-section">
            <view class="section-header">
              <text class="section-title">📋 配置说明</text>
            </view>
            <view class="settings-card">
              <view class="info-section">
                <view class="info-card upgrade-notice">
                  <view class="info-header">
                    <text class="info-icon">🚀</text>
                    <text class="info-title">配置已统一</text>
                  </view>
                  <view class="info-content">
                    <text class="info-text">现在所有的模型和API配置都已整合到上方的"全局模型配置"中。</text>
                    <text class="info-text">设置一次后，所有的文档处理任务都会自动使用该配置，无需重复设置。</text>
                  </view>
                  <view class="info-actions">
                    <text class="info-action-text">请在上方"全局模型配置"中完成所有设置</text>
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
import { getCurrentUser, updateUserInfo, checkAuthAndRedirect } from '../../utils/auth.js'
import { 
  getUserProfileApi, 
  updateUserProfileApi, 
  changePasswordApi,
  getGlobalConfigApi,
  setGlobalConfigApi,
  testGlobalConfigApi,
  clearGlobalConfigApi
} from '../../utils/api.js'

export default {
  components: {
    Sidebar
  },
  data() {
    return {
      // 用户信息
      userProfile: {
        username: '',
        email: ''
      },
      originalProfile: {},
      isEditingProfile: false,
      isSaving: false,

      // 密码修改
      passwordForm: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      isChangingPassword: false,
      
      // 全局模型配置
      globalModelConfig: {
        modelName: '',
        apiKey: '',
        baseUrl: ''
      },
      // 当前全局配置状态
      currentGlobalConfig: {
        has_global_config: false,
        config: {}
      },
      // 根据后端支持的模型更新预设选项
      modelPresets: [
        { name: 'deepseek-chat', label: 'DeepSeek Chat' },
        { name: 'deepseek-reasoner', label: 'DeepSeek Reasoner' },
        { name: 'kimi-k2-0905-preview', label: 'Kimi K2 0905 Preview' },
        { name: 'kimi-k2-turbo-preview', label: 'Kimi K2 Turbo Preview' },
        { name: 'ep-20241206172706-5hqf9', label: '豆包 智能文档分析模型' },
        { name: 'ep-20241127152712-ppt9z', label: '豆包 通用模型' }
      ],
      
      // 全局配置相关状态
      showGlobalApiKey: false,
      isSavingGlobal: false,
      isTestingGlobal: false,
      isClearingGlobal: false,
      
      // 保留一些兼容性数据（可能会有其他地方引用）
      apiSettings: {
        apiKey: '',
        baseUrl: '',
        timeout: 60
      },
      showApiKey: false,
      isTesting: false,
      testResult: null
    }
  },
  computed: {
    // 验证全局配置是否完整
    isGlobalConfigValid() {
      return this.globalModelConfig && 
             this.globalModelConfig.modelName && 
             this.globalModelConfig.modelName.trim() && 
             this.globalModelConfig.apiKey && 
             this.globalModelConfig.apiKey.trim()
    },
    
    // 验证密码表单是否完整
    isPasswordFormValid() {
      return this.passwordForm.currentPassword && 
             this.passwordForm.newPassword && 
             this.passwordForm.confirmPassword &&
             this.passwordForm.newPassword === this.passwordForm.confirmPassword &&
             this.passwordForm.newPassword.length >= 6
    },
  },
  methods: {
    
    // 个人信息编辑
    startEditProfile() {
      this.isEditingProfile = true
      this.originalProfile = { ...this.userProfile }
    },
    
    cancelEditProfile() {
      this.isEditingProfile = false
      this.userProfile = { ...this.originalProfile }
    },
    
    async saveProfile() {
      this.isSaving = true
      try {
        // 验证信息
        if (!this.userProfile.username.trim()) {
          throw new Error('用户名不能为空')
        }
        if (!this.userProfile.email.trim()) {
          throw new Error('邮箱不能为空')
        }
        
        // 使用简化的用户信息更新接口
        await this.updateUserProfile({
          username: this.userProfile.username,
          email: this.userProfile.email
        })
        
        uni.showToast({
          title: '信息保存成功',
          icon: 'success'
        })
        
        this.isEditingProfile = false
      } catch (error) {
        console.error('保存用户信息失败:', error)
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        })
      } finally {
        this.isSaving = false
      }
    },

    // ==========================================
    // 简洁的用户信息更新API接口
    // ==========================================

    /**
     * 更新用户基本信息 (用户名和邮箱)
     * 接口：PATCH /api/users/profile (根据后端实际支持的方法)
     */
    async updateUserProfile(profileData) {
      try {
        console.log('📝 开始更新用户信息:', profileData)

        // 使用现有的API函数，但只传递用户名和邮箱
        const updateData = {
          firstName: profileData.username,
          lastName: '',
          email: profileData.email,
          phone: '',
          company: '',
          settings: {},
          bio: ''
        }

        const response = await updateUserProfileApi(updateData)

        console.log('📥 更新用户信息API响应:', response)

        if (response && response.user) {
          // 更新本地用户信息
          const updatedUser = {
            ...this.userProfile,
            username: profileData.username,
            email: profileData.email
          }
          this.userProfile = updatedUser
          updateUserInfo(updatedUser)
          
          console.log('✅ 用户信息更新成功')
          return response
        }

        throw new Error('更新用户信息失败')
      } catch (error) {
        console.error('❌ 更新用户信息失败:', error)
        throw error
      }
    },


    /**
     * 修改密码
     * 接口：PUT /api/v1/users/password
     */
    async changeUserPassword(currentPassword, newPassword, confirmPassword) {
      try {
        console.log('🔐 开始修改密码')

        const passwordData = {
          currentPassword: currentPassword,
          newPassword: newPassword,
          confirmPassword: confirmPassword
        }

        const result = await changePasswordApi(passwordData)
        
        console.log('🔄 密码修改成功，为了安全需要重新登录')
        
        // 密码修改成功后，无论后端是否要求，都强制重新登录
        // 完全清除本地认证信息
        uni.removeStorageSync('token')
        uni.removeStorageSync('refreshToken')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('isLoggedIn')
        uni.removeStorageSync('loginTime')
        
        uni.showModal({
          title: '密码修改成功',
          content: '为了安全，请重新登录',
          showCancel: false,
          success: () => {
            uni.reLaunch({
              url: '/pages/login/login'
            })
          }
        })
        
        console.log('✅ 密码修改成功')
        return result
      } catch (error) {
        console.error('❌ 密码修改失败:', error)
        throw error
      }
    },

    // ==========================================
    // 便捷函数
    // ==========================================

    /**
     * 只更新用户名
     */
    async updateUsername(newUsername) {
      return await this.updateUserProfile({
        username: newUsername,
        email: this.userProfile.email
      })
    },

    /**
     * 只更新邮箱
     */
    async updateEmail(newEmail) {
      return await this.updateUserProfile({
        username: this.userProfile.username,
        email: newEmail
      })
    },

    /**
     * 同时更新用户名和邮箱
     */
    async updateUsernameAndEmail(username, email) {
      return await this.updateUserProfile({
        username: username,
        email: email
      })
    },

    // ==========================================
    // 快速更新功能
    // ==========================================

    async quickUpdateUsername() {
      try {
        const res = await new Promise((resolve) => {
          uni.showModal({
            title: '更新用户名',
            placeholderText: '请输入新的用户名',
            editable: true,
            success: resolve
          })
        })
        
        if (res.confirm && res.content && res.content.trim()) {
          await this.updateUsername(res.content.trim())
          uni.showToast({
            title: '用户名更新成功',
            icon: 'success'
          })
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        })
      }
    },

    async quickUpdateEmail() {
      try {
        const res = await new Promise((resolve) => {
          uni.showModal({
            title: '更新邮箱',
            placeholderText: '请输入新的邮箱地址',
            editable: true,
            success: resolve
          })
        })
        
        if (res.confirm && res.content && res.content.trim()) {
          // 简单的邮箱验证
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(res.content.trim())) {
            throw new Error('请输入有效的邮箱地址')
          }
          
          await this.updateEmail(res.content.trim())
          uni.showToast({
            title: '邮箱更新成功',
            icon: 'success'
          })
        }
      } catch (error) {
        uni.showToast({
          title: error.message || '更新失败',
          icon: 'none'
        })
      }
    },

    // ==========================================
    // 密码相关方法
    // ==========================================

    toggleCurrentPasswordVisibility() {
      this.showCurrentPassword = !this.showCurrentPassword
    },

    toggleNewPasswordVisibility() {
      this.showNewPassword = !this.showNewPassword
    },

    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword = !this.showConfirmPassword
    },

    async handleChangePassword() {
      if (!this.isPasswordFormValid) {
        if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
          uni.showToast({
            title: '两次输入的密码不一致',
            icon: 'none'
          })
        } else if (this.passwordForm.newPassword.length < 6) {
          uni.showToast({
            title: '密码长度至少6位',
            icon: 'none'
          })
        } else {
          uni.showToast({
            title: '请填写完整信息',
            icon: 'none'
          })
        }
        return
      }

      this.isChangingPassword = true
      try {
        await this.changeUserPassword(
          this.passwordForm.currentPassword,
          this.passwordForm.newPassword,
          this.passwordForm.confirmPassword
        )
      } catch (error) {
        uni.showToast({
          title: error.message || '密码修改失败',
          icon: 'none'
        })
      } finally {
        this.isChangingPassword = false
        // 清空密码表单
        this.passwordForm = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      }
    },
    
    // 全局模型配置相关方法
    selectGlobalPresetModel(modelName) {
      // 确保globalModelConfig对象存在
      if (!this.globalModelConfig) {
        this.globalModelConfig = {
          modelName: '',
          apiKey: '',
          baseUrl: ''
        }
      }
      
      this.globalModelConfig.modelName = modelName
      
      // 自动设置对应的默认base URL
      const preset = this.modelPresets.find(p => p.name === modelName)
      if (preset && !this.globalModelConfig.baseUrl) {
        // 根据模型设置默认base URL
        if (modelName.startsWith('deepseek-')) {
          this.globalModelConfig.baseUrl = 'https://api.deepseek.com'
        } else if (modelName.startsWith('kimi-')) {
          this.globalModelConfig.baseUrl = 'https://api.moonshot.cn/v1'
        } else if (modelName.startsWith('ep-')) {
          this.globalModelConfig.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3'
        }
      }
    },
    
    toggleGlobalApiKeyVisibility() {
      this.showGlobalApiKey = !this.showGlobalApiKey
    },
    
    async saveGlobalConfig() {
      if (!this.isGlobalConfigValid) {
        uni.showToast({
          title: '请填写完整的配置信息',
          icon: 'none'
        })
        return
      }
      
      try {
        this.isSavingGlobal = true
        
        const config = {
          model_name: this.globalModelConfig.modelName,
          api_key: this.globalModelConfig.apiKey,
          base_url: this.globalModelConfig.baseUrl || ''
        }
        
        // 调用全局配置API
        await setGlobalConfigApi(config)
        
        uni.showToast({
          title: '全局配置保存成功',
          icon: 'success'
        })
        
        // 重新加载当前配置状态
        await this.loadGlobalConfig()
        
      } catch (error) {
        console.error('保存全局配置失败:', error)
        uni.showToast({
          title: error.message || '保存失败',
          icon: 'none'
        })
      } finally {
        this.isSavingGlobal = false
      }
    },
    
    async testGlobalConfig() {
      if (!this.isGlobalConfigValid) {
        uni.showToast({
          title: '请先填写完整配置',
          icon: 'none'
        })
        return
      }
      
      try {
        this.isTestingGlobal = true
        
        // 先保存配置，然后测试
        const config = {
          model_name: this.globalModelConfig.modelName,
          api_key: this.globalModelConfig.apiKey,
          base_url: this.globalModelConfig.baseUrl || ''
        }
        
        await setGlobalConfigApi(config)
        await testGlobalConfigApi()
        
        uni.showToast({
          title: '连接测试成功',
          icon: 'success'
        })
        
        // 重新加载配置状态
        await this.loadGlobalConfig()
        
      } catch (error) {
        console.error('测试连接失败:', error)
        uni.showToast({
          title: error.message || '连接测试失败',
          icon: 'none'
        })
      } finally {
        this.isTestingGlobal = false
      }
    },
    
    async clearGlobalConfig() {
      try {
        const res = await new Promise((resolve) => {
          uni.showModal({
            title: '确认清除',
            content: '确定要清除全局配置吗？清除后需要重新设置。',
            success: resolve
          })
        })
        
        if (!res.confirm) return
        
        this.isClearingGlobal = true
        
        await clearGlobalConfigApi()
        
        // 清空表单数据
        this.globalModelConfig = {
          modelName: '',
          apiKey: '',
          baseUrl: ''
        }
        
        uni.showToast({
          title: '配置已清除',
          icon: 'success'
        })
        
        // 重新加载配置状态
        await this.loadGlobalConfig()
        
      } catch (error) {
        console.error('清除配置失败:', error)
        uni.showToast({
          title: error.message || '清除失败',
          icon: 'none'
        })
      } finally {
        this.isClearingGlobal = false
      }
    },
    
    // 保留的兼容性方法
    
    showApiHelp() {
      uni.showModal({
        title: 'API密钥说明',
        content: '请从您的AI服务提供商获取API密钥：\n• OpenAI: platform.openai.com\n• Claude: console.anthropic.com\n• Gemini: ai.google.dev\n\n密钥将安全存储在本地',
        showCancel: false,
        confirmText: '知道了'
      })
    },
    
    // 加载全局配置状态
    async loadGlobalConfig() {
      try {
        // 确保globalModelConfig对象已初始化
        if (!this.globalModelConfig) {
          this.globalModelConfig = {
            modelName: '',
            apiKey: '',
            baseUrl: ''
          }
        }
        
        const response = await getGlobalConfigApi()
        console.log('🔍 全局配置API响应:', response)
        
        // 安全地处理响应数据
        if (response) {
          this.currentGlobalConfig = {
            has_global_config: response.has_global_config || false,
            config: response.config || {}
          }
          
          // 如果有全局配置，填充表单（但不填充API密钥）
          if (response.has_global_config && response.config) {
            this.globalModelConfig.modelName = response.config.model_name || ''
            this.globalModelConfig.baseUrl = response.config.base_url || ''
            // 不从服务器获取API密钥，保持为空
            this.globalModelConfig.apiKey = ''
          }
        } else {
          // 如果响应为空，设置默认值
          this.currentGlobalConfig = {
            has_global_config: false,
            config: {}
          }
        }
        
        console.log('✅ 全局配置加载完成:', this.currentGlobalConfig)
        
      } catch (error) {
        console.error('加载全局配置失败:', error)
        // 确保对象结构完整
        this.currentGlobalConfig = {
          has_global_config: false,
          config: {}
        }
        if (!this.globalModelConfig) {
          this.globalModelConfig = {
            modelName: '',
            apiKey: '',
            baseUrl: ''
          }
        }
      }
    },
    
    // 加载数据
    async loadUserProfile() {
      try {
        // 先从本地获取
        const currentUser = getCurrentUser()
        if (currentUser) {
          this.userProfile = {
            username: currentUser.username || '',
            email: currentUser.email || ''
          }
        }
        
        // 尝试从服务器获取最新信息
        try {
          const serverProfile = await getUserProfileApi()
          if (serverProfile?.user) {
            this.userProfile = {
              username: serverProfile.user.username || '',
              email: serverProfile.user.email || ''
            }
            // 更新本地缓存
            updateUserInfo(this.userProfile)
          }
        } catch (error) {
          console.warn('从服务器获取用户信息失败，使用本地缓存:', error)
        }
        
      } catch (error) {
        console.error('加载用户信息失败:', error)
      }
    },
    
    async loadSettings() {
      try {
        // 保持兼容性，加载旧的本地设置（主要用于API设置）
        const savedApiSettings = uni.getStorageSync('apiSettings')
        if (savedApiSettings) {
          this.apiSettings = { ...this.apiSettings, ...savedApiSettings }
        }
        
        // 注意：模型配置现在通过 loadGlobalConfig() 加载，不再在这里处理
        
      } catch (error) {
        console.error('加载设置失败:', error)
      }
    }
  },
  
  onLoad() {
    // 检查用户是否已登录，未登录则跳转到登录页
    if (!checkAuthAndRedirect()) {
      return
    }
    this.loadUserProfile()
    this.loadSettings()
    this.loadGlobalConfig()
  }
}
</script>

<style scoped>
/* 强制覆盖所有文字颜色 */
.settings-container,
.settings-container * {
  --color-primary: #1B2A41;
  --color-secondary: #666666;
  --color-accent: #007AFF;
  --color-success: #28a745;
  --color-title: #333333;
  --color-text: #555555;
}

/* 强制设置所有文本元素的颜色 */
.settings-container text,
.settings-container .form-label,
.settings-container .quick-title,
.settings-container .quick-text,
.settings-container .info-title,
.settings-container .description-text,
.settings-container .presets-title,
.settings-container .preset-name,
.settings-container .preset-model,
.settings-container .form-help,
.settings-container .info-text,
.settings-container .config-detail,
.settings-container .tip-text,
.settings-container .help-text {
  color: #333333 !important;
}

/* 特殊情况的文字颜色 */
.settings-container .help-text,
.settings-container .info-action-text {
  color: #007AFF !important;
}

.settings-container .preset-model,
.settings-container .form-help,
.settings-container .description-text {
  color: #666666 !important;
}

.settings-container .info-text,
.settings-container .config-detail,
.settings-container .tip-text {
  color: #555555 !important;
}

/* 按钮中的文字应该是白色 */
.settings-container .action-btn.primary .btn-text,
.settings-container .action-btn.success .btn-text,
.settings-container .config-btn.primary .btn-text,
.settings-container .test-btn .btn-text {
  color: #ffffff !important;
}

/* 线框按钮的文字颜色 */
.settings-container .action-btn.outline .btn-text,
.settings-container .config-btn.outline .btn-text {
  color: #1B2A41 !important;
}

.settings-container {
  padding: 20rpx;
}

.settings-section {
  margin-bottom: 60rpx;
}

.section-header {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.settings-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}


/* 表单样式 */
.form-group {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #333333 !important;
  margin-bottom: 15rpx;
}

.label-with-help {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 15rpx;
}

.help-text {
  font-size: 24rpx;
  color: #007AFF !important;
  cursor: pointer;
}

.form-input {
  width: 100%;
  height: 80rpx;
  padding: 0 25rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  font-size: 28rpx;
  background: #fff;
  transition: border-color 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
}

/* 模型选择 */
.form-help {
  display: block;
  font-size: 24rpx;
  color: #666666 !important;
  margin-top: 10rpx;
  line-height: 1.4;
}

.model-presets {
  margin: 30rpx 0;
}

.presets-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333333 !important;
  margin-bottom: 20rpx;
}

.preset-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200rpx, 1fr));
  gap: 15rpx;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
  background: #f8f9fa;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.preset-btn:hover {
  border-color: var(--color-primary);
  background: rgba(27, 42, 65, 0.05);
}

.preset-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.preset-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333 !important;
  margin-bottom: 8rpx;
}

.preset-btn.active .preset-name {
  color: white;
}

.preset-model {
  font-size: 22rpx;
  color: #666666 !important;
  font-family: 'Courier New', monospace;
}

.preset-btn.active .preset-model {
  color: rgba(255, 255, 255, 0.9);
}

.model-info-card {
  background: #f0f7ff;
  border: 1rpx solid #b3d9ff;
  border-radius: 10rpx;
  padding: 25rpx;
  margin-top: 20rpx;
}

.info-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1B2A41 !important;
  margin-bottom: 15rpx;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.info-text {
  font-size: 24rpx;
  color: #555555 !important;
  line-height: 1.4;
}

/* API设置 */
.api-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.api-input {
  padding-right: 80rpx;
}

.password-toggle {
  position: absolute;
  right: 25rpx;
  font-size: 32rpx;
  cursor: pointer;
}

.timeout-slider {
  margin: 20rpx 0;
}

.api-test {
  margin: 30rpx 0;
}

.test-btn {
  padding: 20rpx 40rpx;
  background: var(--color-success);
  color: white;
  border: none;
  border-radius: 10rpx;
  font-size: 28rpx;
  cursor: pointer;
  margin-bottom: 20rpx;
}

.test-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.test-result {
  padding: 15rpx;
  border-radius: 8rpx;
  font-size: 26rpx;
}

.test-result.success {
  background: #d4edda;
  color: #155724;
}

.test-result.error {
  background: #f8d7da;
  color: #721c24;
}

/* 操作按钮 */
.form-actions {
  display: flex;
  gap: 20rpx;
  justify-content: flex-end;
  margin-top: 40rpx;
}

.action-btn {
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  border: 2rpx solid;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.action-btn.success {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.action-btn.outline {
  background: transparent;
  border-color: #666666;
  color: #666666 !important;
}

.action-btn:hover {
  transform: translateY(-2rpx);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.btn-text {
  color: inherit;
}

/* 全局配置样式 */
.global-config-section {
  padding: 20rpx 0;
}

.config-description {
  margin-bottom: 30rpx;
}

.description-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333333 !important;
  margin-bottom: 15rpx;
}

.description-text {
  display: block;
  font-size: 26rpx;
  color: #666666 !important;
  line-height: 1.5;
}


.config-actions {
  display: flex;
  gap: 15rpx;
  margin-top: 30rpx;
  flex-wrap: wrap;
}

.config-btn {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 20rpx 30rpx;
  border-radius: 10rpx;
  font-size: 26rpx;
  border: 2rpx solid;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  justify-content: center;
  min-width: 160rpx;
}

.config-btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.config-btn.outline {
  background: transparent;
  border-color: #1B2A41;
  color: #1B2A41 !important;
}

.config-btn.danger {
  background: #fee;
  border-color: #f56565;
  color: #c53030;
}

.config-btn:hover {
  transform: translateY(-2rpx);
}

.config-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.config-icon {
  font-size: 28rpx;
}

.config-text {
  font-weight: 500;
}

.config-tips {
  background: #f8f9fa;
  border-radius: 10rpx;
  padding: 25rpx;
  margin-top: 20rpx;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 15rpx;
  margin-bottom: 15rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-icon {
  font-size: 28rpx;
  margin-top: 2rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #555555 !important;
  line-height: 1.4;
  flex: 1;
}

/* 配置说明卡片样式 */
.info-section {
  padding: 20rpx 0;
}

.info-card {
  background: #f8f9fa;
  border-radius: 12rpx;
  padding: 30rpx;
  border-left: 5rpx solid var(--color-primary);
}

.upgrade-notice {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border-left-color: var(--color-accent);
}

.info-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.info-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.info-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333333 !important;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.info-text {
  font-size: 26rpx;
  color: #555555 !important;
  line-height: 1.5;
}

.info-actions {
  text-align: center;
  padding-top: 15rpx;
  border-top: 1rpx solid rgba(0,0,0,0.1);
}

.info-action-text {
  font-size: 24rpx;
  color: #007AFF !important;
  font-weight: 500;
}

/* 快速更新按钮样式 */
.quick-actions {
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.quick-title {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #333333 !important;
  margin-bottom: 20rpx;
}

.quick-buttons {
  display: flex;
  gap: 15rpx;
  flex-wrap: wrap;
}

.quick-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 15rpx 25rpx;
  background: #f8f9fa;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 140rpx;
  justify-content: center;
}

.quick-btn:hover {
  border-color: var(--color-primary);
  background: rgba(27, 42, 65, 0.05);
  transform: translateY(-2rpx);
}

.quick-icon {
  font-size: 28rpx;
}

.quick-text {
  font-size: 24rpx;
  color: #333333 !important;
  font-weight: 500;
}

/* 密码输入框样式 */
.password-section {
  padding: 20rpx 0;
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-wrapper .form-input {
  padding-right: 80rpx;
}

.password-input-wrapper .password-toggle {
  position: absolute;
  right: 25rpx;
  font-size: 32rpx;
  cursor: pointer;
}

.password-actions {
  display: flex;
  justify-content: center;
  margin-top: 40rpx;
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .form-actions {
    flex-direction: column;
  }
  
  .action-btn {
    width: 100%;
  }
  
  .config-actions {
    flex-direction: column;
  }
  
  .quick-buttons {
    flex-direction: column;
  }
  
  .quick-btn {
    width: 100%;
  }
}
</style>
