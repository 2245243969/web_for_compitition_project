<template>
  <view class="web-layout">
    <!-- 左侧导航栏 -->
    <Sidebar />
    
    <!-- 主内容区域 -->
    <view class="web-content">
      <view class="content-wrapper">
        <!-- 页面标题 -->
        <view class="page-header fade-in-up">
          <text class="page-title">提取结果</text>
          <text class="page-subtitle">查看文档提取结果和详细分析</text>
        </view>
        
        <view class="results-container">
    <!-- 结果概览 -->
    <view class="overview-section">
      <view class="overview-card">
        <view class="overview-header">
          <text class="overview-title">提取结果概览</text>
          <view class="overview-stats">
            <view class="stat-item">
              <text class="stat-number">{{ extractedFieldsCount }}</text>
              <text class="stat-label">提取字段</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ accuracyRate }}%</text>
              <text class="stat-label">准确率</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ processingTime }}s</text>
              <text class="stat-label">处理时间</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 主要信息 -->
    <view class="main-info-section">
      <view class="section-title">
        <text class="title-text">主要信息</text>
      </view>
      <view class="info-grid">
        <view class="info-item primary">
          <text class="info-label">基金名称</text>
          <text class="info-value">{{ extractedData.fundName }}</text>
        </view>
        <view class="info-item primary">
          <text class="info-label">发行时间</text>
          <text class="info-value">{{ extractedData.issueDate }}</text>
        </view>
        <view class="info-item primary">
          <text class="info-label">基金管理人</text>
          <text class="info-value">{{ extractedData.fundManager }}</text>
        </view>
        <view class="info-item primary">
          <text class="info-label">基金托管人</text>
          <text class="info-value">{{ extractedData.fundTrustee }}</text>
        </view>
        <view class="info-item primary">
          <text class="info-label">文档种类</text>
          <text class="info-value">{{ extractedData.documentType }}</text>
        </view>
      </view>
    </view>

    <!-- 基金详情 -->
    <view class="details-section">
      <view class="section-title">
        <text class="title-text">基金详情</text>
      </view>
      <view class="details-grid">
        <view class="detail-item">
          <text class="detail-label">基金类型</text>
          <text class="detail-value">{{ extractedData.fundType }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">运作方式</text>
          <text class="detail-value">{{ extractedData.operationMode }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">募集规模</text>
          <text class="detail-value">{{ extractedData.raiseScale }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">风险等级</text>
          <text class="detail-value">{{ extractedData.riskLevel }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">最低投资额</text>
          <text class="detail-value">{{ extractedData.minInvestment }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">投资目标</text>
          <text class="detail-value">{{ extractedData.investmentTarget }}</text>
        </view>
      </view>
    </view>

    <!-- 费率信息 -->
    <view class="rates-section">
      <view class="section-title">
        <text class="title-text">费率信息</text>
      </view>
      <view class="rates-grid">
        <view class="rate-item">
          <view class="rate-header">
            <text class="rate-label">认购费率</text>
            <text class="rate-value">{{ extractedData.subscriptionRate }}</text>
          </view>
          <view class="rate-bar">
            <view class="rate-fill" :style="{ width: getRatePercentage(extractedData.subscriptionRate) + '%' }"></view>
          </view>
        </view>
        <view class="rate-item">
          <view class="rate-header">
            <text class="rate-label">申购费率</text>
            <text class="rate-value">{{ extractedData.purchaseRate }}</text>
          </view>
          <view class="rate-bar">
            <view class="rate-fill" :style="{ width: getRatePercentage(extractedData.purchaseRate) + '%' }"></view>
          </view>
        </view>
        <view class="rate-item">
          <view class="rate-header">
            <text class="rate-label">赎回费率</text>
            <text class="rate-value">{{ extractedData.redemptionRate }}</text>
          </view>
          <view class="rate-bar">
            <view class="rate-fill" :style="{ width: getRatePercentage(extractedData.redemptionRate) + '%' }"></view>
          </view>
        </view>
        <view class="rate-item">
          <view class="rate-header">
            <text class="rate-label">管理费率</text>
            <text class="rate-value">{{ extractedData.managementRate }}</text>
          </view>
          <view class="rate-bar">
            <view class="rate-fill" :style="{ width: getRatePercentage(extractedData.managementRate) + '%' }"></view>
          </view>
        </view>
        <view class="rate-item">
          <view class="rate-header">
            <text class="rate-label">托管费率</text>
            <text class="rate-value">{{ extractedData.custodianRate }}</text>
          </view>
          <view class="rate-bar">
            <view class="rate-fill" :style="{ width: getRatePercentage(extractedData.custodianRate) + '%' }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 数据质量 -->
    <view class="quality-section">
      <view class="section-title">
        <text class="title-text">数据质量</text>
      </view>
      <view class="quality-card">
        <view class="quality-item">
          <text class="quality-label">完整性</text>
          <view class="quality-bar">
            <view class="quality-fill" style="width: 95%"></view>
          </view>
          <text class="quality-score">95%</text>
        </view>
        <view class="quality-item">
          <text class="quality-label">准确性</text>
          <view class="quality-bar">
            <view class="quality-fill" style="width: 92%"></view>
          </view>
          <text class="quality-score">92%</text>
        </view>
        <view class="quality-item">
          <text class="quality-label">一致性</text>
          <view class="quality-bar">
            <view class="quality-fill" style="width: 88%"></view>
          </view>
          <text class="quality-score">88%</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="actions-section">
      <view class="action-buttons">
        <button class="action-btn export" @click="exportData">
          <text class="btn-text">导出数据</text>
        </button>
        <button class="action-btn share" @click="shareData">
          <text class="btn-text">分享结果</text>
        </button>
        <button class="action-btn compare" @click="compareData">
          <text class="btn-text">对比分析</text>
        </button>
      </view>
    </view>

    <!-- 原始文档 -->
    <view class="original-section">
      <view class="section-title">
        <text class="title-text">原始文档</text>
      </view>
      <view class="original-card">
        <view class="original-info">
          <text class="original-name">{{ originalFileName }}</text>
          <text class="original-size">{{ originalFileSize }}</text>
        </view>
        <button class="view-original-btn" @click="viewOriginal">
          <text class="btn-text">查看原文档</text>
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
      extractedData: {
        fundName: '华夏成长混合型证券投资基金',
        issueDate: '2024年1月15日',
        fundManager: '华夏基金管理有限公司',
        fundTrustee: '中国工商银行股份有限公司',
        fundType: '混合型',
        operationMode: '契约型开放式',
        raiseScale: '10亿元人民币',
        subscriptionRate: '1.2%',
        purchaseRate: '1.5%',
        redemptionRate: '0.5%',
        managementRate: '1.5%',
        custodianRate: '0.25%',
        investmentTarget: '主要投资于具有良好成长性的上市公司股票',
        riskLevel: '中等风险',
        minInvestment: '1000元'
      },
      extractedFieldsCount: 15,
      accuracyRate: 92,
      processingTime: 3.5,
      originalFileName: '华夏成长混合基金发行公告.pdf',
      originalFileSize: '2.5 MB'
    }
  },
  methods: {
    getRatePercentage(rate) {
      const num = parseFloat(rate.replace('%', ''))
      return Math.min(num * 20, 100) // 将费率转换为百分比显示
    },
    
    exportData() {
      uni.showToast({
        title: '数据导出成功',
        icon: 'success'
      })
    },
    
    shareData() {
      uni.showToast({
        title: '分享功能开发中',
        icon: 'none'
      })
    },
    
    compareData() {
      uni.showToast({
        title: '对比功能开发中',
        icon: 'none'
      })
    },
    
    viewOriginal() {
      uni.showToast({
        title: '查看原文档',
        icon: 'none'
      })
    }
  }
}
</script>

<style>
.results-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx;
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
}

.overview-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 30rpx;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
  gap: 40rpx;
}

.stat-item {
  text-align: center;
  min-width: 180rpx;
  flex: 1;
}

.stat-number {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 10rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
}

.section-title {
  margin-bottom: 20rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #ffffff;
}

.main-info-section, .details-section, .rates-section, .quality-section, .actions-section, .original-section {
  margin-bottom: 40rpx;
}

.info-grid, .details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.info-item, .detail-item {
  background: #ffffff;
  border-radius: 15rpx;
  padding: 20rpx;
  box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
}

.info-item.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.info-label, .detail-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 10rpx;
}

.info-item.primary .info-label {
  color: rgba(255, 255, 255, 0.8);
}

.info-value, .detail-value {
  display: block;
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  word-break: break-all;
}

.info-item.primary .info-value {
  color: #ffffff;
}

.rates-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.rate-item {
  background: #ffffff;
  border-radius: 15rpx;
  padding: 20rpx;
  box-shadow: 0 5rpx 15rpx rgba(0, 0, 0, 0.1);
}

.rate-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15rpx;
}

.rate-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

.rate-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

.rate-bar {
  width: 100%;
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
}

.rate-fill {
  height: 100%;
  background: #333333;
  transition: width 0.3s ease;
}

.quality-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.quality-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.quality-item:last-child {
  margin-bottom: 0;
}

.quality-label {
  width: 120rpx;
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
}

.quality-bar {
  flex: 1;
  height: 8rpx;
  background: #f0f0f0;
  border-radius: 4rpx;
  overflow: hidden;
  margin: 0 20rpx;
}

.quality-fill {
  height: 100%;
  background: #333333;
}

.quality-score {
  width: 60rpx;
  font-size: 24rpx;
  color: #333333;
  font-weight: bold;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  flex: 1;
  border: none;
  border-radius: 50rpx;
  padding: 20rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.action-btn.export {
  background: #333333;
  color: #ffffff;
}

.action-btn.share {
  background: #666666;
  color: #ffffff;
}

.action-btn.compare {
  background: #999999;
  color: #ffffff;
}

.original-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.original-info {
  flex: 1;
}

.original-name {
  display: block;
  font-size: 28rpx;
  color: #333333;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.original-size {
  display: block;
  font-size: 24rpx;
  color: #666666;
}

.view-original-btn {
  background: #333333;
  color: #ffffff;
  border: none;
  border-radius: 6rpx;
  padding: 15rpx 30rpx;
  font-size: 24rpx;
}

.btn-text {
  color: inherit;
}
</style> 