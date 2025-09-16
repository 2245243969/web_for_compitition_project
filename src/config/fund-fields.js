// 基金公告字段配置文件

// 基金合同字段配置
export const FUND_CONTRACT_FIELDS = {
    // 模块1：基金基本信息
    FUND_BASIC_INFO: [
        { key: 'documentTitle', label: '文档标题', module: 'basic' },
        { key: 'fundName', label: '基金名称', module: 'basic' },
        { key: 'fundCode', label: '基金代码', module: 'basic' },
        { key: 'fundCategory', label: '基金类别', module: 'basic' },
        { key: 'operationMode', label: '运作方式', module: 'basic' },
        { key: 'investmentTarget', label: '投资目标', module: 'basic' },
        { key: 'investmentScope', label: '投资范围', module: 'basic' },
        { key: 'fundShareValue', label: '基金份额面值', module: 'basic' },
        { key: 'contractEffectiveDate', label: '基金合同生效日', module: 'basic' },
        { key: 'duration', label: '存续期', module: 'basic' },
        { key: 'lockupPeriod', label: '锁定持有期', module: 'basic' }
    ],

    // 模块2：基金份额的发售与认购
    FUND_OFFERING: [
        { key: 'fundraisingApprovalNumber', label: '募集申请核准文号', module: 'offering' },
        { key: 'fundraisingStartDate', label: '募集开始日', module: 'offering' },
        { key: 'fundraisingEndDate', label: '募集结束日', module: 'offering' },
        { key: 'minimumFundraisingShares', label: '最低募集份额总数', module: 'offering' },
        { key: 'minimumFundraisingAmount', label: '最低募集金额', module: 'offering' },
        { key: 'offeringTime', label: '发售时间', module: 'offering' },
        { key: 'offeringMethod', label: '发售方式', module: 'offering' },
        { key: 'offeringTarget', label: '发售对象', module: 'offering' },
        { key: 'subscriptionFee', label: '认购费用', module: 'offering' },
        { key: 'purchaseFee', label: '申购费用', module: 'offering' },
        { key: 'redemptionFee', label: '赎回费用', module: 'offering' }
    ],

    // 模块3：基金合同当事人
    FUND_PARTIES: [
        { key: 'fundManagerName', label: '基金管理人名称', module: 'parties' },
        { key: 'fundManagerLegalRepresentative', label: '基金管理人法定代表人', module: 'parties' },
        { key: 'fundTrusteeName', label: '基金托管人名称', module: 'parties' },
        { key: 'fundTrusteeLegalRepresentative', label: '基金托管人法定代表人', module: 'parties' },
        { key: 'registrationInstitution', label: '登记机构', module: 'parties' }
    ],

    // 模块4：基金运营与投资
    FUND_OPERATION: [
        { key: 'fundManager', label: '基金经理', module: 'operation' },
        { key: 'investmentStrategy', label: '投资策略', module: 'operation' },
        { key: 'investmentRatioLimits', label: '投资比例限制', module: 'operation' },
        { key: 'riskReturnCharacteristics', label: '风险收益特征', module: 'operation' }
    ],

    // 模块5：基金财产与估值
    FUND_ASSETS: [
        { key: 'fundAssetComposition', label: '基金财产构成', module: 'assets' },
        { key: 'fundAssetValuationMethod', label: '基金资产估值方法', module: 'assets' },
        { key: 'fundNetAssetValueCalculation', label: '基金资产净值计算方法', module: 'assets' },
        { key: 'valuationDate', label: '估值日', module: 'assets' },
        { key: 'announcementFrequency', label: '公告频率', module: 'assets' }
    ],

    // 模块6：基金收益与分配
    FUND_DISTRIBUTION: [
        { key: 'incomeSource', label: '收益来源', module: 'distribution' },
        { key: 'distributionPrinciple', label: '分配原则', module: 'distribution' },
        { key: 'distributionFrequency', label: '分配频率', module: 'distribution' }
    ],

    // 模块7：基金费用与税收
    FUND_FEES: [
        { key: 'managementFeeRate', label: '管理费率', module: 'fees' },
        { key: 'custodyFeeRate', label: '托管费率', module: 'fees' },
        { key: 'salesServiceFeeRate', label: '销售服务费率', module: 'fees' },
        { key: 'otherFees', label: '其他费用', module: 'fees' },
        { key: 'taxExplanation', label: '税收说明', module: 'fees' }
    ]
}

// 获取基金合同所有字段
export function getAllContractFields() {
    return [
        ...FUND_CONTRACT_FIELDS.FUND_BASIC_INFO,
        ...FUND_CONTRACT_FIELDS.FUND_OFFERING,
        ...FUND_CONTRACT_FIELDS.FUND_PARTIES,
        ...FUND_CONTRACT_FIELDS.FUND_OPERATION,
        ...FUND_CONTRACT_FIELDS.FUND_ASSETS,
        ...FUND_CONTRACT_FIELDS.FUND_DISTRIBUTION,
        ...FUND_CONTRACT_FIELDS.FUND_FEES
    ]
}

// 获取托管协议所有字段
export function getAllCustodyFields() {
    return [
        ...CUSTODY_AGREEMENT_FIELDS.CUSTODY_MANAGER,
        ...CUSTODY_AGREEMENT_FIELDS.CUSTODY_CUSTODIAN,
        ...CUSTODY_AGREEMENT_FIELDS.CUSTODY_BASIS,
        ...CUSTODY_AGREEMENT_FIELDS.CUSTODY_VALUATION,
        ...CUSTODY_AGREEMENT_FIELDS.CUSTODY_FEES
    ]
}

// 获取招募说明书所有字段
export function getAllProspectusFields() {
    return [
        ...PROSPECTUS_FIELDS.PROSPECTUS_MANAGER,
        ...PROSPECTUS_FIELDS.PROSPECTUS_CUSTODIAN,
        ...PROSPECTUS_FIELDS.PROSPECTUS_OFFERING,
        ...PROSPECTUS_FIELDS.PROSPECTUS_OPERATION,
        ...PROSPECTUS_FIELDS.PROSPECTUS_FEES
    ]
}

// 托管协议字段配置
export const CUSTODY_AGREEMENT_FIELDS = {
    // 模块1：基金管理人信息
    CUSTODY_MANAGER: [
        { key: 'fundManagerName', label: '基金管理人名称', module: 'manager' },
        { key: 'fundManagerOfficeAddress', label: '基金管理人办公地址', module: 'manager' },
        { key: 'fundManagerPostalCode', label: '基金管理人邮政编码', module: 'manager' },
        { key: 'fundManagerLegalRepresentative', label: '基金管理人法定代表人', module: 'manager' },
        { key: 'fundManagerDuration', label: '基金管理人存续期间', module: 'manager' },
        { key: 'fundManagerOrganizationForm', label: '基金管理人组织形式', module: 'manager' }
    ],

    // 模块2：基金托管人信息
    CUSTODY_CUSTODIAN: [
        { key: 'fundCustodianName', label: '基金托管人名称', module: 'custodian' },
        { key: 'fundCustodianOfficeAddress', label: '基金托管人办公地址', module: 'custodian' },
        { key: 'fundCustodianPostalCode', label: '基金托管人邮政编码', module: 'custodian' },
        { key: 'fundCustodianLegalRepresentative', label: '基金托管人法定代表人', module: 'custodian' },
        { key: 'fundCustodianDuration', label: '基金托管人存续期间', module: 'custodian' },
        { key: 'fundCustodianOrganizationForm', label: '基金托管人组织形式', module: 'custodian' }
    ],

    // 模块3：协议依据与约定事项
    CUSTODY_BASIS: [
        { key: 'custodyAgreementBasis', label: '订立托管协议的依据', module: 'basis' }
    ],

    // 模块4：基金资产估值与收益分配
    CUSTODY_VALUATION: [
        { key: 'fundAssetValuationObject', label: '基金资产估值对象', module: 'valuation' },
        { key: 'fundIncomeDistributionMethod', label: '基金收益分配方式', module: 'valuation' },
        { key: 'sidePocketIncomeDistribution', label: '实施侧袋机制期间的收益分配', module: 'valuation' }
    ],

    // 模块5：基金费用
    CUSTODY_FEES: [
        { key: 'fundCustodyFee', label: '基金的托管费', module: 'fees' },
        { key: 'fundManagementFee', label: '基金的管理费', module: 'fees' },
        { key: 'classAServiceFee', label: 'A类基金的销售服务费', module: 'fees' },
        { key: 'classCServiceFee', label: 'C类基金的销售服务费', module: 'fees' },
        { key: 'classEServiceFee', label: 'E类基金的销售服务费', module: 'fees' },
        { key: 'excludedFeeItems', label: '不列入基金费用的项目', module: 'fees' }
    ]
}

// 招募说明书字段配置
export const PROSPECTUS_FIELDS = {
    // 模块1：基金管理人信息
    PROSPECTUS_MANAGER: [
        { key: 'fundManagerName', label: '基金管理人名称', module: 'manager' },
        { key: 'fundManagerOfficeAddress', label: '基金管理人办公地址', module: 'manager' },
        { key: 'fundManagerLegalRepresentative', label: '基金管理人法定代表人', module: 'manager' },
        { key: 'fundManagerContact', label: '基金管理人联系人', module: 'manager' },
        { key: 'fundManagerCustomerServicePhone', label: '基金管理人客服服务电话', module: 'manager' },
        { key: 'fundManagerFax', label: '基金管理人传真', module: 'manager' }
    ],

    // 模块2：基金托管人信息
    PROSPECTUS_CUSTODIAN: [
        { key: 'fundCustodianName', label: '基金托管人名称', module: 'custodian' },
        { key: 'fundCustodianOfficeAddress', label: '基金托管人办公地址', module: 'custodian' },
        { key: 'fundCustodianLegalRepresentative', label: '基金托管人法定代表人', module: 'custodian' }
    ],

    // 模块3：基金募集与发售安排
    PROSPECTUS_OFFERING: [
        { key: 'fundraisingBasis', label: '基金募集依据', module: 'offering' },
        { key: 'fundraisingPeriod', label: '基金募集期限', module: 'offering' },
        { key: 'offeringTime', label: '基金发售时间', module: 'offering' },
        { key: 'subscriptionTime', label: '认购时间', module: 'offering' },
        { key: 'offeringParValue', label: '基金发售面值', module: 'offering' },
        { key: 'purchaseOpenDate', label: '申购开放日及开放时间', module: 'offering' },
        { key: 'redemptionOpenDate', label: '赎回开放日及开放时间', module: 'offering' }
    ],

    // 模块4：基金运作与估值
    PROSPECTUS_OPERATION: [
        { key: 'fundAssetValuationDate', label: '基金资产的估值日', module: 'operation' },
        { key: 'fundAssetValuationObject', label: '基金资产的估值对象', module: 'operation' }
    ],

    // 模块5：基金费用
    PROSPECTUS_FEES: [
        { key: 'custodianCustodyFee', label: '基金托管人的托管费', module: 'fees' },
        { key: 'fundSalesServiceFee', label: '基金销售服务费', module: 'fees' },
        { key: 'subscriptionFeeRate', label: '申购费率', module: 'fees' },
        { key: 'redemptionFeeRate', label: '赎回费率', module: 'fees' }
    ]
}

// 文档类型配置
export function getDocumentTypesConfig() {
    return {
        FUND_CONTRACT: {
            key: 'fund_contract',
            label: '基金合同',
            fields: getAllContractFields(),
            description: '基金合同相关文档'
        },
        CUSTODY_AGREEMENT: {
            key: 'custody_agreement',
            label: '托管协议',
            fields: getAllCustodyFields(),
            description: '基金托管协议文档'
        },
        PROSPECTUS: {
            key: 'prospectus',
            label: '招募说明书',
            fields: getAllProspectusFields(),
            description: '基金招募说明书文档'
        }
    }
}

// 兼容性：保持原有的 DOCUMENT_TYPES 导出
export const DOCUMENT_TYPES = getDocumentTypesConfig()

// 获取文档类型列表
export function getDocumentTypes() {
    return Object.values(DOCUMENT_TYPES)
}

// 根据文档类型获取字段配置
export function getFieldsByDocumentType(documentType) {
    const docType = Object.values(DOCUMENT_TYPES).find(type => type.key === documentType)
    return docType ? docType.fields : []
}

// 根据模块获取字段
export function getFieldsByModule(documentType, module) {
    const fields = getFieldsByDocumentType(documentType)
    return fields.filter(field => field.module === module)
}
