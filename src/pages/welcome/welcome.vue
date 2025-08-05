<template>
  <view class="welcome-page">
    <view class="logo-wrapper fade-in-up">
      <image class="logo" src="/static/logo1.png" mode="aspectFit" />
      <text class="brand-text">基金发行公告提取系统</text>
    </view>

    <view class="subtitle fade-in-up">
      <text>智能化基金公告信息提取与分析平台</text>
    </view>

    <button class="start-btn fade-in-up" @click="enterSystem">
      <text class="btn-text">开始使用</text>
    </button>
  </view>
</template>

<script>
export default {
  name: 'WelcomePage',
  methods: {
    enterSystem() {
      uni.reLaunch({
        url: '/pages/index/index'
      })
    }
  }
}
</script>

<style scoped>
.welcome-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  background-size: 400% 400%;
  animation: gradientShift 12s ease infinite;
  overflow: hidden;
  position: relative;
}

/* 背景彩色光斑 */
.welcome-page::before,
.welcome-page::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(120rpx);
  opacity: 0.35;
  animation: float 14s ease-in-out infinite;
}
.welcome-page::before {
  width: 600rpx;
  height: 600rpx;
  top: -200rpx;
  left: -200rpx;
  background: var(--color-accent);
}
.welcome-page::after {
  width: 500rpx;
  height: 500rpx;
  bottom: -150rpx;
  right: -150rpx;
  background: var(--color-primary);
  animation-delay: 4s;
}


.logo-wrapper {
  transform: translateY(-20rpx);
  animation: bounceIn 1.2s ease-out both;

  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.logo {
  width: 200rpx;
  height: 200rpx;
}

.brand-text {
  color: #ffffff;
  font-size: 48rpx;
  font-weight: bold;
  animation: textFloat 4s ease-in-out infinite;
}

.subtitle {
  margin-top: 30rpx;
  margin-bottom: 80rpx;
  color: rgba(255, 255, 255, 0.9);
  font-size: 28rpx;
}

.start-btn {
  background: #ffffff;
  background-image: linear-gradient(135deg, #ffffff 0%, #f7f7f7 100%);
  color: var(--color-primary);
  color: var(--color-primary);
  border: none;
  border-radius: 60rpx;
  padding: 25rpx 120rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, background 0.2s ease;
}
.start-btn:hover {
  background-image: linear-gradient(135deg, var(--color-accent) 0%, #E4C078 100%);
  color: #ffffff;
}

.start-btn:active {
  transform: scale(0.97);
}

/* 淡入动画 */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30rpx); }
  to { opacity: 1; transform: translateY(0); }
}
.fade-in-up {
  animation: fadeInUp 0.8s ease both;
}
.fade-in-up:nth-child(2) { animation-delay: 0.1s; }
.fade-in-up:nth-child(3) { animation-delay: 0.2s; }

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes float {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-40rpx) scale(1.05); }
  100% { transform: translateY(0) scale(1); }
}

@keyframes textFloat {
  0% { transform: translateY(0); }
  50% { transform: translateY(-24rpx); }
  100% { transform: translateY(0); }
}

@keyframes bounceIn {
  0% { opacity: 0; transform: scale(0.8) translateY(-20rpx); }
  60% { opacity: 1; transform: scale(1.05) translateY(10rpx); }
  100% { transform: scale(1) translateY(0); }
}
</style>