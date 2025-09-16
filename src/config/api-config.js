// API配置管理

/**
 * 环境配置
 */
export const ENVIRONMENTS = {
    DEVELOPMENT: 'development',
    TESTING: 'testing',
    PRODUCTION: 'production'
}

/**
 * 当前环境（可以通过构建工具或环境变量设置）
 */
export const CURRENT_ENV = process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT

/**
 * API端点配置 - 根据后端API文档配置
 */
export const API_ENDPOINTS = {
    [ENVIRONMENTS.DEVELOPMENT]: {
        BASE_URL: '/api',  // 开发环境使用代理，避免CORS问题
        WS_URL: 'wss://nybrzijdwpdn.sealoshzh.site/ws',
        TIMEOUT: 30000,                    // 默认超时30秒
        AI_EXTRACTION_TIMEOUT: 300000,     // AI提取专用超时5分钟
        RETRY_TIMES: 3
    },
    [ENVIRONMENTS.TESTING]: {
        BASE_URL: 'https://nybrzijdwpdn.sealoshzh.site/api',
        WS_URL: 'wss://nybrzijdwpdn.sealoshzh.site/ws',
        TIMEOUT: 30000,                    // 默认超时30秒
        AI_EXTRACTION_TIMEOUT: 300000,     // AI提取专用超时5分钟
        RETRY_TIMES: 3
    },
    [ENVIRONMENTS.PRODUCTION]: {
        BASE_URL: 'https://nybrzijdwpdn.sealoshzh.site/api', // 使用用户指定的后端地址
        WS_URL: 'wss://nybrzijdwpdn.sealoshzh.site/ws',
        TIMEOUT: 30000,                    // 默认超时30秒
        AI_EXTRACTION_TIMEOUT: 300000,     // AI提取专用超时5分钟
        RETRY_TIMES: 3
    }
}

/**
 * 获取当前环境配置
 */
export function getCurrentConfig() {
    return API_ENDPOINTS[CURRENT_ENV] || API_ENDPOINTS[ENVIRONMENTS.DEVELOPMENT]
}

/**
 * API路由定义 - 根据后端API文档完整对接
 */
export const API_ROUTES = {
    // 认证相关接口 (/api/auth/)
    AUTH: {
        LOGIN: '/auth/login',                         // POST 用户登录
        REGISTER: '/auth/register',                   // POST 用户注册
        REFRESH: '/auth/refresh',                     // POST Token刷新
        LOGOUT: '/auth/logout',                       // POST 用户登出
        VERIFY_EMAIL: '/auth/verify-email',           // POST 邮箱验证
        FORGOT_PASSWORD: '/auth/forgot-password',     // POST 忘记密码
        RESET_PASSWORD: '/auth/reset-password'        // POST 重置密码
    },

    // 文档处理接口 (/api/documents/)
    DOCUMENTS: {
        UPLOAD: '/documents/upload',                                        // POST 文件上传
        EXTRACT: (documentId) => `/documents/${documentId}/extract`,        // POST 开始数据提取
        PROGRESS: (taskId) => `/documents/tasks/${taskId}/progress`,        // GET 获取提取进度
        RESULTS: (taskId) => `/documents/tasks/${taskId}/results`,          // GET 获取提取结果
        FIELD_CONFIG: (docType) => `/documents/field-config/${docType}`,    // GET 获取字段配置
        HISTORY: '/documents/history',                                      // GET 获取处理历史
        HISTORY_RESULTS: (historyId) => `/documents/history/${historyId}/results`, // GET 获取历史记录的提取结果
        DELETE_RECORD: (historyId) => `/documents/history/${historyId}`,    // DELETE 删除历史记录
        EXPORT: '/documents/export',                                        // POST 导出提取结果
        DOWNLOAD_ORIGINAL: (documentId) => `/documents/${documentId}/download-original`,        // GET 获取原文档下载链接
        SERVE_ORIGINAL: (documentId) => `/documents/${documentId}/download-original/serve`      // GET 原文档下载
    },

    // 用户管理接口 (/api/users/)
    USERS: {
        PROFILE: '/users/profile',                    // GET 获取用户信息
        UPDATE_PROFILE: '/users/profile',             // PATCH 更新用户信息 (根据后端实际支持的方法)
        UPLOAD_AVATAR: '/users/avatar',               // POST 上传头像
        CHANGE_PASSWORD: '/users/password',           // PUT 修改密码
        ACTIVITY_LOGS: '/users/activity-logs'         // GET 获取活动日志
    },

    // 系统配置接口 (/api/system/)
    SYSTEM: {
        STATISTICS: '/system/statistics',                   // GET 获取系统统计
        HEALTH: '/system/health'                            // GET 系统健康检查
    },

    // 全局模型配置接口 (/api/documents/models/global-config/)
    GLOBAL_CONFIG: {
        SET: '/documents/models/global-config/set',         // POST 设置全局默认配置
        GET: '/documents/models/global-config/get',         // GET 获取当前全局配置
        TEST: '/documents/models/global-config/test',       // POST 测试全局配置连接
        CLEAR: '/documents/models/global-config/clear'      // DELETE 清除全局配置
    }
}

/**
 * 文件上传限制
 */
export const UPLOAD_LIMITS = {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['application/pdf'],
    ALLOWED_EXTENSIONS: ['.pdf'],
    MAX_CONCURRENT_UPLOADS: 3
}

/**
 * 请求头配置
 */
export const REQUEST_HEADERS = {
    DEFAULT: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
    UPLOAD: {
        'Accept': 'application/json'
        // Content-Type会由浏览器自动设置为multipart/form-data
    }
}

/**
 * 错误码映射
 */
export const ERROR_CODES = {
    SUCCESS: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TIMEOUT: 408,
    CONFLICT: 409,
    RATE_LIMIT: 429,
    SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
}

/**
 * 业务状态码
 */
export const BUSINESS_CODES = {
    SUCCESS: 200,
    VALIDATION_ERROR: 1001,
    AUTH_FAILED: 1002,
    PERMISSION_DENIED: 1003,
    RESOURCE_NOT_FOUND: 1004,
    BUSINESS_ERROR: 1005,
    SYSTEM_ERROR: 1006
}

/**
 * 文档处理状态
 */
export const DOCUMENT_STATUS = {
    UPLOADED: 'uploaded',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    PENDING: 'pending'
}

/**
 * 用户角色定义
 */
export const USER_ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    GUEST: 'guest'
}

/**
 * 权限定义
 */
export const PERMISSIONS = {
    ADMIN: 'admin',
    BASIC: 'basic',
    UPLOAD: 'upload',
    EXPORT: 'export',
    MANAGE_USERS: 'manage_users'
}

/**
 * 获取完整API URL
 * @param {string} path API路径
 * @returns {string} 完整URL
 */
export function getApiUrl(path) {
    const config = getCurrentConfig()
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${config.BASE_URL}${cleanPath}`
}

/**
 * 验证文件类型和大小
 * @param {File} file 文件对象
 * @returns {Object} 验证结果
 */
export function validateFile(file) {
    const errors = []

    // 检查文件大小
    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
        errors.push(`文件大小不能超过${Math.round(UPLOAD_LIMITS.MAX_FILE_SIZE / 1024 / 1024)}MB`)
    }

    // 检查文件类型
    if (!UPLOAD_LIMITS.ALLOWED_TYPES.includes(file.type)) {
        errors.push('只支持PDF格式文件')
    }

    // 检查文件扩展名
    const fileName = file.name || ''
    const hasValidExtension = UPLOAD_LIMITS.ALLOWED_EXTENSIONS.some(ext =>
        fileName.toLowerCase().endsWith(ext)
    )

    if (!hasValidExtension) {
        errors.push('文件扩展名必须为.pdf')
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    }
}

/**
 * 格式化文件大小
 * @param {number} bytes 字节数
 * @returns {string} 格式化后的大小
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成请求ID（用于追踪）
 */
export function generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 检查API响应是否成功
 * @param {Object} response API响应
 * @returns {boolean} 是否成功
 */
export function isApiSuccess(response) {
    return response && response.code === BUSINESS_CODES.SUCCESS
}

/**
 * 提取API错误信息
 * @param {Object} response API响应
 * @returns {string} 错误信息
 */
export function getApiErrorMessage(response) {
    if (!response) return '未知错误'

    // 优先使用详细错误信息
    if (response.error?.details && response.error.details.length > 0) {
        return response.error.details.map(detail => detail.message).join('; ')
    }

    // 使用通用错误信息
    return response.message || '操作失败'
}
