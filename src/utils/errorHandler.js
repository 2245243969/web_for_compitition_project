// 统一错误处理工具

/**
 * 显示错误提示
 * @param {Error|string} error 错误对象或错误信息
 * @param {object} options 选项
 */
export function showError(error, options = {}) {
    const {
        title = '操作失败',
        duration = 3000,
        showModal = false,
        confirmText = '确定'
    } = options

    let message = ''
    if (error instanceof Error) {
        message = error.message
    } else if (typeof error === 'string') {
        message = error
    } else if (error && error.message) {
        message = error.message
    } else {
        message = '未知错误'
    }

    // 过滤敏感信息
    message = sanitizeErrorMessage(message)

    if (showModal) {
        uni.showModal({
            title: title,
            content: message,
            showCancel: false,
            confirmText: confirmText
        })
    } else {
        uni.showToast({
            title: message,
            icon: 'none',
            duration: duration
        })
    }
}

/**
 * 清理错误信息，移除敏感信息
 * @param {string} message 原始错误信息
 * @returns {string} 清理后的错误信息
 */
function sanitizeErrorMessage(message) {
    if (!message || typeof message !== 'string') {
        return '操作失败'
    }

    // 移除可能的敏感信息
    const sensitivePatterns = [
        /token/gi,
        /password/gi,
        /secret/gi,
        /key/gi,
        /authorization/gi
    ]

    let cleanMessage = message
    sensitivePatterns.forEach(pattern => {
        cleanMessage = cleanMessage.replace(pattern, '***')
    })

    // 限制错误信息长度
    if (cleanMessage.length > 100) {
        cleanMessage = cleanMessage.substring(0, 100) + '...'
    }

    return cleanMessage
}

/**
 * 处理API错误
 * @param {Error} error API错误
 * @param {object} context 上下文信息
 */
export function handleApiError(error, context = {}) {
    console.error('API错误:', error, context)

    // 记录错误日志
    logError(error, {
        type: 'api_error',
        ...context
    })

    // 根据错误类型决定处理方式
    if (error.message === 'Token已过期') {
        // Token过期不需要额外处理，已在API层处理
        return
    }

    if (error.message.includes('网络')) {
        showError(error, {
            title: '网络错误',
            showModal: true
        })
    } else if (error.message.includes('权限')) {
        showError(error, {
            title: '权限错误',
            showModal: true
        })
    } else {
        showError(error)
    }
}

/**
 * 处理业务错误
 * @param {Error} error 业务错误
 * @param {object} context 上下文信息
 */
export function handleBusinessError(error, context = {}) {
    console.error('业务错误:', error, context)

    logError(error, {
        type: 'business_error',
        ...context
    })

    showError(error, {
        title: '操作失败'
    })
}

/**
 * 处理文件上传错误
 * @param {Error} error 上传错误
 * @param {object} fileInfo 文件信息
 */
export function handleUploadError(error, fileInfo = {}) {
    console.error('文件上传错误:', error, fileInfo)

    logError(error, {
        type: 'upload_error',
        fileName: fileInfo.name,
        fileSize: fileInfo.size
    })

    let message = error.message || '文件上传失败'

    // 根据错误类型提供更具体的提示
    if (message.includes('大小')) {
        message = '文件大小超过限制，请选择小于50MB的PDF文件'
    } else if (message.includes('格式')) {
        message = '只支持PDF格式文件，请重新选择'
    } else if (message.includes('网络')) {
        message = '网络连接失败，请检查网络后重试'
    }

    showError(message, {
        title: '上传失败',
        duration: 4000
    })
}

/**
 * 处理表单验证错误
 * @param {object} errors 验证错误对象
 * @param {string} firstErrorField 第一个错误字段（用于聚焦）
 */
export function handleValidationErrors(errors, firstErrorField = null) {
    if (!errors || typeof errors !== 'object') {
        return
    }

    const errorMessages = Object.values(errors).filter(msg => msg)
    if (errorMessages.length === 0) {
        return
    }

    logError(new Error('表单验证失败'), {
        type: 'validation_error',
        errors: errors,
        firstErrorField: firstErrorField
    })

    // 显示第一个错误信息
    showError(errorMessages[0], {
        title: '输入错误'
    })
}

/**
 * 错误日志记录
 * @param {Error} error 错误对象
 * @param {object} context 上下文信息
 */
function logError(error, context = {}) {
    const errorLog = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: window.location?.href || '',
        userAgent: navigator.userAgent || '',
        userId: uni.getStorageSync('userInfo')?.id || 'anonymous',
        ...context
    }

    // 保存到本地存储（用于离线上报）
    try {
        const errorLogs = uni.getStorageSync('errorLogs') || []
        errorLogs.push(errorLog)

        // 只保留最近100条日志
        if (errorLogs.length > 100) {
            errorLogs.splice(0, errorLogs.length - 100)
        }

        uni.setStorageSync('errorLogs', errorLogs)
    } catch (e) {
        console.error('保存错误日志失败:', e)
    }

    // 开发环境下详细打印
    if (process.env.NODE_ENV === 'development') {
        console.group('🚨 错误详情')
        console.error('错误:', error)
        console.table(context)
        console.groupEnd()
    }
}

/**
 * 上报错误日志到服务器
 */
export async function reportErrorLogs() {
    try {
        const errorLogs = uni.getStorageSync('errorLogs') || []
        if (errorLogs.length === 0) {
            return
        }

        // 这里可以调用API上报错误日志
        // await api.post('/system/error-logs', { logs: errorLogs })

        // 上报成功后清除本地日志
        uni.removeStorageSync('errorLogs')
        console.log(`已上报 ${errorLogs.length} 条错误日志`)
    } catch (error) {
        console.error('上报错误日志失败:', error)
    }
}

/**
 * 检查是否为浏览器扩展错误
 * @param {*} error 错误对象或信息
 * @param {string} source 错误源文件
 * @returns {boolean} 是否为扩展错误
 */
function isExtensionError(error, source = '') {
    // 检查错误消息
    if (error && typeof error === 'string') {
        const extensionKeywords = [
            'Pro feature',
            'content_script',
            'extension',
            'chrome-extension',
            'moz-extension',
            'safari-extension'
        ]
        if (extensionKeywords.some(keyword => error.includes(keyword))) {
            return true
        }
    }

    // 检查错误对象
    if (error && error.message) {
        const extensionKeywords = [
            'Pro feature',
            'becoming a Pro member',
            'content_script',
            'extension'
        ]
        if (extensionKeywords.some(keyword => error.message.includes(keyword))) {
            return true
        }
    }

    // 检查错误堆栈
    if (error && error.stack) {
        const extensionPaths = [
            'content_script',
            'extension',
            'chrome-extension://',
            'moz-extension://',
            'safari-extension://'
        ]
        if (extensionPaths.some(path => error.stack.includes(path))) {
            return true
        }
    }

    // 检查源文件路径
    if (source) {
        const extensionPaths = [
            'content_script',
            'extension',
            'chrome-extension://',
            'moz-extension://',
            'safari-extension://'
        ]
        if (extensionPaths.some(path => source.includes(path))) {
            return true
        }
    }

    return false
}

/**
 * 全局错误处理器（用于捕获未处理的错误）
 * @param {VueApp} app Vue应用实例
 */
export function setupGlobalErrorHandler(app) {
    // 捕获Promise未处理的reject
    if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', (event) => {
            // 检查是否为浏览器扩展错误
            if (isExtensionError(event.reason)) {
                console.warn('🔧 检测到浏览器扩展Promise错误，已忽略:', event.reason)
                event.preventDefault()
                return
            }

            console.error('未处理的Promise错误:', event.reason)
            logError(new Error(event.reason), {
                type: 'unhandled_promise_rejection'
            })

            // 防止控制台报错
            event.preventDefault()
        })

        // 捕获JS运行时错误
        window.addEventListener('error', (event) => {
            // 检查是否为浏览器扩展错误
            if (isExtensionError(event.error, event.filename)) {
                console.warn('🔧 检测到浏览器扩展JS错误，已忽略:', event.message)
                return true // 阻止默认错误处理
            }

            console.error('JS运行时错误:', event.error)
            logError(event.error || new Error(event.message), {
                type: 'javascript_error',
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            })
        })
    }
}

/**
 * 重试机制包装器
 * @param {function} fn 要重试的函数
 * @param {number} maxRetries 最大重试次数
 * @param {number} delay 重试延迟（毫秒）
 * @returns {Promise} 函数执行结果
 */
export async function withRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError = null

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error

            console.warn(`操作失败，第 ${i + 1} 次尝试:`, error.message)

            // 如果是最后一次尝试，抛出错误
            if (i === maxRetries) {
                logError(error, {
                    type: 'retry_exhausted',
                    attempts: i + 1,
                    maxRetries: maxRetries
                })
                throw error
            }

            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
    }

    throw lastError
}

/**
 * 异步操作安全包装器
 * @param {function} fn 异步函数
 * @param {object} options 选项
 * @returns {Promise} 包装后的函数
 */
export function safeAsync(fn, options = {}) {
    const {
        showLoading = false,
        loadingText = '处理中...',
        onError = null,
        onFinally = null
    } = options

    return async (...args) => {
        try {
            if (showLoading) {
                uni.showLoading({
                    title: loadingText,
                    mask: true
                })
            }

            const result = await fn(...args)
            return result
        } catch (error) {
            if (onError) {
                onError(error)
            } else {
                handleApiError(error)
            }
            throw error
        } finally {
            if (showLoading) {
                uni.hideLoading()
            }
            if (onFinally) {
                onFinally()
            }
        }
    }
}

// 导出默认对象
export default {
    showError,
    handleApiError,
    handleBusinessError,
    handleUploadError,
    handleValidationErrors,
    reportErrorLogs,
    setupGlobalErrorHandler,
    withRetry,
    safeAsync
}