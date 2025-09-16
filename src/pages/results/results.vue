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
              <text class="stat-number">{{ getFieldsStatistic() }}</text>
              <text class="stat-label">提取字段</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ processingTime }}s</text>
              <text class="stat-label">处理时间</text>
            </view>
            <view class="stat-item">
              <text class="stat-number">{{ getSuccessRate() }}%</text>
              <text class="stat-label">成功率</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 文档类型和基础信息 -->
    <view class="main-info-section">
      <view class="section-title">
        <text class="title-text">文档信息</text>
      </view>
      <view class="info-grid">
        <view class="info-item primary">
          <text class="info-label">文档类型</text>
          <text class="info-value">{{ getDocumentTypeLabel() }}</text>
        </view>
        <view class="info-item primary" v-if="getFieldValue('文档标题')">
          <text class="info-label">文档标题</text>
          <text class="info-value">{{ getFieldValue('文档标题') }}</text>
        </view>
        <view class="info-item primary" v-if="getFieldValue('基金名称')">
          <text class="info-label">基金名称</text>
          <text class="info-value">{{ getFieldValue('基金名称') }}</text>
        </view>
        <view class="info-item primary" v-if="getFieldValue('基金管理人名称')">
          <text class="info-label">基金管理人</text>
          <text class="info-value">{{ getFieldValue('基金管理人名称') }}</text>
        </view>
        <view class="info-item primary" v-if="getFieldValue('基金托管人名称')">
          <text class="info-label">基金托管人</text>
          <text class="info-value">{{ getFieldValue('基金托管人名称') }}</text>
        </view>
      </view>
    </view>

    <!-- 动态模块展示 -->
    <view v-for="(module, moduleKey) in extractedModules" :key="moduleKey" class="module-section">
      <view class="section-title">
        <text class="title-text">{{ getModuleIcon(moduleKey) }} {{ moduleKey }}</text>
      </view>
      
      <!-- 普通字段网格 -->
      <view class="details-grid" v-if="!isFeeModule(moduleKey)">
        <view 
          v-for="(field, fieldKey) in module" 
          :key="fieldKey" 
          class="detail-item"
          :class="{ 'full': isFullWidthField(fieldKey) }"
        >
          <text class="detail-label">{{ fieldKey }}</text>
          <text class="detail-value" :class="{ 'not-disclosed': isNotDisclosed(field) }">
            {{ getFieldDisplayValue(field) || '未识别' }}
          </text>
          <view v-if="field.confidence && !isNotDisclosed(field)" class="confidence-indicator">
            <text class="confidence-text">置信度: {{ Math.round(field.confidence * 100) }}%</text>
          </view>
          <view v-if="isNotDisclosed(field)" class="not-disclosed-indicator">
            <text class="not-disclosed-text">未在文档中找到</text>
          </view>
        </view>
      </view>
      
      <!-- 费用模块特殊展示 -->
      <view v-else class="fee-section">
        <view 
          v-for="(feeField, feeFieldKey) in module" 
          :key="feeFieldKey" 
          class="rate-item"
          v-if="isFeeRateField(feeFieldKey)"
        >
          <view class="rate-header">
            <text class="rate-label">{{ feeFieldKey }}</text>
            <text class="rate-value" :class="{ 'no-fee': getRatePercentage(getFieldDisplayValue(feeField)) === 0, 'not-disclosed': isNotDisclosed(feeField) }">
              {{ getFieldDisplayValue(feeField) || '未识别' }}
            </text>
          </view>
          <view class="rate-bar" v-if="getRatePercentage(getFieldDisplayValue(feeField)) > 0 && !isNotDisclosed(feeField)">
            <view class="rate-fill" :style="{ width: getRatePercentage(getFieldDisplayValue(feeField)) + '%' }"></view>
          </view>
          <view class="no-fee-indicator" v-else-if="getRatePercentage(getFieldDisplayValue(feeField)) === 0 && !isNotDisclosed(feeField)">
            <text class="no-fee-text">免费</text>
          </view>
          <view v-if="isNotDisclosed(feeField)" class="not-disclosed-indicator">
            <text class="not-disclosed-text">未在文档中找到</text>
          </view>
        </view>
        
        <!-- 非费率字段 -->
        <view class="fee-details">
          <view 
            v-for="(detailField, detailFieldKey) in module" 
            :key="detailFieldKey" 
            class="fee-detail-item"
            v-if="!isFeeRateField(detailFieldKey)"
          >
            <text class="fee-detail-label">{{ detailFieldKey }}</text>
            <text class="fee-detail-value" :class="{ 'not-disclosed': isNotDisclosed(detailField) }">
              {{ getFieldDisplayValue(detailField) || '未识别' }}
            </text>
            <view v-if="isNotDisclosed(detailField)" class="not-disclosed-indicator">
              <text class="not-disclosed-text">未在文档中找到</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作按钮 -->

      </view>
      </view>
    </view>
  </view>
</template>

<script>
import Sidebar from '../../components/Sidebar.vue'
import { DOCUMENT_TYPES, getAllContractFields, getAllCustodyFields, getAllProspectusFields } from '../../config/fund-fields.js'
import { getExtractionResultsApi, exportResultsApi } from '../../utils/api.js'
import { checkAuthAndRedirect } from '../../utils/auth.js'

export default {
  components: {
    Sidebar
  },
  data() {
    return {
      documentType: 'custody_agreement', // 当前文档类型
      taskId: null, // 提取任务ID
      isLoading: true, // 加载状态
      rawExtractedData: {}, // 原始提取数据（后端返回的结构）
      extractionSummary: {  // 提取统计信息
        totalFields: 0,
        extractedFields: 0,
        documentType: '',
        processingTime: 0
      },
      // 托管协议样本数据
      custodyData: {
        // 模块1：基金管理人信息
        fundManagerName: '中银基金管理有限公司',
        fundManagerOfficeAddress: '北京市西城区复兴门内大街1号',
        fundManagerPostalCode: '100818',
        fundManagerLegalRepresentative: '王圣明',
        fundManagerDuration: '持续经营',
        fundManagerOrganizationForm: '有限责任公司',
        
        // 模块2：基金托管人信息
        fundCustodianName: '中国工商银行股份有限公司',
        fundCustodianOfficeAddress: '北京市西城区复兴门内大街55号',
        fundCustodianPostalCode: '100140',
        fundCustodianLegalRepresentative: '陈四清',
        fundCustodianDuration: '持续经营',
        fundCustodianOrganizationForm: '股份有限公司',
        
        // 模块3：协议依据与约定事项
        custodyAgreementBasis: '依据《中华人民共和国证券投资基金法》、《公开募集证券投资基金运作管理办法》等法律法规订立',
        
        // 模块4：基金资产估值与收益分配
        fundAssetValuationObject: '基金投资的各类证券及票据价值、银行存款本息、基金应收的申购基金款等',
        fundIncomeDistributionMethod: '现金分红为主，可选择红利再投资',
        sidePocketIncomeDistribution: '实施侧袋机制期间，主袋份额的收益分配不受侧袋机制影响',
        
        // 模块5：基金费用
        fundCustodyFee: '年费率0.25%',
        fundManagementFee: '年费率1.50%',
        classAServiceFee: '不收取销售服务费',
        classCServiceFee: '年费率0.40%',
        classEServiceFee: '年费率0.20%',
        excludedFeeItems: '基金管理人和基金托管人因未履行或未完全履行义务导致的费用支出或基金财产的损失等'
      },
      // 招募说明书样本数据
      prospectusData: {
        // 模块1：基金管理人信息
        fundManagerName: '中银基金管理有限公司',
        fundManagerOfficeAddress: '北京市西城区复兴门内大街1号',
        fundManagerLegalRepresentative: '王圣明',
        fundManagerContact: '张先生',
        fundManagerCustomerServicePhone: '021-38834999',
        fundManagerFax: '021-68597222',
        
        // 模块2：基金托管人信息
        fundCustodianName: '中国工商银行股份有限公司',
        fundCustodianOfficeAddress: '北京市西城区复兴门内大街55号',
        fundCustodianLegalRepresentative: '陈四清',
        
        // 模块3：基金募集与发售安排
        fundraisingBasis: '《中华人民共和国证券投资基金法》等法律法规',
        fundraisingPeriod: '2024年1月15日至2024年2月15日',
        offeringTime: '2024年1月15日9:30-15:00',
        subscriptionTime: '2024年1月15日至2024年2月14日',
        offeringParValue: '人民币1.00元',
        purchaseOpenDate: '基金合同生效后每个工作日9:30-15:00',
        redemptionOpenDate: '基金合同生效后每个工作日9:30-15:00',
        
        // 模块4：基金运作与估值
        fundAssetValuationDate: '每个工作日',
        fundAssetValuationObject: '基金投资的各类证券及票据价值、银行存款本息等',
        
        // 模块5：基金费用
        custodianCustodyFee: '年费率0.25%',
        fundSalesServiceFee: '年费率0.40%',
        subscriptionFeeRate: '1.20%',
        redemptionFeeRate: '0.50%'
      },
      extractedFieldsCount: 19,
      processingTime: 2.8
    }
  },
  computed: {
    extractedData() {
      // 根据文档类型返回对应的数据
      if (this.documentType === 'custody_agreement') {
        return this.custodyData
      } else if (this.documentType === 'prospectus') {
        return this.prospectusData
      }
      return this.custodyData // 默认返回托管协议数据
    },
    
    // 动态提取的模块数据
    extractedModules() {
      return this.rawExtractedData || {}
    }
  },
  methods: {
    // 从API加载提取结果
    async loadExtractionResults() {
      if (!this.taskId) {
        this.isLoading = false
        return
      }
      
      try {
        const results = await getExtractionResultsApi(this.taskId)
        
        if (results && results.extractedData) {
          console.log('提取结果:', results)
          
          // 更新统计信息
          if (results.extractionSummary) {
            this.extractedFieldsCount = results.extractionSummary.extractedFields || results.extractionSummary.totalFields
            this.processingTime = results.extractionSummary.processingTime 
              ? Math.round(results.extractionSummary.processingTime / 1000)  // 转换为秒
              : results.processingDetails?.totalProcessingTime || this.processingTime
          }
          
        // 保存原始提取数据用于动态展示
        this.rawExtractedData = results.extractedData || {}
        console.log('🔍 原始提取数据:', this.rawExtractedData)
        
        // 更新提取统计信息
        if (results.extractionSummary) {
          this.extractionSummary = {
            totalFields: results.extractionSummary.totalFields || 0,
            extractedFields: results.extractionSummary.extractedFields || 0,
            documentType: results.extractionSummary.documentType || '',
            processingTime: results.extractionSummary.processingTime || 0
          }
          
          // 更新页面显示的统计信息
          this.extractedFieldsCount = this.extractionSummary.extractedFields
          this.processingTime = this.extractionSummary.processingTime
          
          console.log('📊 提取统计信息:', this.extractionSummary)
        }
        
        // 解析提取的数据（用于兼容旧的显示方式）
        const extractedData = results.extractedData
        let parsedData = {}
        
        // 遍历所有模块的数据
        Object.keys(extractedData).forEach(moduleKey => {
          const moduleData = extractedData[moduleKey]
          if (moduleData && typeof moduleData === 'object') {
            Object.keys(moduleData).forEach(fieldKey => {
              const fieldData = moduleData[fieldKey]
              if (fieldData && fieldData.value) {
                parsedData[fieldKey] = fieldData.value
              }
            })
          }
        })
        
        // 根据文档类型更新数据
        if (results.documentId || results.documentType || results.extractionSummary?.documentType) {
          const docType = results.extractionSummary?.documentType || results.documentType
          console.log('🔍 API返回的文档类型:', docType)
          
          // 优先匹配英文标识符
          if (docType === 'fund_contract' || (docType && docType.includes('基金合同'))) {
            this.documentType = 'fund_contract'
          } else if (docType === 'custody_agreement' || (docType && docType.includes('托管协议'))) {
            this.documentType = 'custody_agreement'
          } else if (docType === 'prospectus' || (docType && docType.includes('招募说明书'))) {
            this.documentType = 'prospectus'
          } else {
            this.documentType = docType || 'custody_agreement'
          }
          
          console.log('✅ API设置的文档类型:', this.documentType)
        }
        
        // 更新对应的数据对象
        if (this.documentType === 'custody_agreement') {
          this.custodyData = { ...this.custodyData, ...parsedData }
        } else if (this.documentType === 'prospectus') {
          this.prospectusData = { ...this.prospectusData, ...parsedData }
        }
          
        }
        
      } catch (error) {
        console.error('加载提取结果失败:', error)
        uni.showToast({
          title: '加载结果失败，显示演示数据',
          icon: 'none'
        })
      } finally {
        this.isLoading = false
      }
    },
    getRatePercentage(rate) {
      // 处理空值或非字符串类型
      if (!rate || typeof rate !== 'string') {
        return 0
      }
      
      // 处理"不收取"等非数字内容
      if (rate.includes('不收取') || rate.includes('免费') || rate.includes('无')) {
        return 0
      }
      
      // 提取数字部分（支持小数）
      const match = rate.match(/(\d+\.?\d*)/);
      if (!match) {
        return 0
      }
      
      const num = parseFloat(match[1])
      
      // 如果是百分比形式，直接使用数值
      // 如果费率超过5%，按5%作为100%显示；否则按比例显示
      const maxRate = 5.0 // 设置最大基准费率为5%
      const percentage = Math.min((num / maxRate) * 100, 100)
      
      return percentage
    },
    
    getFieldsByModule(module) {
      let allFields = []
      if (this.documentType === 'fund_contract') {
        allFields = getAllContractFields()
      } else if (this.documentType === 'custody_agreement') {
        allFields = getAllCustodyFields()
      } else if (this.documentType === 'prospectus') {
        allFields = getAllProspectusFields()
      }
      return allFields.filter(field => field.module === module)
    },
    
    
    getDocumentTypeLabel() {
      // 如果没有文档类型，返回空字符串（空白状态）
      if (!this.documentType) {
        return ''
      }
      
      if (this.documentType === 'fund_contract') {
        return DOCUMENT_TYPES.FUND_CONTRACT.label
      } else if (this.documentType === 'custody_agreement') {
        return DOCUMENT_TYPES.CUSTODY_AGREEMENT.label
      } else if (this.documentType === 'prospectus') {
        return DOCUMENT_TYPES.PROSPECTUS.label
      }
      return '未知类型'
    },
    
    // 获取字段值（用于基础信息显示）
    getFieldValue(fieldName) {
      // 在所有模块中查找字段
      for (const moduleKey in this.rawExtractedData) {
        const module = this.rawExtractedData[moduleKey]
        if (module && module[fieldName]) {
          return this.getFieldDisplayValue(module[fieldName])
        }
      }
      return null
    },
    
    // 获取字段显示值 - 适配后端返回的数据格式
    getFieldDisplayValue(field) {
      if (!field) return ''
      
      // 处理复杂嵌套对象结构 (如: {提取内容: {value: "xxx"}})
      if (typeof field === 'object') {
        // 如果有 value 字段，直接使用
        if (field.value !== undefined) {
          return field.value || ''
        }
        
        // 如果有嵌套的 "提取内容" 结构
        if (field['提取内容'] && typeof field['提取内容'] === 'object') {
          const nestedContent = field['提取内容']
          if (nestedContent.value !== undefined) {
            return nestedContent.value || ''
          }
        }
        
        // 尝试提取对象中的第一个有效值
        const values = Object.values(field)
        if (values.length > 0) {
          const firstValue = values[0]
          if (typeof firstValue === 'string') {
            return firstValue
          }
          if (typeof firstValue === 'object' && firstValue.value !== undefined) {
            return firstValue.value || ''
          }
        }
        
        // 如果都没有，返回空字符串而不是 [object Object]
          return ''
        }
      
      // 处理简单字符串格式
      if (typeof field === 'string') {
        return field
      }
      
      // 其他情况转字符串
      return field ? field.toString() : ''
    },

    // 将复杂的后端数据结构重新组织为前端期望的模块化结构
    organizeFieldsIntoModules(backendData) {
      console.log('🔧 开始重新组织后端数据结构...')
      
      const organizedData = {}
      
      // 检查是否有 modular_data 字段（包含模块化数据）
      if (backendData.modular_data && typeof backendData.modular_data === 'object') {
        console.log('🎯 检测到 modular_data 结构，提取模块数据...')
        console.log('🔍 modular_data 内容:', backendData.modular_data)
        
        let modularData = backendData.modular_data
        
        // 检查是否是嵌套的 modular_data.value 格式
        if (modularData.value && typeof modularData.value === 'object') {
          console.log('📦 使用 modular_data.value 路径')
          modularData = modularData.value
        } else {
          console.log('📦 直接使用 modular_data 路径')
        }
        
        // 遍历 modular_data 中的每个模块
        for (const [moduleKey, moduleInfo] of Object.entries(modularData)) {
          if (moduleInfo && typeof moduleInfo === 'object') {
            console.log(`📦 处理模块 [${moduleKey}]:`, moduleInfo)
            
            // 检查新的数据格式：moduleInfo.value 包含实际数据
            if (moduleInfo.value && typeof moduleInfo.value === 'object') {
              console.log(`✅ 模块 [${moduleKey}] 数据:`, moduleInfo.value)
              organizedData[moduleKey] = moduleInfo.value
            } else if (typeof moduleInfo === 'object' && !moduleInfo.value) {
              // 回退：直接使用 moduleInfo（旧格式兼容）
              console.log(`⚠️ 模块 [${moduleKey}] 使用直接格式:`, moduleInfo)
              organizedData[moduleKey] = moduleInfo
            }
          }
        }
        
        console.log('✅ 从 modular_data 提取完成，生成模块:', Object.keys(organizedData))
        return organizedData
      }
      
        // 如果没有 modular_data，检查是否有任何有效的提取数据
        console.log('🔄 未找到 modular_data，检查是否有有效的提取数据...')
        
        // 检查所有字段是否都是元数据（doc_type, document_title 等）
        const metadataFields = ['doc_type', 'document_title', 'doc_type_display']
        const dataKeys = Object.keys(backendData)
        const hasOnlyMetadata = dataKeys.every(key => metadataFields.includes(key))
        
        console.log('🔍 元数据检查:', {
          dataKeys: dataKeys,
          metadataFields: metadataFields,
          hasOnlyMetadata: hasOnlyMetadata
        })
        
        if (hasOnlyMetadata) {
          console.log('⚠️ 检测到只有元数据，没有提取的业务字段')
          
          // 创建一个提示模块
          organizedData['提取状态'] = {
            '数据提取状态': '此记录可能没有完整的字段提取数据',
            '可用信息': '文档基本信息和元数据',
            '建议操作': '如需查看完整提取结果，请重新处理此文档'
          }
          
          // 仍然保留元数据信息
          for (const [fieldKey, fieldValue] of Object.entries(backendData)) {
            let actualValue = fieldValue
            
            // 处理嵌套结构
            if (fieldValue && typeof fieldValue === 'object') {
              if (fieldValue['提取内容'] && fieldValue['提取内容'].value !== undefined) {
                actualValue = fieldValue['提取内容'].value
              } else if (fieldValue.value !== undefined) {
                actualValue = fieldValue.value
              }
            }
            
            if (!organizedData['文档信息']) {
              organizedData['文档信息'] = {}
            }
            
            // 美化字段名
            const fieldNameMap = {
              'doc_type': '文档类型',
              'document_title': '文档标题', 
              'doc_type_display': '文档类型显示'
            }
            
            const displayName = fieldNameMap[fieldKey] || fieldKey
            organizedData['文档信息'][displayName] = actualValue
            console.log(`📋 元数据字段 [${displayName}]: ${actualValue}`)
          }
          
          console.log('🎯 元数据整理完成，生成模块:', Object.keys(organizedData))
          return organizedData
        }
        
        // 如果有其他数据，使用原来的逻辑
        console.log('🔄 使用回退处理逻辑...')
        
        const moduleMap = {
          '基金托管人信息': ['基金托管人名称', '基金托管人办公地址', '基金托管人邮政编码', '基金托管人法定代表人', '基金托管人组织形式', '基金托管人存续期间'],
          '基金管理人信息': ['基金管理人名称', '基金管理人办公地址', '基金管理人邮政编码', '基金管理人法定代表人', '基金管理人组织形式', '基金管理人存续期间'],
          '基金基本信息': ['基金名称', '基金类型', '基金代码', '基金简称', '文档标题'],
          '基金费用': ['基金的托管费', '基金的管理费', 'A类基金的销售服务费', 'C类基金的销售服务费', 'E类基金的销售服务费', '不列入基金费用的项目'],
          '协议和备案信息': ['托管协议的保密'],
          '基金资产分配信息': ['基金收益分配方式', '基金资产估值对象', '实施回购机制期间的收益分配']
        }
        
        // 遍历所有字段，分配到对应模块
        for (const [fieldKey, fieldValue] of Object.entries(backendData)) {
          let assigned = false
          
          // 如果字段值有嵌套的 value 结构，提取实际值
          let actualValue = fieldValue
          if (fieldValue && typeof fieldValue === 'object') {
            if (fieldValue['提取内容'] && fieldValue['提取内容'].value !== undefined) {
              actualValue = fieldValue['提取内容'].value
            } else if (fieldValue.value !== undefined) {
              actualValue = fieldValue.value
            }
          }
          
          // 根据字段名找到对应模块
          for (const [moduleName, moduleFields] of Object.entries(moduleMap)) {
            if (moduleFields.includes(fieldKey)) {
              if (!organizedData[moduleName]) {
                organizedData[moduleName] = {}
              }
              organizedData[moduleName][fieldKey] = actualValue
              assigned = true
              console.log(`✅ 字段 [${fieldKey}] 分配到模块 [${moduleName}]`)
              break
            }
          }
          
          // 如果没有找到对应模块，分配到"其他信息"
          if (!assigned && fieldKey !== 'modular_data') {
            if (!organizedData['其他信息']) {
              organizedData['其他信息'] = {}
            }
            organizedData['其他信息'][fieldKey] = actualValue
            console.log(`ℹ️ 字段 [${fieldKey}] 分配到模块 [其他信息]`)
          }
        }
        
        console.log('🎯 重新组织完成，生成模块:', Object.keys(organizedData))
        return organizedData
    },
    
    // 获取模块图标
    getModuleIcon(moduleKey) {
      const moduleIcons = {
        '基金基本信息': '📊',
        '基金份额的发售与认购': '💰',
        '基金合同当事人': '👥',
        '基金运营与投资': '📈',
        '基金财产与估值': '💎',
        '基金收益与分配': '💵',
        '基金费用与税收': '💸',
        '基金管理人信息': '🏢',
        '基金托管人信息': '🏦',
        '协议依据与约定事项': '📋',
        '基金资产估值与收益分配': '💰',
        '基金费用': '💸',
        '基金募集与发售安排': '🚀',
        '基金运作与估值': '⚙️',
        '其他信息': '📄',
        '提取状态': '⚠️',
        '文档信息': '📋'
      }
      return moduleIcons[moduleKey] || '📄'
    },
    
    // 判断是否为费用模块
    isFeeModule(moduleKey) {
      const feeModules = ['基金费用与税收', '基金费用']
      return feeModules.includes(moduleKey)
    },
    
    // 判断是否为全宽字段
    isFullWidthField(fieldKey) {
      const fullWidthFields = [
        '投资目标', '投资范围', '投资策略', '风险收益特征',
        '订立托管协议的依据', '基金资产估值对象', '基金收益分配方式',
        '实施侧袋机制期间的收益分配', '不列入基金费用的项目', '税收说明'
      ]
      return fullWidthFields.includes(fieldKey)
    },
    
    // 判断是否为费率字段
    isFeeRateField(fieldKey) {
      const feeRateFields = [
        '管理费率', '托管费率', '销售服务费率', '认购费用', '申购费用', '赎回费用',
        '基金的托管费', '基金的管理费', 'A类基金的销售服务费', 'C类基金的销售服务费', 
        'E类基金的销售服务费', '申购费率', '赎回费率', '基金销售服务费', '基金托管人的托管费'
      ]
      return feeRateFields.includes(fieldKey)
    },
    
    // 获取字段统计信息（格式：10/20）
    getFieldsStatistic() {
      // 如果没有文档类型或数据，返回0/0
      if (!this.documentType || Object.keys(this.rawExtractedData).length === 0) {
        return '0/0'
      }
      
      // 根据文档类型获取固定的总字段数
      const fixedTotalFields = this.getFixedTotalFields()
      
      // 始终从实际数据计算已提取字段数，确保准确性
      const extractedFields = this.countExtractedFields()
      
      console.log('📊 字段统计计算:', {
        extractedFields: extractedFields,
        fixedTotalFields: fixedTotalFields,
        extractionSummaryValue: this.extractionSummary.extractedFields,
        actualCalculated: extractedFields
      })
      
      return `${extractedFields}/${fixedTotalFields}`
    },
    
    // 根据文档类型获取固定的总字段数
    getFixedTotalFields() {
      switch (this.documentType) {
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
    
    // 获取成功率
    getSuccessRate() {
      // 如果没有文档类型或数据，返回0
      if (!this.documentType || Object.keys(this.rawExtractedData).length === 0) {
        return 0
      }
      
      // 使用固定的总字段数
      const fixedTotalFields = this.getFixedTotalFields()
      
      // 始终从实际数据计算已提取字段数，确保准确性
      const extractedFields = this.countExtractedFields()
      
      return fixedTotalFields > 0 ? Math.round((extractedFields / fixedTotalFields) * 100) : 0
    },
    
    // 统计总字段数
    countTotalFields() {
      let total = 0
      for (const moduleKey in this.rawExtractedData) {
        const module = this.rawExtractedData[moduleKey]
        if (module && typeof module === 'object') {
          total += Object.keys(module).length
        }
      }
      return total
    },
    
    // 统计有效提取字段数（排除"未识别"、"未披露"等无效值）
    countExtractedFields() {
      let extracted = 0
      
      console.log('🔢 开始计算有效提取字段数...')
      
      for (const moduleKey in this.rawExtractedData) {
        const module = this.rawExtractedData[moduleKey]
        if (module && typeof module === 'object') {
          console.log(`📦 计算模块 [${moduleKey}] 字段数:`, Object.keys(module))
          
          for (const fieldKey in module) {
            const field = module[fieldKey]
            
            // 新格式：字段值是字符串，检查是否为有效提取值
            if (typeof field === 'string') {
              // 排除"未识别"、"未披露"、"未设置"等无效值
              if (field && 
                  field !== '未识别' && 
                  field !== '未披露' && 
                  field !== '未设置' && 
                  field !== '未提取' && 
                  field !== '未找到' && 
                  field !== '无' && 
                  field !== '不适用' && 
                  field.trim() !== '') {
                extracted++
                console.log(`  ✅ 字段 [${fieldKey}]: ${field} (有效提取，计入统计)`)
              } else {
                console.log(`  ❌ 字段 [${fieldKey}]: ${field} (无效值，不计入统计)`)
              }
            } else if (!this.isNotDisclosed(field)) {
              // 兼容旧格式
              extracted++
              console.log(`  ✅ 字段 [${fieldKey}]: 复杂对象 (计入统计)`)
            } else {
              console.log(`  ❌ 字段 [${fieldKey}]: 被标记为未披露 (不计入统计)`)
            }
          }
        }
      }
      
      console.log('🔢 有效提取字段总数:', extracted)
      return extracted
    },
    
    // 判断字段是否为"未披露"状态（注意："未识别"字段应该正常显示，不算未披露）
    isNotDisclosed(field) {
      const value = this.getFieldDisplayValue(field)
      // "未识别"不算未披露，应该正常显示，只有真正的未披露值才算
      const invalidValues = ['未披露', '未提取', '未找到', '无', '不适用', '']
      
      if (!value || value === null || value === undefined) {
        return true
      }
      
      return invalidValues.includes(value.toString().trim())
    },
    
    // 显示空白状态
    showEmptyState() {
      console.log('🔄 设置空白状态')
      
      // 清空所有数据
      this.rawExtractedData = {}
      this.taskId = null
      this.documentType = ''
      
      // 设置空的提取摘要
      this.extractionSummary = {
        totalFields: 0,
        extractedFields: 0,
        processingTime: 0,
        documentType: ''
      }
      
      // 重置统计信息
      this.extractedFieldsCount = 0
      this.processingTime = 0
      
      // 清空文档类型相关数据
      this.custodyData = {}
      this.contractData = {}
      this.prospectusData = {}
      
      console.log('✅ 空白状态设置完成')
    },
    
    // 加载存储的提取结果
    loadStoredResults(storedResults) {
      console.log('🔍 处理存储的提取结果:', storedResults)
      
      try {
        // 更新基本信息
        this.taskId = storedResults.id
        this.extractedFieldsCount = storedResults.extractionSummary?.extractedFields || 0
        this.processingTime = storedResults.processingTime || 0
        
        // 更新提取统计信息
        this.extractionSummary = {
          totalFields: storedResults.extractionSummary?.totalFields || 0,
          extractedFields: storedResults.extractionSummary?.extractedFields || 0,
          documentType: storedResults.extractionSummary?.documentType || 'unknown',
          processingTime: storedResults.processingTime || 0
        }
        
        // 保存原始提取数据（模块化结构）
        let extractedData = storedResults.extractedData || {}
        
        // 🔧 处理后端数据结构转换
        console.log('📋 原始后端数据:', extractedData)
        
        // 如果数据直接是字段结构，需要按模块分组
        if (extractedData && typeof extractedData === 'object') {
          // 检查是否已经是模块化格式（包含中文模块名）
          const hasChineseModules = Object.keys(extractedData).some(key => 
            /[\u4e00-\u9fa5]/.test(key) && key.includes('信息')
          )
          
          if (!hasChineseModules) {
            console.log('🔄 检测到非模块化数据，尝试重新组织...')
            
            // 如果是平铺的字段数据，按字段名分组到模块
            const organizedData = this.organizeFieldsIntoModules(extractedData)
            this.rawExtractedData = organizedData
            console.log('📦 重新组织后的模块数据:', this.rawExtractedData)
          } else {
            console.log('✅ 检测到已模块化的数据结构')
            this.rawExtractedData = extractedData
          }
        } else {
          this.rawExtractedData = extractedData
        }
        
        console.log('📋 最终模块化数据:', this.rawExtractedData)
        
        // 🔍 调试：打印每个模块的具体数据结构
        console.log('🔍 详细数据结构调试:')
        console.log('🔍 rawExtractedData 完整结构:', JSON.stringify(this.rawExtractedData, null, 2))
        console.log('🔍 rawExtractedData 类型:', typeof this.rawExtractedData)
        console.log('🔍 rawExtractedData 键值:', Object.keys(this.rawExtractedData))
        
        for (const moduleKey in this.rawExtractedData) {
          console.log(`📦 模块 [${moduleKey}]:`, this.rawExtractedData[moduleKey])
          console.log(`📦 模块 [${moduleKey}] 类型:`, typeof this.rawExtractedData[moduleKey])
          
          const module = this.rawExtractedData[moduleKey]
          if (module && typeof module === 'object') {
            console.log(`📦 模块 [${moduleKey}] 的键:`, Object.keys(module))
            
            for (const fieldKey in module) {
              const field = module[fieldKey]
              console.log(`  🏷️ 字段 [${fieldKey}]:`, {
                原始数据: field,
                类型: typeof field,
                显示值: this.getFieldDisplayValue(field)
              })
            }
          } else {
            console.warn(`⚠️ 模块 [${moduleKey}] 不是对象或为空:`, module)
          }
        }
        
        // 确定文档类型
        const docType = storedResults.extractionSummary?.documentType || storedResults.documentType
        console.log('🔍 检测到的文档类型:', docType)
        
        if (docType) {
          // 优先匹配英文标识符
          if (docType === 'fund_contract' || docType.includes('基金合同')) {
            this.documentType = 'fund_contract'
          } else if (docType === 'custody_agreement' || docType.includes('托管协议')) {
            this.documentType = 'custody_agreement'
          } else if (docType === 'prospectus' || docType.includes('招募说明书')) {
            this.documentType = 'prospectus'
          } else {
            // 如果没有匹配到，保持原来的值或使用传入的值
            this.documentType = docType
          }
        }
        
        console.log('✅ 最终设置的文档类型:', this.documentType)
        
        console.log('✅ 提取结果加载完成')
        
      } catch (error) {
        console.error('❌ 处理存储结果失败:', error)
        uni.showToast({
          title: '数据处理失败',
          icon: 'none'
        })
      } finally {
        this.isLoading = false
      }
    }
  },
  
  onLoad(options) {
    // 检查用户是否已登录，未登录则跳转到登录页
    if (!checkAuthAndRedirect()) {
      return
    }
    
    // 优先尝试从本地存储获取完整的提取结果
    const storedResults = uni.getStorageSync('currentExtractionResults')
    if (storedResults) {
      console.log('📥 从本地存储加载提取结果:', storedResults)
      this.loadStoredResults(storedResults)
      // 使用后清除存储
      uni.removeStorageSync('currentExtractionResults')
      return
    }
    
    // 如果没有存储的结果，尝试获取任务ID
    let hasTaskId = false
    if (options?.taskId) {
      this.taskId = options.taskId
      hasTaskId = true
    } else {
      const storedTaskId = uni.getStorageSync('currentTaskId')
      if (storedTaskId) {
        this.taskId = storedTaskId
        uni.removeStorageSync('currentTaskId')
        hasTaskId = true
      }
    }
    
    // 只有当有taskId时才加载提取结果，否则显示空白状态
    if (hasTaskId) {
      console.log('📡 通过taskId加载提取结果:', this.taskId)
      this.loadExtractionResults()
    } else {
      console.log('📝 没有提取结果数据，显示空白状态')
      this.showEmptyState()
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
  flex-wrap: wrap;
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

.main-info-section, .module-section {
  margin-bottom: 40rpx;
}

.module-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 30rpx;
}

.module-section .section-title {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15rpx;
  padding: 20rpx;
  margin: -30rpx -30rpx 30rpx -30rpx;
}

.module-section .title-text {
  color: #ffffff;
  font-size: 30rpx;
}

.info-grid, .details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.details-grid .detail-item.long,
.details-grid .detail-item.full {
  grid-column: 1 / -1;
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

.confidence-indicator {
  margin-top: 8rpx;
}

.confidence-text {
  font-size: 20rpx;
  color: #999999;
  background: #f5f5f5;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  display: inline-block;
}

.detail-value.not-disclosed {
  color: #999999;
  font-style: italic;
  opacity: 0.7;
}

.not-disclosed-indicator {
  margin-top: 8rpx;
}

.not-disclosed-text {
  font-size: 20rpx;
  color: #ff6b6b;
  background: #ffe0e0;
  padding: 4rpx 8rpx;
  border-radius: 4rpx;
  display: inline-block;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.no-fee {
  color: #28a745 !important;
  font-weight: bold;
}

.no-fee-indicator {
  width: 100%;
  height: 8rpx;
  background: #e9ecef;
  border-radius: 4rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.no-fee-text {
  position: absolute;
  font-size: 22rpx;
  color: #28a745;
  font-weight: bold;
  background: #ffffff;
  padding: 0 10rpx;
  border-radius: 4rpx;
  top: -15rpx;
}

.fee-details {
  margin-top: 30rpx;
  padding-top: 30rpx;
  border-top: 1rpx solid #f0f0f0;
}

.fee-detail-item {
  background: #f8f9fa;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 15rpx;
}

.fee-detail-item:last-child {
  margin-bottom: 0;
}

.fee-detail-label {
  display: block;
  font-size: 24rpx;
  color: #666666;
  margin-bottom: 10rpx;
  font-weight: bold;
}

.fee-detail-value {
  display: block;
  font-size: 26rpx;
  color: #333333;
  line-height: 1.6;
}





.btn-text {
  color: inherit;
}

</style> 