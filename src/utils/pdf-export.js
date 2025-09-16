// PDF导出工具模块
import { exportFundFieldsPdfApi } from './api.js'
import { getCurrentUser } from './auth.js'

/**
 * 文档类型映射到API所需的格式
 */
const DOCUMENT_TYPE_MAPPING = {
    'fund_contract': 'FUND_CONTRACT',
    'custody_agreement': 'CUSTODY_AGREEMENT',
    'prospectus': 'PROSPECTUS'
}

/**
 * 验证字段数据结构
 * @param {Object} fieldsData 字段数据
 * @param {string} documentType 文档类型
 * @returns {Object} 验证结果
 */
export function validateFieldsData(fieldsData, documentType) {
    const requiredModules = {
        'FUND_CONTRACT': [
            '基金基本信息', '基金份额的发售与认购', '基金合同当事人',
            '基金运营与投资', '基金财产与估值', '基金收益与分配', '基金费用与税收'
        ],
        'CUSTODY_AGREEMENT': [
            '基金管理人信息', '基金托管人信息', '协议依据与约定事项',
            '基金资产估值与收益分配', '基金费用'
        ],
        'PROSPECTUS': [
            '基金管理人信息', '基金托管人信息', '基金募集与发售安排',
            '基金运作与估值', '基金费用'
        ]
    }

    const modules = requiredModules[documentType]
    if (!modules) {
        return { valid: false, error: '不支持的文档类型' }
    }

    for (const module of modules) {
        if (!fieldsData[module]) {
            return { valid: false, error: `缺少模块: ${module}` }
        }
    }

    return { valid: true }
}

/**
 * 转换提取数据为API所需格式
 * @param {Object} extractedData 提取的数据
 * @param {string} documentType 文档类型
 * @returns {Object} 转换后的字段数据
 */
export function convertExtractedDataToFields(extractedData, documentType) {
    const apiDocumentType = DOCUMENT_TYPE_MAPPING[documentType]

    if (apiDocumentType === 'CUSTODY_AGREEMENT') {
        return {
            "基金管理人信息": {
                "基金管理人名称": extractedData.fundManagerName || '',
                "基金管理人办公地址": extractedData.fundManagerOfficeAddress || '',
                "基金管理人邮政编码": extractedData.fundManagerPostalCode || '',
                "基金管理人法定代表人": extractedData.fundManagerLegalRepresentative || '',
                "基金管理人存续期间": extractedData.fundManagerDuration || '',
                "基金管理人组织形式": extractedData.fundManagerOrganizationForm || ''
            },
            "基金托管人信息": {
                "基金托管人名称": extractedData.fundCustodianName || '',
                "基金托管人办公地址": extractedData.fundCustodianOfficeAddress || '',
                "基金托管人邮政编码": extractedData.fundCustodianPostalCode || '',
                "基金托管人法定代表人": extractedData.fundCustodianLegalRepresentative || '',
                "基金托管人存续期间": extractedData.fundCustodianDuration || '',
                "基金托管人组织形式": extractedData.fundCustodianOrganizationForm || ''
            },
            "协议依据与约定事项": {
                "订立托管协议的依据": extractedData.custodyAgreementBasis || ''
            },
            "基金资产估值与收益分配": {
                "基金资产估值对象": extractedData.fundAssetValuationObject || '',
                "基金收益分配方式": extractedData.fundIncomeDistributionMethod || '',
                "实施侧袋机制期间的收益分配": extractedData.sidePocketIncomeDistribution || ''
            },
            "基金费用": {
                "基金的托管费": extractedData.fundCustodyFee || '',
                "基金的管理费": extractedData.fundManagementFee || '',
                "A类基金的销售服务费": extractedData.classAServiceFee || '',
                "C类基金的销售服务费": extractedData.classCServiceFee || '',
                "E类基金的销售服务费": extractedData.classEServiceFee || '',
                "不列入基金费用的项目": extractedData.excludedFeeItems || ''
            }
        }
    } else if (apiDocumentType === 'PROSPECTUS') {
        return {
            "基金管理人信息": {
                "基金管理人名称": extractedData.fundManagerName || '',
                "基金管理人办公地址": extractedData.fundManagerOfficeAddress || '',
                "基金管理人法定代表人": extractedData.fundManagerLegalRepresentative || '',
                "基金管理人联系人": extractedData.fundManagerContact || '',
                "基金管理人客服服务电话": extractedData.fundManagerCustomerServicePhone || '',
                "基金管理人传真": extractedData.fundManagerFax || ''
            },
            "基金托管人信息": {
                "基金托管人名称": extractedData.fundCustodianName || '',
                "基金托管人办公地址": extractedData.fundCustodianOfficeAddress || '',
                "基金托管人法定代表人": extractedData.fundCustodianLegalRepresentative || ''
            },
            "基金募集与发售安排": {
                "基金募集依据": extractedData.fundraisingBasis || '',
                "基金募集期限": extractedData.fundraisingPeriod || '',
                "基金发售时间": extractedData.offeringTime || '',
                "认购时间": extractedData.subscriptionTime || '',
                "基金发售面值": extractedData.offeringParValue || '',
                "申购开放日及开放时间": extractedData.purchaseOpenDate || '',
                "赎回开放日及开放时间": extractedData.redemptionOpenDate || ''
            },
            "基金运作与估值": {
                "基金资产的估值日": extractedData.fundAssetValuationDate || '',
                "基金资产的估值对象": extractedData.fundAssetValuationObject || ''
            },
            "基金费用": {
                "基金托管人的托管费": extractedData.custodianCustodyFee || '',
                "基金销售服务费": extractedData.fundSalesServiceFee || '',
                "申购费率": extractedData.subscriptionFeeRate || '',
                "赎回费率": extractedData.redemptionFeeRate || ''
            }
        }
    } else if (apiDocumentType === 'FUND_CONTRACT') {
        // 基金合同字段映射（根据需要可以扩展）
        return {
            "基金基本信息": {
                "文档标题": extractedData.documentTitle || '',
                "基金名称": extractedData.fundName || '',
                "基金代码": extractedData.fundCode || '',
                "基金类别": extractedData.fundCategory || '',
                "运作方式": extractedData.operationMode || '',
                "投资目标": extractedData.investmentTarget || '',
                "投资范围": extractedData.investmentScope || '',
                "基金份额面值": extractedData.fundShareValue || '',
                "基金合同生效日": extractedData.contractEffectiveDate || '',
                "存续期": extractedData.duration || '',
                "锁定持有期": extractedData.lockupPeriod || ''
            },
            "基金份额的发售与认购": {
                "募集申请核准文号": extractedData.fundraisingApprovalNumber || '',
                "募集开始日": extractedData.fundraisingStartDate || '',
                "募集结束日": extractedData.fundraisingEndDate || '',
                "最低募集份额总数": extractedData.minimumFundraisingShares || '',
                "最低募集金额": extractedData.minimumFundraisingAmount || '',
                "发售时间": extractedData.offeringTime || '',
                "发售方式": extractedData.offeringMethod || '',
                "发售对象": extractedData.offeringTarget || '',
                "认购费用": extractedData.subscriptionFee || '',
                "申购费用": extractedData.purchaseFee || '',
                "赎回费用": extractedData.redemptionFee || ''
            },
            "基金合同当事人": {
                "基金管理人名称": extractedData.fundManagerName || '',
                "基金管理人法定代表人": extractedData.fundManagerLegalRepresentative || '',
                "基金托管人名称": extractedData.fundTrusteeName || '',
                "基金托管人法定代表人": extractedData.fundTrusteeLegalRepresentative || '',
                "登记机构": extractedData.registrationInstitution || ''
            },
            "基金运营与投资": {
                "基金经理": extractedData.fundManager || '',
                "投资策略": extractedData.investmentStrategy || '',
                "投资比例限制": extractedData.investmentRatioLimits || '',
                "风险收益特征": extractedData.riskReturnCharacteristics || ''
            },
            "基金财产与估值": {
                "基金财产构成": extractedData.fundAssetComposition || '',
                "基金资产估值方法": extractedData.fundAssetValuationMethod || '',
                "基金资产净值计算方法": extractedData.fundNetAssetValueCalculation || '',
                "估值日": extractedData.valuationDate || '',
                "公告频率": extractedData.announcementFrequency || ''
            },
            "基金收益与分配": {
                "收益来源": extractedData.incomeSource || '',
                "分配原则": extractedData.distributionPrinciple || '',
                "分配频率": extractedData.distributionFrequency || ''
            },
            "基金费用与税收": {
                "管理费率": extractedData.managementFeeRate || '',
                "托管费率": extractedData.custodyFeeRate || '',
                "销售服务费率": extractedData.salesServiceFeeRate || '',
                "其他费用": extractedData.otherFees || '',
                "税收说明": extractedData.taxExplanation || ''
            }
        }
    }

    // 默认返回空对象
    return {}
}

/**
 * 生成默认文件名
 * @param {string} documentType 文档类型
 * @param {string} fundName 基金名称
 * @returns {string} 文件名
 */
export function generateDefaultFilename(documentType, fundName = '') {
    const typeLabels = {
        'FUND_CONTRACT': '基金合同',
        'CUSTODY_AGREEMENT': '托管协议',
        'PROSPECTUS': '招募说明书'
    }

    const typeLabel = typeLabels[documentType] || '基金文档'
    const baseName = fundName ? `${fundName}_${typeLabel}` : typeLabel
    return `${baseName}_提取报告.pdf`
}

/**
 * 下载PDF文件（浏览器环境）
 * @param {Blob} blob PDF文件数据
 * @param {string} filename 文件名
 */
export function downloadPdfBlob(blob, filename) {
    try {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        console.log('✅ PDF文件下载触发成功')
        return { success: true }
    } catch (error) {
        console.error('❌ PDF文件下载失败:', error)
        return { success: false, error: error.message }
    }
}

/**
 * 导出基金字段PDF的主要函数
 * @param {Object} extractedData 提取的数据
 * @param {string} documentType 文档类型
 * @param {string} customFilename 自定义文件名
 * @returns {Promise<Object>} 导出结果
 */
export async function exportFundFieldsToPDF(extractedData, documentType, customFilename = null) {
    try {
        console.log('🚀 开始导出基金字段PDF:', { documentType, customFilename })

        // 获取用户token
        const user = getCurrentUser()
        const token = uni.getStorageSync('token') || user?.token

        if (!token) {
            throw new Error('用户未登录，无法导出PDF')
        }

        // 转换文档类型
        const apiDocumentType = DOCUMENT_TYPE_MAPPING[documentType]
        if (!apiDocumentType) {
            throw new Error(`不支持的文档类型: ${documentType}`)
        }

        // 转换字段数据
        const fieldsData = convertExtractedDataToFields(extractedData, documentType)

        // 验证字段数据
        const validation = validateFieldsData(fieldsData, apiDocumentType)
        if (!validation.valid) {
            throw new Error(`数据验证失败: ${validation.error}`)
        }

        // 生成文件名
        const filename = customFilename || generateDefaultFilename(
            apiDocumentType,
            extractedData.fundName || extractedData.fundManagerName
        )

        console.log('📋 准备导出数据:', {
            apiDocumentType,
            filename,
            moduleCount: Object.keys(fieldsData).length
        })

        // 调用后端API
        const response = await exportFundFieldsPdfApi(fieldsData, apiDocumentType, filename)

        console.log('🔍 API响应详情:', {
            hasResponse: !!response,
            responseType: typeof response,
            hasData: !!response?.data,
            success: response?.success,
            message: response?.message
        })

        // 检查响应是否成功
        if (response && response.success === true) {
            console.log('✅ PDF导出API调用成功')
            return {
                success: true,
                message: response.message || 'PDF导出成功',
                data: response.data
            }
        }

        throw new Error(response?.message || 'PDF导出失败')

    } catch (error) {
        console.error('❌ PDF导出失败:', error)

        // 显示错误提示
        if (typeof uni !== 'undefined') {
            uni.showToast({
                title: `导出失败: ${error.message}`,
                icon: 'error',
                duration: 3000
            })
        }

        return { success: false, error: error.message }
    }
}

/**
 * 导出示例数据的辅助函数
 * @param {string} documentType 文档类型
 * @returns {Object} 示例数据
 */
export function getExampleFieldsData(documentType) {
    const apiDocumentType = DOCUMENT_TYPE_MAPPING[documentType]

    if (apiDocumentType === 'CUSTODY_AGREEMENT') {
        return {
            "基金管理人信息": {
                "基金管理人名称": "示例基金管理有限公司",
                "基金管理人办公地址": "北京市西城区示例大街1号",
                "基金管理人邮政编码": "100000",
                "基金管理人法定代表人": "张三",
                "基金管理人存续期间": "持续经营",
                "基金管理人组织形式": "有限责任公司"
            },
            "基金托管人信息": {
                "基金托管人名称": "示例银行股份有限公司",
                "基金托管人办公地址": "北京市西城区示例路55号",
                "基金托管人邮政编码": "100001",
                "基金托管人法定代表人": "李四",
                "基金托管人存续期间": "持续经营",
                "基金托管人组织形式": "股份有限公司"
            },
            "协议依据与约定事项": {
                "订立托管协议的依据": "依据《中华人民共和国证券投资基金法》等法律法规订立"
            },
            "基金资产估值与收益分配": {
                "基金资产估值对象": "基金投资的各类证券及票据价值、银行存款本息等",
                "基金收益分配方式": "现金分红为主，可选择红利再投资",
                "实施侧袋机制期间的收益分配": "主袋份额的收益分配不受侧袋机制影响"
            },
            "基金费用": {
                "基金的托管费": "年费率0.25%",
                "基金的管理费": "年费率1.50%",
                "A类基金的销售服务费": "不收取销售服务费",
                "C类基金的销售服务费": "年费率0.40%",
                "E类基金的销售服务费": "年费率0.20%",
                "不列入基金费用的项目": "基金管理人和基金托管人因未履行或未完全履行义务导致的费用支出"
            }
        }
    }

    // 其他文档类型的示例数据可以在这里添加
    return {}
}

export default {
    validateFieldsData,
    convertExtractedDataToFields,
    generateDefaultFilename,
    downloadPdfBlob,
    exportFundFieldsToPDF,
    getExampleFieldsData,
    DOCUMENT_TYPE_MAPPING
}
