/**
 * API接口类型定义 - 根据后端API文档生成
 */

// ===== 基础类型定义 =====

/**
 * 统一响应格式
 */
export interface ApiResponse<T = any> {
    success: boolean;
    code: number;
    message: string;
    data?: T;
    error?: ApiError;
    meta?: ResponseMeta;
}

/**
 * 错误信息
 */
export interface ApiError {
    type: string;
    details: ErrorDetail[];
}

export interface ErrorDetail {
    field: string;
    code: string;
    message: string;
    value?: any;
}

/**
 * 响应元数据
 */
export interface ResponseMeta {
    timestamp: string;
    requestId: string;
    version: string;
}

/**
 * 分页信息
 */
export interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage?: number;
    prevPage?: number;
}

// ===== 认证相关类型 =====

/**
 * 登录请求
 */
export interface LoginRequest {
    username: string;  // 支持用户名或邮箱格式
    password: string;
    rememberMe?: boolean;
}

/**
 * 注册请求
 */
export interface RegisterRequest {
    username: string;        // 用户名，2-20字符，必须唯一
    email: string;          // 邮箱地址，必须是有效格式且唯一
    password: string;       // 密码，至少6位
    confirmPassword: string; // 确认密码，必须与password一致
}

/**
 * 用户信息
 */
export interface User {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    avatar?: string;
    phone?: string;
    company?: string;
    role: string;
    permissions: string[];
    settings: UserSettings;
    stats: UserStats;
    subscription?: UserSubscription;
    isActive: boolean;
    isEmailVerified: boolean;
    isPhoneVerified?: boolean;
    lastLoginAt?: string;
    createdAt: string;
    updatedAt?: string;
}

/**
 * 用户设置
 */
export interface UserSettings {
    language: string;
    timezone: string;
    dateFormat?: string;
    timeFormat?: string;
    emailNotifications: boolean;
    smsNotifications?: boolean;
    theme: string;
}

/**
 * 用户统计
 */
export interface UserStats {
    totalDocuments: number;
    totalExtractions: number;
    successfulExtractions?: number;
    successRate: number;
    totalProcessingTime?: number;
    averageProcessingTime?: number;
    favoriteDocumentType?: string;
}

/**
 * 用户订阅信息
 */
export interface UserSubscription {
    plan: string;
    status: string;
    expiresAt: string;
    features: string[];
}

/**
 * Token信息
 */
export interface Tokens {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    expiresAt: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
    user: User;
    tokens: Tokens;
    session?: SessionInfo;
}

/**
 * 会话信息
 */
export interface SessionInfo {
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    location?: {
        country: string;
        city: string;
    };
}

// ===== 文档处理相关类型 =====

/**
 * 文档信息
 */
export interface Document {
    id: string;
    fileName: string;
    originalName: string;
    documentType: DocumentType;
    fileSize: number;
    pageCount: number;
    mimeType: string;
    checksum: string;
    tags: string[];
    description?: string;
    folder?: string;
    status: DocumentStatus;
    metadata?: DocumentMetadata;
    urls: DocumentUrls;
    uploadedBy: UserBrief;
    uploadedAt: string;
}

/**
 * 文档类型
 */
export type DocumentType =
    | 'fund_contract'     // 基金合同
    | 'custody_agreement' // 托管协议
    | 'prospectus'        // 招募说明书
    | 'quarterly_report'  // 季度报告
    | 'annual_report'     // 年度报告
    | 'other';            // 其他

/**
 * 文档状态
 */
export type DocumentStatus =
    | 'UPLOADED'    // 已上传
    | 'PROCESSING'  // 处理中
    | 'COMPLETED'   // 已完成
    | 'FAILED'      // 失败
    | 'PENDING';    // 等待中

/**
 * 文档元数据
 */
export interface DocumentMetadata {
    pdfVersion?: string;
    title?: string;
    author?: string;
    encrypted: boolean;
    hasText: boolean;
    hasImages: boolean;
}

/**
 * 文档URL
 */
export interface DocumentUrls {
    download: string;
    preview: string;
}

/**
 * 用户简要信息
 */
export interface UserBrief {
    id: string;
    username: string;
    fullName?: string;
}

/**
 * 提取配置
 */
export interface ExtractionConfig {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl: string;
    temperature: number;
    maxTokens: number;
    timeout: number;
    maxRetries: number;
}

/**
 * 提取选项
 */
export interface ExtractionOptions {
    mode: 'full' | 'selective' | 'smart';
    fieldsToExtract?: string[];
    extractionDepth: 'basic' | 'detailed' | 'comprehensive';
    includeConfidence: boolean;
    includeSourceReferences: boolean;
    validateResults: boolean;
    outputFormat: 'structured' | 'raw';
}

/**
 * 处理选项
 */
export interface ProcessingOptions {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    async: boolean;
    webhookUrl?: string;
    notifyOnComplete: boolean;
    retainIntermediateResults: boolean;
}

/**
 * 质量设置
 */
export interface QualitySettings {
    minimumConfidence: number;
    crossValidation: boolean;
    humanReview: boolean;
    qualityCheckEnabled: boolean;
}

/**
 * 提取请求
 */
export interface ExtractionRequest {
    extractionConfig: ExtractionConfig;
    extractionOptions: ExtractionOptions;
    processingOptions: ProcessingOptions;
    qualitySettings?: QualitySettings;
}

/**
 * 任务信息
 */
export interface Task {
    id: string;
    documentId: string;
    status: TaskStatus;
    priority: string;
    estimatedDuration: number;
    progress: number;
    currentStep: string;
    currentStepProgress?: number;
    estimatedTimeRemaining?: number;
    steps: TaskStep[];
    statistics?: TaskStatistics;
    config?: any;
    createdAt: string;
    startedAt?: string;
    estimatedCompletionAt?: string;
}

/**
 * 任务状态
 */
export type TaskStatus =
    | 'PENDING'     // 等待中
    | 'PROCESSING'  // 处理中
    | 'COMPLETED'   // 已完成
    | 'FAILED'      // 失败
    | 'CANCELLED';  // 已取消

/**
 * 任务步骤
 */
export interface TaskStep {
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    estimatedDuration?: number;
    startedAt?: string;
    completedAt?: string;
    duration?: number;
    substeps?: TaskSubstep[];
}

/**
 * 任务子步骤
 */
export interface TaskSubstep {
    name: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
}

/**
 * 任务统计
 */
export interface TaskStatistics {
    fieldsProcessed: number;
    fieldsTotal: number;
    fieldsFound: number;
    fieldsNotFound: number;
    averageConfidence: number;
    processingSpeed: string;
}

/**
 * 提取结果
 */
export interface ExtractionResult {
    id: string;
    taskId: string;
    documentId: string;
    status: TaskStatus;
    extractionSummary: ExtractionSummary;
    extractedData: Record<string, Record<string, ExtractedField>>;
    notFoundFields: NotFoundField[];
    qualityMetrics: QualityMetrics;
    warnings: ResultWarning[];
    recommendations: ResultRecommendation[];
    processingDetails: ProcessingDetails;
    createdAt: string;
    completedAt: string;
}

/**
 * 提取摘要
 */
export interface ExtractionSummary {
    totalFields: number;
    extractedFields: number;
    fieldsNotFound: number;
    averageConfidence: number;
    overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
    processingTime: number;
    modelUsed: string;
    extractionMode: string;
}

/**
 * 提取的字段
 */
export interface ExtractedField {
    value: any;
    confidence: number;
    source: FieldSource;
    verified: boolean;
}

/**
 * 字段来源
 */
export interface FieldSource {
    page: number;
    coordinates: number[];
    text: string;
}

/**
 * 未找到的字段
 */
export interface NotFoundField {
    field: string;
    reason: string;
    suggestions: string[];
}

/**
 * 质量指标
 */
export interface QualityMetrics {
    dataCompleteness: number;
    informationAccuracy: number;
    sourceReliability: number;
    crossValidationScore: number;
    overallScore: number;
}

/**
 * 结果警告
 */
export interface ResultWarning {
    type: string;
    field: string;
    message: string;
    confidence: number;
}

/**
 * 结果建议
 */
export interface ResultRecommendation {
    type: string;
    message: string;
    affectedFields: string[];
}

/**
 * 处理详情
 */
export interface ProcessingDetails {
    modelUsed: string;
    tokenConsumed: number;
    apiCallsCount: number;
    preprocessingTime: number;
    extractionTime: number;
    validationTime: number;
    totalProcessingTime: number;
}

/**
 * 字段配置
 */
export interface FieldConfig {
    documentType: DocumentType;
    label: string;
    description: string;
    version: string;
    totalFields: number;
    lastUpdated: string;
    modules: FieldModule[];
}

/**
 * 字段模块
 */
export interface FieldModule {
    module: string;
    label: string;
    description: string;
    order: number;
    required: boolean;
    fieldCount: number;
    fields: FieldDefinition[];
}

/**
 * 字段定义
 */
export interface FieldDefinition {
    key: string;
    label: string;
    description: string;
    type: string;
    dataType: string;
    required: boolean;
    maxLength?: number;
    validation?: FieldValidation;
    examples: string[];
    searchKeywords: string[];
    extractionHints: string[];
    confidence: ConfidenceThresholds;
}

/**
 * 字段验证
 */
export interface FieldValidation {
    pattern: string;
    message: string;
}

/**
 * 置信度阈值
 */
export interface ConfidenceThresholds {
    high: number;
    medium: number;
    low: number;
}

// ===== 系统配置相关类型 =====

/**
 * API配置
 */
export interface ApiConfig {
    provider: string;
    apiKey: string;
    baseUrl: string;
    modelName: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
    maxRetries: number;
    isDefault: boolean;
    isActive: boolean;
    isValid?: boolean;
    lastTested?: string;
    lastUpdated?: string;
}

/**
 * API配置偏好
 */
export interface ApiPreferences {
    autoSelectBestModel: boolean;
    fallbackEnabled: boolean;
    costOptimization: boolean;
}

/**
 * API设置请求
 */
export interface ApiSettingsRequest {
    configs: ApiConfig[];
    preferences: ApiPreferences;
}

/**
 * API测试结果
 */
export interface ApiTestResult {
    success: boolean;
    responseTime: number;
    latency: string;
    modelInfo: ModelInfo;
    capabilities: string[];
    testMessage: string;
    performance: PerformanceInfo;
    quota: QuotaInfo;
}

/**
 * 模型信息
 */
export interface ModelInfo {
    name: string;
    provider: string;
    version: string;
    contextWindow: number;
    inputCost: string;
    outputCost: string;
}

/**
 * 性能信息
 */
export interface PerformanceInfo {
    speed: 'slow' | 'medium' | 'fast';
    reliability: 'low' | 'medium' | 'high';
    qualityScore: number;
}

/**
 * 配额信息
 */
export interface QuotaInfo {
    remaining: string;
    resetAt: string;
}

/**
 * 系统统计
 */
export interface SystemStatistics {
    overview: SystemOverview;
    periodStats: PeriodStats;
    documentTypes: DocumentTypeStats[];
    performance: SystemPerformance;
    trends: SystemTrends;
    topUsers: TopUser[];
    errors: ErrorStats;
}

/**
 * 系统概览
 */
export interface SystemOverview {
    totalDocuments: number;
    totalExtractions: number;
    totalUsers: number;
    activeUsers: number;
    successRate: number;
    averageProcessingTime: number;
    systemHealth: number;
    uptime: string;
}

/**
 * 周期统计
 */
export interface PeriodStats {
    period: string;
    startDate: string;
    endDate: string;
    documentsUploaded: number;
    extractionsCompleted: number;
    newUsers: number;
    activeUsers: number;
    totalProcessingTime: number;
    averageProcessingTime: number;
    successRate: number;
}

/**
 * 文档类型统计
 */
export interface DocumentTypeStats {
    type: DocumentType;
    label: string;
    count: number;
    percentage: number;
    successRate: number;
    averageProcessingTime: number;
}

/**
 * 系统性能
 */
export interface SystemPerformance {
    systemLoad: SystemLoad;
    processingQueue: ProcessingQueue;
    apiPerformance: Record<string, ApiPerformanceStats>;
}

/**
 * 系统负载
 */
export interface SystemLoad {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
}

/**
 * 处理队列
 */
export interface ProcessingQueue {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    averageWaitTime: number;
}

/**
 * API性能统计
 */
export interface ApiPerformanceStats {
    successRate: number;
    averageResponseTime: number;
    errorRate: number;
    quota: string;
}

/**
 * 系统趋势
 */
export interface SystemTrends {
    daily: DailyTrend[];
}

/**
 * 日趋势
 */
export interface DailyTrend {
    date: string;
    documents: number;
    extractions: number;
    users: number;
    successRate: number;
}

/**
 * 顶级用户
 */
export interface TopUser {
    userId: string;
    username: string;
    documentsCount: number;
    extractionsCount: number;
    successRate: number;
}

/**
 * 错误统计
 */
export interface ErrorStats {
    last24h: number;
    commonErrors: CommonError[];
}

/**
 * 常见错误
 */
export interface CommonError {
    type: string;
    count: number;
    percentage: number;
}

// ===== 导出相关类型 =====

/**
 * 导出请求
 */
export interface ExportRequest {
    exportType: string;
    format: 'excel' | 'csv' | 'json' | 'pdf';
    scope: ExportScope;
    filters?: ExportFilters;
    options?: ExportOptions;
    delivery: ExportDelivery;
}

/**
 * 导出范围
 */
export interface ExportScope {
    type: 'tasks' | 'documents' | 'date_range';
    taskIds?: string[];
    documentIds?: string[];
    includeMetadata: boolean;
    includeSourceReferences: boolean;
}

/**
 * 导出过滤器
 */
export interface ExportFilters {
    fieldsFilter?: string[];
    minimumConfidence?: number;
    documentTypes?: DocumentType[];
    dateRange?: {
        startDate: string;
        endDate: string;
    };
}

/**
 * 导出选项
 */
export interface ExportOptions {
    groupBy?: string;
    includeCharts: boolean;
    includeStatistics: boolean;
    template: string;
    language: string;
    watermark?: string;
}

/**
 * 导出交付方式
 */
export interface ExportDelivery {
    method: 'download' | 'email' | 'webhook';
    email?: string;
    webhookUrl?: string;
}

/**
 * 导出结果
 */
export interface ExportResult {
    id: string;
    status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
    format: string;
    estimatedSize: string;
    estimatedTime: number;
    progress: number;
    downloadUrl?: string;
    fileName: string;
    includesData: ExportDataInfo;
    expiresAt: string;
    createdAt: string;
}

/**
 * 导出数据信息
 */
export interface ExportDataInfo {
    documentsCount: number;
    tasksCount: number;
    fieldsCount: number;
    dateRange: {
        start: string;
        end: string;
    };
}

// ===== 系统健康检查类型 =====

/**
 * 系统健康状态
 */
export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    services: SystemServices;
    metrics: SystemMetrics;
}

/**
 * 系统服务状态
 */
export interface SystemServices {
    database: ServiceStatus;
    redis: ServiceStatus;
    storage: ServiceStatus;
    aiProviders: Record<string, ServiceStatus>;
}

/**
 * 服务状态
 */
export interface ServiceStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    [key: string]: any;
}

/**
 * 系统指标
 */
export interface SystemMetrics {
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
}

// ===== 文档历史类型 =====

/**
 * 文档历史查询参数
 */
export interface DocumentHistoryParams {
    page?: number;
    pageSize?: number;
    documentType?: DocumentType;
    status?: DocumentStatus;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}

/**
 * 文档历史响应
 */
export interface DocumentHistoryResponse {
    items: DocumentHistoryItem[];
    pagination: Pagination;
    statistics: DocumentHistoryStatistics;
}

/**
 * 文档历史项
 */
export interface DocumentHistoryItem {
    id: string;
    fileName: string;
    originalName: string;
    documentType: DocumentType;
    documentTypeLabel: string;
    fileSize: number;
    fileSizeFormatted: string;
    pageCount: number;
    status: DocumentStatus;
    statusLabel: string;
    extractionTasks: TaskBrief[];
    tags: string[];
    folder?: string;
    uploadedBy: UserBrief;
    createdAt: string;
    updatedAt: string;
    lastAccessedAt?: string;
    accessCount: number;
    downloadCount: number;
    shareStatus: string;
}

/**
 * 任务简要信息
 */
export interface TaskBrief {
    id: string;
    status: TaskStatus;
    fieldsExtracted: number;
    totalFields: number;
    extractionRate: number;
    averageConfidence: number;
    processingTime: number;
    completedAt?: string;
}

/**
 * 文档历史统计
 */
export interface DocumentHistoryStatistics {
    totalDocuments: number;
    completedDocuments: number;
    processingDocuments: number;
    failedDocuments: number;
    averageProcessingTime: number;
    successRate: number;
}
