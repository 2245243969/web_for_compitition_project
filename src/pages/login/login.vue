<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="background-decoration">
      <view class="decoration-circle circle-1"></view>
      <view class="decoration-circle circle-2"></view>
      <view class="decoration-circle circle-3"></view>
    </view>

    <!-- 居中内容区域 -->
    <view class="page-content">
      <!-- 品牌展示区域 -->
      <view class="brand-section">
        <image class="logo" src="/static/logo1.png" mode="aspectFit" />
        <text class="brand-title">基金发行公告提取系统</text>
        <text class="brand-subtitle">智能化基金文档信息提取与分析平台</text>
        
        <!-- 特性标签 -->
        <view class="features-tags">
          <view class="feature-tag">
            <text class="tag-icon">🚀</text>
            <text class="tag-text">智能解析</text>
          </view>
          <view class="feature-tag">
            <text class="tag-icon">📊</text>
            <text class="tag-text">数据分析</text>
          </view>
          <view class="feature-tag">
            <text class="tag-icon">🔒</text>
            <text class="tag-text">安全可靠</text>
          </view>
        </view>
      </view>

      <!-- 浮窗登录注册表单 -->
      <view class="form-modal">
        <view class="form-container">
        <!-- 表单切换标签 -->
        <view class="form-tabs">
          <view class="tab-item" :class="{ 'active': currentTab === 'login' }" @click="switchTab('login')">
            <text class="tab-text">登录</text>
          </view>
          <view class="tab-item" :class="{ 'active': currentTab === 'register' }" @click="switchTab('register')">
            <text class="tab-text">注册</text>
          </view>
        </view>

        <!-- 登录表单 -->
        <view v-if="currentTab === 'login'" class="form-content">
          <text class="form-title">欢迎回来</text>
          <text class="form-subtitle">请登录您的账户以继续使用</text>
          
          <view class="form-group">
            <text class="form-label">邮箱或用户名</text>
            <input 
              class="form-input" 
              type="text" 
              placeholder="请输入邮箱或用户名"
              v-model="loginForm.username"
              :class="{ 'error': loginErrors.username }"
            />
            <text v-if="loginErrors.username" class="error-text">{{ loginErrors.username }}</text>
          </view>

          <view class="form-group">
            <text class="form-label">密码</text>
            <view class="password-input-wrapper">
              <input 
                class="form-input password-input" 
                :type="showLoginPassword ? 'text' : 'password'"
                placeholder="请输入密码"
                v-model="loginForm.password"
                :class="{ 'error': loginErrors.password }"
              />
              <text 
                class="password-toggle" 
                @click="toggleLoginPassword"
              >{{ showLoginPassword ? '👁️' : '👁️‍🗨️' }}</text>
            </view>
            <text v-if="loginErrors.password" class="error-text">{{ loginErrors.password }}</text>
          </view>

          <view class="form-options">
            <label class="checkbox-wrapper">
              <checkbox 
                class="checkbox" 
                :checked="loginForm.rememberMe" 
                @change="onRememberMeChange"
              />
              <text class="checkbox-text">记住我</text>
            </label>
            <text class="forgot-password" @click="showForgotPassword">忘记密码？</text>
          </view>

          <button 
            class="submit-btn" 
            :class="{ 'loading': isLoading }"
            @click="handleLogin"
            :disabled="isLoading"
          >
            <text class="btn-text">{{ isLoading ? '登录中...' : '登录' }}</text>
          </button>


        </view>

        <!-- 注册表单 -->
        <view v-if="currentTab === 'register'" class="form-content">
          <text class="form-title">创建账户</text>
          <text class="form-subtitle">加入我们，开始您的智能文档分析之旅</text>
          
          <view class="form-group">
            <text class="form-label">用户名</text>
            <input 
              class="form-input" 
              type="text" 
              placeholder="请输入用户名"
              v-model="registerForm.username"
              :class="{ 'error': registerErrors.username }"
            />
            <text v-if="registerErrors.username" class="error-text">{{ registerErrors.username }}</text>
          </view>

          <view class="form-group">
            <text class="form-label">邮箱</text>
            <input 
              class="form-input" 
              type="email" 
              placeholder="请输入邮箱地址"
              v-model="registerForm.email"
              :class="{ 'error': registerErrors.email }"
            />
            <text v-if="registerErrors.email" class="error-text">{{ registerErrors.email }}</text>
          </view>

          <view class="form-group">
            <text class="form-label">密码</text>
            <view class="password-input-wrapper">
              <input 
                class="form-input password-input" 
                :type="showRegisterPassword ? 'text' : 'password'"
                placeholder="请输入密码（至少6位）"
                v-model="registerForm.password"
                :class="{ 'error': registerErrors.password }"
              />
              <text 
                class="password-toggle" 
                @click="toggleRegisterPassword"
              >{{ showRegisterPassword ? '👁️' : '👁️‍🗨️' }}</text>
            </view>
            <text v-if="registerErrors.password" class="error-text">{{ registerErrors.password }}</text>
          </view>

          <view class="form-group">
            <text class="form-label">确认密码</text>
            <view class="password-input-wrapper">
              <input 
                class="form-input password-input" 
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="请再次输入密码"
                v-model="registerForm.confirmPassword"
                :class="{ 'error': registerErrors.confirmPassword }"
              />
              <text 
                class="password-toggle" 
                @click="toggleConfirmPassword"
              >{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</text>
            </view>
            <text v-if="registerErrors.confirmPassword" class="error-text">{{ registerErrors.confirmPassword }}</text>
          </view>



          <button 
            class="submit-btn" 
            :class="{ 'loading': isLoading }"
            @click="handleRegister"
            :disabled="isLoading"
          >
            <text class="btn-text">{{ isLoading ? '注册中...' : '创建账户' }}</text>
          </button>
        </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { loginApi, registerApi } from '../../utils/api.js'

export default {
  name: 'LoginPage',
  data() {
    return {
      currentTab: 'login', // 'login' 或 'register'
      isLoading: false,
      showLoginPassword: false,
      showRegisterPassword: false,
      showConfirmPassword: false,
      
      // 登录表单数据
      loginForm: {
        username: '',
        password: '',
        rememberMe: false
      },
      
      // 注册表单数据
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      },
      
      // 表单验证错误
      loginErrors: {},
      registerErrors: {}
    }
  },
  methods: {
    // 切换登录/注册标签
    switchTab(tab) {
      this.currentTab = tab
      this.clearErrors()
    },
    
    // 清除错误信息
    clearErrors() {
      this.loginErrors = {}
      this.registerErrors = {}
    },
    
    // 切换登录密码显示
    toggleLoginPassword() {
      this.showLoginPassword = !this.showLoginPassword
    },
    
    // 切换注册密码显示
    toggleRegisterPassword() {
      this.showRegisterPassword = !this.showRegisterPassword
    },
    
    // 切换确认密码显示
    toggleConfirmPassword() {
      this.showConfirmPassword = !this.showConfirmPassword
    },
    
    // 记住我选择变化
    onRememberMeChange(e) {
      this.loginForm.rememberMe = e.detail.value.length > 0
    },
    

    

    
    // 显示忘记密码
    showForgotPassword() {
      uni.showModal({
        title: '忘记密码',
        content: '请联系管理员重置密码，或通过邮箱找回密码功能。',
        showCancel: false,
        confirmText: '知道了'
      })
    },
    
    // 验证登录表单
    validateLoginForm() {
      const errors = {}
      
      if (!this.loginForm.username.trim()) {
        errors.username = '请输入邮箱或用户名'
      }
      
      if (!this.loginForm.password.trim()) {
        errors.password = '请输入密码'
      } else if (this.loginForm.password.length < 6) {
        errors.password = '密码长度至少6位'
      }
      
      this.loginErrors = errors
      return Object.keys(errors).length === 0
    },
    
    // 验证注册表单
    validateRegisterForm() {
      const errors = {}
      
      if (!this.registerForm.username.trim()) {
        errors.username = '请输入用户名'
      } else if (this.registerForm.username.length < 2) {
        errors.username = '用户名至少2个字符'
      } else if (this.registerForm.username.length > 20) {
        errors.username = '用户名不能超过20个字符'
      }
      
      if (!this.registerForm.email.trim()) {
        errors.email = '请输入邮箱地址'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.registerForm.email)) {
        errors.email = '请输入有效的邮箱地址'
      }
      
      if (!this.registerForm.password.trim()) {
        errors.password = '请输入密码'
      } else if (this.registerForm.password.length < 6) {
        errors.password = '密码长度至少6位'
      }
      
      if (!this.registerForm.confirmPassword.trim()) {
        errors.confirmPassword = '请确认密码'
      } else if (this.registerForm.password !== this.registerForm.confirmPassword) {
        errors.confirmPassword = '两次输入的密码不一致'
      }
      

      
      this.registerErrors = errors
      return Object.keys(errors).length === 0
    },
    
    // 处理登录
    async handleLogin() {
      if (!this.validateLoginForm()) {
        return
      }
      
      this.isLoading = true
      
      try {
        // 调用真实登录API
        const loginData = {
          username: this.loginForm.username,
          password: this.loginForm.password,
          rememberMe: this.loginForm.rememberMe
        }
        
        const result = await loginApi(loginData)
        
        if (this.loginForm.rememberMe) {
          uni.setStorageSync('rememberedUsername', this.loginForm.username)
        }
        
        uni.showToast({
          title: '登录成功',
          icon: 'success'
        })
        
        // 确保存储同步完成后再跳转
        setTimeout(() => {
          // 二次确认token已保存
          const savedToken = uni.getStorageSync('token')
          console.log('🔄 跳转前确认token:', {
            hasToken: !!savedToken,
            tokenLength: savedToken ? savedToken.length : 0
          })
          
          uni.reLaunch({
            url: '/pages/index/index'
          })
        }, 2000) // 稍微延长等待时间
        
      } catch (error) {
        console.error('登录失败:', error)
        uni.showToast({
          title: error.message || '登录失败，请检查用户名和密码',
          icon: 'none'
        })
      } finally {
        this.isLoading = false
      }
    },
    
    // 处理注册
    async handleRegister() {
      if (!this.validateRegisterForm()) {
        return
      }
      
      this.isLoading = true
      
      try {
        // 调用真实注册API
        const registerData = {
          username: this.registerForm.username,
          email: this.registerForm.email,
          password: this.registerForm.password,
          confirmPassword: this.registerForm.confirmPassword
        }
        
        const result = await registerApi(registerData)
        
        uni.showToast({
          title: '注册成功，请登录',
          icon: 'success'
        })
        
        // 切换到登录页面，并填充用户名
        setTimeout(() => {
          this.currentTab = 'login'
          this.loginForm.username = this.registerForm.email
          this.registerForm = {
            username: '',
            email: '',
            password: '',
            confirmPassword: ''
          }
        }, 1500)
        
      } catch (error) {
        console.error('注册失败:', error)
        uni.showToast({
          title: error.message || '注册失败，请稍后重试',
          icon: 'none'
        })
      } finally {
        this.isLoading = false
      }
    },
    

    

  },
  
  onLoad() {
    // 检查是否记住了用户名
    const rememberedUsername = uni.getStorageSync('rememberedUsername')
    if (rememberedUsername) {
      this.loginForm.username = rememberedUsername
      this.loginForm.rememberMe = true
    }
    
    // 检查是否已经登录
    const isLoggedIn = uni.getStorageSync('isLoggedIn')
    if (isLoggedIn) {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(-45deg, var(--color-success), #3a7f5d, #4a9f6e, #5ab57f, var(--color-accent), #d4b380, #b8976a, var(--color-primary));
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-success), var(--color-accent));
  opacity: 0.15;
  animation: float 20s ease-in-out infinite;
}

.circle-1 {
  width: 200rpx;
  height: 200rpx;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150rpx;
  height: 150rpx;
  top: 60%;
  right: 10%;
  animation-delay: 5s;
}

.circle-3 {
  width: 100rpx;
  height: 100rpx;
  bottom: 20%;
  left: 30%;
  animation-delay: 10s;
}

/* 居中内容区域 */
.page-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 900rpx;
  padding: 40rpx;
}

/* 品牌展示区域 */
.brand-section {
  text-align: center;
  color: white;
  margin-bottom: 60rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 30rpx;
  filter: drop-shadow(0 8rpx 16rpx rgba(0, 0, 0, 0.2));
}

.brand-title {
  display: block;
  font-size: 54rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  display: block;
  font-size: 32rpx;
  opacity: 0.9;
  margin-bottom: 40rpx;
  line-height: 1.6;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

/* 特性标签 */
.features-tags {
  display: flex;
  justify-content: center;
  gap: 25rpx;
  flex-wrap: wrap;
}

.feature-tag {
  display: flex;
  align-items: center;
  gap: 15rpx;
  padding: 15rpx 30rpx;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 50rpx;
  backdrop-filter: blur(10rpx);
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-tag:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 25rpx rgba(45, 106, 79, 0.3);
}

.tag-icon {
  font-size: 28rpx;
}

.tag-text {
  font-size: 26rpx;
  font-weight: 500;
  color: white;
}

/* 浮窗表单区域 */
.form-modal {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 20rpx;
  padding: 60rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  width: 100%;
  max-width: 700rpx;
  position: relative;
  animation: modalSlideIn 0.6s ease-out;
}

.form-container {
  width: 100%;
}

/* 表单标签 */
.form-tabs {
  display: flex;
  margin-bottom: 60rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 20rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3rpx solid transparent;
}

.tab-item.active {
  border-bottom-color: var(--color-primary);
}

.tab-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #666;
  transition: color 0.3s ease;
}

.tab-item.active .tab-text {
  color: var(--color-primary);
}

/* 表单内容 */
.form-content {
  animation: fadeInUp 0.5s ease-out;
}

.form-title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: var(--color-title);
  margin-bottom: 20rpx;
}

.form-subtitle {
  display: block;
  font-size: 28rpx;
  color: var(--color-secondary);
  margin-bottom: 60rpx;
  line-height: 1.5;
}

.form-group {
  margin-bottom: 40rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--color-title);
  margin-bottom: 15rpx;
}

.form-input {
  width: 100%;
  height: 90rpx;
  padding: 0 30rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 12rpx;
  font-size: 28rpx;
  background: #fff;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: var(--color-primary);
  outline: none;
}

.form-input.error {
  border-color: var(--color-error);
}

.password-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input {
  padding-right: 80rpx;
}

.password-toggle {
  position: absolute;
  right: 30rpx;
  font-size: 32rpx;
  cursor: pointer;
  user-select: none;
}

.error-text {
  display: block;
  font-size: 24rpx;
  color: var(--color-error);
  margin-top: 10rpx;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 15rpx;
}

.checkbox {
  transform: scale(1.2);
}

.checkbox-text {
  font-size: 26rpx;
  color: var(--color-text);
}



.link-text {
  color: var(--color-primary);
  text-decoration: underline;
}

.forgot-password {
  font-size: 26rpx;
  color: var(--color-primary);
  cursor: pointer;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 32rpx;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 8rpx 25rpx rgba(27, 42, 65, 0.3);
}

.submit-btn.loading {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text {
  color: inherit;
}



/* 动画 */
@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  25% {
    background-position: 100% 50%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0rpx) rotate(0deg);
  }
  50% {
    transform: translateY(-20rpx) rotate(180deg);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(50rpx) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media screen and (max-width: 768px) {
  .page-content {
    padding: 30rpx;
    max-width: 100%;
  }
  
  .logo {
    width: 120rpx;
    height: 120rpx;
  }
  
  .brand-title {
    font-size: 42rpx;
  }
  
  .brand-subtitle {
    font-size: 28rpx;
  }
  
  .features-tags {
    gap: 15rpx;
  }
  
  .feature-tag {
    padding: 12rpx 20rpx;
  }
  
  .tag-text {
    font-size: 22rpx;
  }
  
  .form-modal {
    padding: 40rpx;
    margin: 0 20rpx;
    max-width: calc(100vw - 40rpx);
  }
}

@media screen and (max-width: 480px) {
  .brand-title {
    font-size: 36rpx;
  }
  
  .brand-subtitle {
    font-size: 24rpx;
  }
  
  .features-tags {
    flex-direction: column;
    align-items: center;
  }
  
  .feature-tag {
    padding: 10rpx 20rpx;
  }
  
  .form-modal {
    padding: 30rpx;
  }
}
</style>
