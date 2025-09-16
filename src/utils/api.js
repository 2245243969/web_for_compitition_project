// 统一API服务模块
import { getCurrentUser, logout } from './auth.js'
import {
    getCurrentConfig,
    API_ROUTES,
    ERROR_CODES,
    BUSINESS_CODES,
    isApiSuccess,
    getApiErrorMessage,
    generateRequestId
} from '../config/api-config.js'

/**
 * 提取详细错误信息 - 根据API文档响应格式
 * @param {Object} responseData API响应数据
 * @returns {string} 详细错误信息
 */
function getDetailedErrorMessage(responseData) {
    if (!responseData) return '未知错误'

    // 优先使用错误详情
    if (responseData.error?.details && Array.isArray(responseData.error.details)) {
        const errorMessages = responseData.error.details.map(detail => {
            if (detail.field && detail.message) {
                return `${detail.field}: ${detail.message}`
            }
            return detail.message || '字段验证失败'
        })
        return errorMessages.join('; ')
    }

    // 使用错误类型和消息
    if (responseData.error?.type && responseData.message) {
        return `${responseData.error.type}: ${responseData.message}`
    }

    // 使用通用消息
    return responseData.message || '操作失败'
}

// 获取API配置
const API_CONFIG = getCurrentConfig()

/**
 * 统一的HTTP请求方法
 * @param {string} url 请求URL
 * @param {object} options 请求选项
 * @returns {Promise} 响应数据
 */
async function request(url, options = {}) {
    const {
        method = 'GET',
        data = null,
        headers = {},
        timeout = API_CONFIG.TIMEOUT,
        needAuth = true
    } = options

    // 处理token过期的通用函数
    function handleTokenExpired() {
        // 清除本地存储
        uni.removeStorageSync('token')
        uni.removeStorageSync('refreshToken')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('isLoggedIn')

        uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
        })

        // 跳转到登录页
        setTimeout(() => {
            uni.reLaunch({
                url: '/pages/login/login'
            })
        }, 1500)
    }

    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`

    // 添加调试信息
    console.log('🔗 API请求URL构建信息:', {
        inputUrl: url,
        baseUrl: API_CONFIG.BASE_URL,
        fullUrl: fullUrl,
        isAbsoluteUrl: url.startsWith('http')
    })

    // 构建请求头
    const requestHeaders = {
        'Content-Type': 'application/json',
        ...headers
    }

    // 自动添加Authorization header（如果有token的话）
    let token = uni.getStorageSync('token')
    const isLoggedIn = uni.getStorageSync('isLoggedIn')

    // 如果第一次获取不到，尝试延迟获取（解决存储同步问题）
    if (!token && isLoggedIn) {
        console.log('⚠️ 首次获取token失败，尝试重新获取...')
        // 短暂延迟后重试
        await new Promise(resolve => setTimeout(resolve, 50))
        token = uni.getStorageSync('token')
    }

    console.log('🔍 API请求调试信息:', {
        url: fullUrl,
        method: method.toUpperCase(),
        needAuth,
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null',
        isLoggedIn,
        headers: Object.keys(requestHeaders)
    })

    if (token && needAuth) {
        requestHeaders['Authorization'] = `Bearer ${token}`
        console.log('✅ 已添加Authorization头部')
    } else if (needAuth) {
        console.warn('❌ 需要认证但没有token!', {
            tokenExists: !!token,
            isLoggedIn,
            needAuth
        })
    }

    return new Promise((resolve, reject) => {
        uni.request({
            url: fullUrl,
            method: method.toUpperCase(),
            data: data,
            header: requestHeaders,
            timeout: timeout,
            success: (res) => {
                const { data: responseData, statusCode } = res

                console.log('📡 API响应:', { statusCode, data: responseData })

                if (statusCode === 200) {
                    // 根据API文档，检查统一响应格式
                    if (responseData && responseData.success === true && responseData.code === 200) {
                        // 成功响应
                        resolve(responseData)
                    } else if (responseData && responseData.success === false) {
                        // 业务错误响应
                        console.error('业务错误:', responseData)
                        const errorMessage = getDetailedErrorMessage(responseData)
                        reject(new Error(errorMessage))
                    } else if (responseData && responseData.code === 200) {
                        // 兼容旧格式
                        resolve(responseData)
                    } else {
                        // 直接返回数据（兼容一些接口）
                        resolve(responseData)
                    }
                } else if (statusCode === 201) {
                    // 创建成功响应（如注册）
                    if (responseData && responseData.success === true && responseData.code === 201) {
                        resolve(responseData)
                    } else {
                        resolve(responseData)
                    }
                } else if (statusCode === 401) {
                    // Token过期，清除本地存储并跳转到登录页
                    console.warn('401 未授权，清除登录状态')

                    // 尝试使用refreshToken刷新（但避免循环调用）
                    const refreshToken = uni.getStorageSync('refreshToken')
                    if (refreshToken && !fullUrl.includes('/auth/refresh')) {
                        // 直接调用刷新接口，不使用refreshTokenApi避免循环引用
                        console.log('尝试刷新Token...')

                        uni.request({
                            url: `${API_CONFIG.BASE_URL}/auth/refresh`,
                            method: 'POST',
                            data: { refreshToken },
                            header: {
                                'Content-Type': 'application/json'
                            },
                            success: (refreshRes) => {
                                console.log('🔄 刷新Token响应:', refreshRes)

                                // 根据后端API文档，响应格式为：{ code: 200, message: "Token刷新成功", data: { tokens: { accessToken, refreshToken, tokenType, expiresIn, expiresAt } } }
                                if (refreshRes.statusCode === 200 && refreshRes.data.code === 200 && refreshRes.data.data && refreshRes.data.data.tokens) {
                                    console.log('✅ Token刷新成功，重试原请求')
                                    const tokens = refreshRes.data.data.tokens
                                    uni.setStorageSync('token', tokens.accessToken)
                                    uni.setStorageSync('refreshToken', tokens.refreshToken)

                                    // 更新请求头并重试原请求
                                    const newHeaders = { ...requestHeaders }
                                    newHeaders['Authorization'] = `Bearer ${tokens.accessToken}`

                                    uni.request({
                                        url: fullUrl,
                                        method: method.toUpperCase(),
                                        data: data,
                                        header: newHeaders,
                                        timeout: timeout,
                                        success: (retryRes) => {
                                            if (retryRes.statusCode === 200) {
                                                resolve(retryRes.data)
                                            } else {
                                                reject(new Error(`重试请求失败: ${retryRes.statusCode}`))
                                            }
                                        },
                                        fail: reject
                                    })
                                } else {
                                    console.error('Token刷新失败:', refreshRes)
                                    handleTokenExpired()
                                }
                            },
                            fail: (refreshError) => {
                                console.error('Token刷新请求失败:', refreshError)
                                handleTokenExpired()
                            }
                        })

                        // 防止继续执行，等待刷新完成
                        return
                    }

                    // 没有refreshToken或刷新失败，直接处理过期
                    handleTokenExpired()
                } else {
                    // 其他HTTP错误
                    console.error('HTTP错误:', { statusCode, data: responseData })

                    let errorMessage = 'Unknown error'

                    // 根据状态码提供用户友好的错误信息
                    switch (statusCode) {
                        case 400:
                            errorMessage = responseData?.message || '请求参数错误'
                            break
                        case 403:
                            errorMessage = '权限不足，无法访问该资源'
                            break
                        case 404:
                            errorMessage = '请求的资源不存在'
                            break
                        case 409:
                            errorMessage = responseData?.message || '资源冲突'
                            break
                        case 413:
                            errorMessage = '文件大小超过限制'
                            break
                        case 415:
                            errorMessage = '不支持的文件格式'
                            break
                        case 422:
                            errorMessage = responseData?.message || '数据验证失败'
                            break
                        case 429:
                            errorMessage = '请求过于频繁，请稍后重试'
                            break
                        case 500:
                            errorMessage = '服务器内部错误，请稍后重试'
                            break
                        case 502:
                            errorMessage = '服务暂时不可用，请稍后重试'
                            break
                        case 503:
                            errorMessage = '服务维护中，请稍后重试'
                            break
                        default:
                            errorMessage = responseData?.message || `HTTP ${statusCode}: ${errorMessage}`
                    }

                    reject(new Error(errorMessage))
                }
            },
            fail: (error) => {
                console.error('API请求失败:', error)

                let errorMessage = '网络连接失败'

                // 根据错误类型提供更具体的错误信息
                if (error.errMsg) {
                    if (error.errMsg.includes('timeout')) {
                        errorMessage = '请求超时，请检查网络连接'
                    } else if (error.errMsg.includes('network')) {
                        errorMessage = '网络连接失败，请检查网络设置'
                    } else if (error.errMsg.includes('abort')) {
                        errorMessage = '请求被取消'
                    } else {
                        errorMessage = error.errMsg
                    }
                }

                reject(new Error(errorMessage))
            }
        })
    })
}



/**
 * 文件上传专用方法
 * @param {string} url 上传URL
 * @param {string} filePath 文件路径
 * @param {object} formData 表单数据
 * @param {function} onProgress 进度回调
 * @returns {Promise} 上传结果
 */
function uploadFile(url, filePath, formData = {}, onProgress = null) {
    const fullUrl = url.startsWith('http') ? url : `${API_CONFIG.BASE_URL}${url}`

    // 构建请求头
    const headers = {}
    const user = getCurrentUser()
    const token = uni.getStorageSync('token') || user?.token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`
    }

    // 详细的上传请求日志
    console.log('📤 文件上传请求详情:', {
        url: fullUrl,
        filePath: filePath,
        formData: formData,
        headers: headers,
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
    })

    return new Promise((resolve, reject) => {
        const uploadTask = uni.uploadFile({
            url: fullUrl,
            filePath: filePath,
            name: 'file',
            formData: formData,
            header: headers,
            success: (res) => {
                try {
                    const data = JSON.parse(res.data)
                    console.log('📤 文件上传响应:', data)

                    // 根据API文档检查响应格式
                    if (data.success === true && data.code === 200) {
                        console.log('✅ 文件上传成功')
                        resolve(data)
                    } else if (data.code === 200) {
                        // 兼容旧格式
                        resolve(data)
                    } else {
                        console.error('❌ 文件上传失败:', data)
                        const errorMessage = getDetailedErrorMessage(data)
                        reject(new Error(errorMessage))
                    }
                } catch (error) {
                    console.error('❌ 解析上传响应失败:', error)
                    reject(new Error('上传响应解析失败'))
                }
            },
            fail: (error) => {
                console.error('❌ 文件上传网络失败:', error)

                let errorMessage = '文件上传失败'
                if (error.errMsg) {
                    if (error.errMsg.includes('timeout')) {
                        errorMessage = '上传超时，请检查网络连接'
                    } else if (error.errMsg.includes('network')) {
                        errorMessage = '网络连接失败，请检查网络设置'
                    } else {
                        errorMessage = error.errMsg
                    }
                }

                reject(new Error(errorMessage))
            }
        })

        // 监听上传进度
        if (onProgress && uploadTask.onProgressUpdate) {
            uploadTask.onProgressUpdate((res) => {
                onProgress(res.progress)
            })
        }
    })
}

// ===========================================
// 认证相关API
// ===========================================

/**
 * 用户登录 - 根据API文档实现
 */
export async function loginApi(loginData) {
    try {
        console.log('🚀 开始登录API调用:', loginData)

        // 根据API文档构建请求数据
        const requestData = {
            username: loginData.username || loginData.email, // API文档要求username字段
            password: loginData.password,
            rememberMe: loginData.rememberMe || false
        }

        const response = await request(API_ROUTES.AUTH.LOGIN, {
            method: 'POST',
            data: requestData,
            needAuth: false
        })

        console.log('📥 登录API响应:', response)

        if (response && response.success && response.code === 200 && response.data) {
            console.log('✅ 登录成功，保存认证信息')

            // 根据API文档保存认证信息
            const { user, tokens, session } = response.data

            uni.setStorageSync('token', tokens.accessToken)
            uni.setStorageSync('refreshToken', tokens.refreshToken || '')
            uni.setStorageSync('userInfo', user)
            uni.setStorageSync('isLoggedIn', true)
            uni.setStorageSync('loginTime', new Date().toISOString())

            // 保存会话信息（可选）
            if (session) {
                uni.setStorageSync('sessionInfo', session)
            }

            console.log('💾 已保存token:', {
                hasToken: !!tokens.accessToken,
                tokenLength: tokens.accessToken ? tokens.accessToken.length : 0,
                tokenPreview: tokens.accessToken ? tokens.accessToken.substring(0, 20) + '...' : 'null'
            })

            return response.data
        }

        throw new Error(response?.message || '登录响应数据异常')
    } catch (error) {
        console.error('❌ 登录API调用失败:', error)
        throw error
    }
}

/**
 * 用户注册 - 根据API文档实现
 */
export async function registerApi(registerData) {
    try {
        console.log('🚀 开始注册API调用:', registerData)

        // 根据后端要求构建请求数据
        const requestData = {
            username: registerData.username,
            email: registerData.email,
            password: registerData.password,
            confirmPassword: registerData.confirmPassword
            // 移除 firstName、lastName 和 agreeTerms 字段
        }

        const response = await request(API_ROUTES.AUTH.REGISTER, {
            method: 'POST',
            data: requestData,
            needAuth: false
        })

        console.log('📥 注册API响应:', response)

        if (response && response.success && response.code === 201 && response.data) {
            console.log('✅ 注册成功')

            // 如果注册成功且返回了token，直接保存登录状态
            if (response.data.tokens) {
                const { user, tokens, verification } = response.data

                uni.setStorageSync('token', tokens.accessToken)
                uni.setStorageSync('refreshToken', tokens.refreshToken || '')
                uni.setStorageSync('userInfo', user)
                uni.setStorageSync('isLoggedIn', true)
                uni.setStorageSync('loginTime', new Date().toISOString())

                console.log('💾 注册后自动登录成功')
            }

            return response.data
        }

        throw new Error(response?.message || '注册失败')
    } catch (error) {
        console.error('❌ 注册API调用失败:', error)
        throw error
    }
}

/**
 * 刷新令牌 - 根据API文档实现
 */
export async function refreshTokenApi() {
    try {
        const refreshToken = uni.getStorageSync('refreshToken')
        if (!refreshToken) {
            throw new Error('没有刷新令牌')
        }

        console.log('🔄 开始刷新Token')

        const response = await request(API_ROUTES.AUTH.REFRESH, {
            method: 'POST',
            data: { refreshToken },
            needAuth: false
        })

        // 根据后端API文档，响应格式为：{ code: 200, message: "Token刷新成功", data: { tokens: { accessToken, refreshToken, tokenType, expiresIn, expiresAt } } }
        if (response && response.code === 200 && response.data?.tokens) {
            const tokens = response.data.tokens

            // 更新存储的token
            uni.setStorageSync('token', tokens.accessToken)
            uni.setStorageSync('refreshToken', tokens.refreshToken)

            console.log('✅ Token刷新成功')
            return response.data
        }

        throw new Error(response?.message || '刷新令牌失败')
    } catch (error) {
        console.error('❌ 刷新令牌失败:', error)
        // 刷新失败，清除认证状态
        logout()
        throw error
    }
}

/**
 * 用户登出 - 根据API文档实现
 */
export async function logoutApi(logoutAll = false) {
    try {
        console.log('🚪 开始登出API调用')

        const requestData = {
            logoutAll: logoutAll
        }

        const response = await request(API_ROUTES.AUTH.LOGOUT, {
            method: 'POST',
            data: requestData
        })

        console.log('📥 登出API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 服务器登出成功')
        }

    } catch (error) {
        console.error('❌ 登出API调用失败:', error)
        // 即使API调用失败，也要清除本地状态
    } finally {
        // 清除本地认证信息
        uni.removeStorageSync('token')
        uni.removeStorageSync('refreshToken')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('isLoggedIn')
        uni.removeStorageSync('loginTime')
        uni.removeStorageSync('sessionInfo')

        console.log('🧹 本地认证信息已清除')
    }
}

/**
 * 邮箱验证 - 根据API文档实现
 */
export async function verifyEmailApi(token, email) {
    try {
        console.log('📧 开始邮箱验证API调用')

        const requestData = {
            token: token,
            email: email
        }

        const response = await request(API_ROUTES.AUTH.VERIFY_EMAIL, {
            method: 'POST',
            data: requestData,
            needAuth: false
        })

        console.log('📥 邮箱验证API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 邮箱验证成功')
            return response.data
        }

        throw new Error(response?.message || '邮箱验证失败')
    } catch (error) {
        console.error('❌ 邮箱验证API调用失败:', error)
        throw error
    }
}

/**
 * 忘记密码 - 根据API文档实现
 */
export async function forgotPasswordApi(email) {
    try {
        console.log('🔑 开始忘记密码API调用')

        const requestData = {
            email: email
        }

        const response = await request(API_ROUTES.AUTH.FORGOT_PASSWORD, {
            method: 'POST',
            data: requestData,
            needAuth: false
        })

        console.log('📥 忘记密码API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 密码重置邮件发送成功')
            return response.data
        }

        throw new Error(response?.message || '发送重置邮件失败')
    } catch (error) {
        console.error('❌ 忘记密码API调用失败:', error)
        throw error
    }
}

/**
 * 重置密码 - 根据API文档实现
 */
export async function resetPasswordApi(token, newPassword, confirmPassword) {
    try {
        console.log('🔐 开始重置密码API调用')

        const requestData = {
            token: token,
            newPassword: newPassword,
            confirmPassword: confirmPassword
        }

        const response = await request(API_ROUTES.AUTH.RESET_PASSWORD, {
            method: 'POST',
            data: requestData,
            needAuth: false
        })

        console.log('📥 重置密码API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 密码重置成功')
            return response.data
        }

        throw new Error(response?.message || '密码重置失败')
    } catch (error) {
        console.error('❌ 重置密码API调用失败:', error)
        throw error
    }
}

// ===========================================
// 用户管理相关API
// ===========================================

/**
 * 获取用户信息 - 根据API文档实现
 */
export async function getUserProfileApi() {
    try {
        console.log('🔍 开始获取用户信息...')
        const response = await request(API_ROUTES.USERS.PROFILE)
        console.log('✅ 用户信息获取成功:', response)

        if (response && response.success && response.code === 200 && response.data?.user) {
            // 更新本地存储的用户信息
            uni.setStorageSync('userInfo', response.data.user)
            return response.data
        }

        throw new Error(response?.message || '获取用户信息失败')
    } catch (error) {
        console.error('❌ 获取用户信息失败:', error)

        // 检查是否是processing_time相关的模型错误
        if (error.message && (
            error.message.includes('processing_time') ||
            error.message.includes('ExtractionTask') ||
            error.message.includes('has no attribute') ||
            error.message.includes('500') ||
            error.message.includes('服务器') ||
            error.message.includes('Internal Server Error')
        )) {
            console.warn('⚠️ 检测到后端模型错误（可能是processing_time字段缺失），使用本地用户信息作为备选')

            // 尝试从本地存储获取用户信息
            const localUserInfo = uni.getStorageSync('userInfo')
            if (localUserInfo) {
                console.log('📱 使用本地存储的用户信息:', localUserInfo)

                // 补充默认的统计信息（如果缺失）
                const userWithStats = {
                    ...localUserInfo,
                    stats: localUserInfo.stats || {
                        totalDocuments: 0,
                        totalExtractions: 0,
                        successfulExtractions: 0,
                        successRate: 0,
                        totalProcessingTime: 0,
                        averageProcessingTime: 0,
                        favoriteDocumentType: 'fund_contract'
                    }
                }

                return { user: userWithStats }
            }

            // 如果本地也没有，返回默认用户信息
            console.log('📝 返回默认用户信息结构')
            return {
                user: {
                    username: '用户',
                    email: '',
                    firstName: '用户',
                    lastName: '',
                    avatar: '',
                    id: 'default_user',
                    stats: {
                        totalDocuments: 0,
                        totalExtractions: 0,
                        successfulExtractions: 0,
                        successRate: 0,
                        totalProcessingTime: 0,
                        averageProcessingTime: 0,
                        favoriteDocumentType: 'fund_contract'
                    }
                }
            }
        }

        throw error
    }
}

/**
 * 更新用户信息 - 根据API文档实现
 */
export async function updateUserProfileApi(profileData) {
    try {
        console.log('📝 开始更新用户信息:', profileData)

        // 根据API文档构建请求数据
        const requestData = {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone,
            company: profileData.company,
            settings: profileData.settings,
            bio: profileData.bio
        }

        const response = await request(API_ROUTES.USERS.UPDATE_PROFILE, {
            method: 'PATCH',
            data: requestData
        })

        console.log('📥 更新用户信息API响应:', response)

        if (response && response.success && response.code === 200 && response.data?.user) {
            // 更新本地用户信息
            uni.setStorageSync('userInfo', response.data.user)
            console.log('✅ 用户信息更新成功')
            return response.data
        }

        throw new Error(response?.message || '更新用户信息失败')
    } catch (error) {
        console.error('❌ 更新用户信息失败:', error)
        throw error
    }
}

/**
 * 上传头像 - 根据API文档实现
 */
export async function uploadAvatarApi(filePath) {
    try {
        console.log('🖼️ 开始上传头像:', filePath)

        const response = await uploadFile(API_ROUTES.USERS.UPLOAD_AVATAR, filePath)

        console.log('📥 上传头像API响应:', response)

        if (response && response.success && response.code === 200 && response.data?.avatar) {
            // 更新本地用户信息中的头像
            const currentUser = uni.getStorageSync('userInfo')
            if (currentUser) {
                currentUser.avatar = response.data.avatar.original || response.data.avatar.medium
                uni.setStorageSync('userInfo', currentUser)
            }

            console.log('✅ 头像上传成功')
            return response.data
        }

        throw new Error(response?.message || '头像上传失败')
    } catch (error) {
        console.error('❌ 头像上传失败:', error)
        throw error
    }
}

/**
 * 修改密码 - 根据API文档实现
 */
export async function changePasswordApi(passwordData) {
    try {
        console.log('🔐 开始修改密码API调用')

        // 根据API文档构建请求数据
        const requestData = {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
            confirmPassword: passwordData.confirmPassword
        }

        const response = await request(API_ROUTES.USERS.CHANGE_PASSWORD, {
            method: 'PUT',
            data: requestData
        })

        console.log('📥 修改密码API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 密码修改成功')

            // 如果API要求重新认证，清除token让用户重新登录
            if (response.data?.requireReauth) {
                console.log('🔄 密码修改后需要重新登录')
                // 可以选择是否自动登出
                // logout()
            }

            return response.data
        }

        throw new Error(response?.message || '修改密码失败')
    } catch (error) {
        console.error('❌ 修改密码失败:', error)
        throw error
    }
}

/**
 * 获取用户活动日志 - 根据API文档实现
 */
export async function getUserActivityLogsApi(params = {}) {
    try {
        console.log('📊 开始获取用户活动日志')

        // 构建查询参数
        const queryParams = new URLSearchParams()
        if (params.page) queryParams.append('page', params.page)
        if (params.pageSize) queryParams.append('pageSize', params.pageSize)
        if (params.action) queryParams.append('action', params.action)
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)

        const url = `${API_ROUTES.USERS.ACTIVITY_LOGS}?${queryParams.toString()}`
        const response = await request(url)

        console.log('📥 用户活动日志API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 获取用户活动日志成功')
            return response.data
        }

        throw new Error(response?.message || '获取活动日志失败')
    } catch (error) {
        console.error('❌ 获取用户活动日志失败:', error)
        throw error
    }
}

// ===========================================
// 文档处理相关API
// ===========================================

/**
 * 上传文档 - 根据后端API接口规格实现
 */
export async function uploadDocumentApi(filePath, documentType, options = {}, onProgress = null) {
    try {
        console.log('📄 开始上传文档:', { filePath, documentType, options })

        // 根据后端API接口规格构建表单数据
        const formData = {
            documentType: documentType,
            description: options.description || `${documentType}文档上传`,
            folder: options.folder || 'uploads',
            tags: JSON.stringify(options.tags || ['基金文档']) // 后端要求JSON格式
        }

        const response = await uploadFile(API_ROUTES.DOCUMENTS.UPLOAD, filePath, formData, onProgress)

        console.log('📥 上传文档API响应:', response)

        // 根据后端API响应格式返回数据
        if (response && response.success && response.code === 200) {
            console.log('✅ 文档上传成功')
            console.log('📋 完整响应:', JSON.stringify(response, null, 2))

            // 尝试多种可能的数据结构
            let documentData = null

            // 情况1: response.data.document 包含文档信息（根据你的日志）
            if (response.data && response.data.document && typeof response.data.document === 'object') {
                documentData = response.data.document
                console.log('📋 找到嵌套文档数据:', documentData)
            }
            // 情况2: response.data 直接包含文档信息
            else if (response.data && typeof response.data === 'object' && response.data.id) {
                documentData = response.data
                console.log('📋 找到直接文档数据:', documentData)
            }
            // 情况3: response.data 是字符串，需要解析
            else if (typeof response.data === 'string') {
                try {
                    documentData = JSON.parse(response.data)
                    console.log('📋 解析字符串数据:', documentData)
                } catch (e) {
                    console.warn('无法解析响应数据:', response.data)
                }
            }
            // 情况4: 数据直接在response根级别
            else if (response.id) {
                documentData = response
                console.log('📋 找到根级别数据:', documentData)
            }

            if (documentData) {
                const result = {
                    id: documentData.id || documentData.document_id || documentData.fileId,
                    fileName: documentData.fileName || documentData.file_name || documentData.filename,
                    originalName: documentData.originalName || documentData.original_name || documentData.name,
                    documentType: documentData.documentType || documentData.document_type || documentData.type,
                    description: documentData.description,
                    folder: documentData.folder,
                    status: documentData.status || 'UPLOADED'
                }

                console.log('📋 处理后的结果:', result)
                console.log('🔍 提取的ID:', result.id)

                // 确保ID不为空
                if (!result.id) {
                    console.error('❌ 无法提取文档ID！原始数据:', documentData)
                    console.error('❌ 尝试的字段:', ['id', 'document_id', 'fileId'])
                }

                return result
            } else {
                console.warn('⚠️ 无法从响应中提取文档数据')
                console.warn('⚠️ response.data:', response.data)
                console.warn('⚠️ response.data类型:', typeof response.data)
                return response
            }
        }

        throw new Error(response?.message || '文档上传失败')
    } catch (error) {
        console.error('❌ 文档上传失败:', error)
        throw error
    }
}

/**
 * 开始数据提取 - 根据API文档实现
 */
export async function startExtractionApi(documentId, extractionConfig) {
    try {
        console.log('🚀 开始数据提取API调用:', { documentId, extractionConfig })

        // 构建简化的请求数据，后端将使用全局配置
        console.log('📋 使用全局配置进行提取')
        const requestData = {
            documentType: extractionConfig.documentType,
            extractionOptions: {
                mode: extractionConfig.mode || "full",
                fieldsToExtract: extractionConfig.fieldsToExtract || [],
                extractionDepth: extractionConfig.extractionDepth || "detailed",
                includeConfidence: true,
                includeSourceReferences: true,
                validateResults: true,
                outputFormat: "structured"
            },
            processingOptions: {
                priority: extractionConfig.priority || "normal",
                async: true,
                notifyOnComplete: true,
                retainIntermediateResults: false
            },
            qualitySettings: {
                minimumConfidence: extractionConfig.minimumConfidence || 0.8,
                crossValidation: true,
                humanReview: false,
                qualityCheckEnabled: true
            }
        }

        console.log('📋 构建的请求数据:', JSON.stringify(requestData, null, 2))

        const response = await request(API_ROUTES.DOCUMENTS.EXTRACT(documentId), {
            method: 'POST',
            data: requestData,
            timeout: API_CONFIG.AI_EXTRACTION_TIMEOUT  // 使用AI提取专用超时时间（5分钟）
        })

        console.log('📥 开始提取API响应:', response)

        // 根据后端实际返回格式处理数据
        if (response && response.success && response.code === 200 && response.data) {
            console.log('✅ 数据提取完成')

            // 构造符合前端期望的结果格式
            const result = {
                id: response.data.task?.id || 'unknown',
                documentId: response.data.task?.documentId || 'unknown',
                status: response.data.task?.status || 'COMPLETED',
                progress: response.data.task?.progress || 100,
                processingTime: response.data.task?.processingTime || 0,
                completedAt: response.data.task?.completedAt || new Date().toISOString(),

                // 提取结果数据
                extractionSummary: response.data.result?.extractionSummary || {
                    totalFields: 0,
                    extractedFields: 0,
                    processingTime: 0,
                    documentType: 'unknown'
                },

                // 完整的模块化数据
                extractedData: response.data.result?.extractedData || {},

                // 保留原始响应以备需要
                _originalResponse: response
            }

            return result
        }

        throw new Error(response?.message || '开始数据提取失败')
    } catch (error) {
        console.error('❌ 开始提取失败:', error)
        throw error
    }
}

/**
 * 获取提取进度 - 根据后端API文档实现
 */
export async function getExtractionProgressApi(taskId) {
    try {
        console.log('📈 开始获取提取进度:', taskId)

        const response = await request(API_ROUTES.DOCUMENTS.PROGRESS(taskId))

        console.log('📥 提取进度API响应:', response)

        // 根据后端API文档，响应格式为：
        // { code: 200, message: "获取成功", data: { taskId, status, progress, currentStep, processingTime, estimatedTimeRemaining } }
        if (response && response.code === 200 && response.data) {
            console.log('✅ 获取提取进度成功')
            return {
                taskId: response.data.taskId,
                status: response.data.status,
                progress: response.data.progress,
                currentStep: response.data.currentStep,
                processingTime: response.data.processingTime,
                estimatedTimeRemaining: response.data.estimatedTimeRemaining
            }
        }

        throw new Error(response?.message || '获取提取进度失败')
    } catch (error) {
        console.error('❌ 获取提取进度失败:', error)
        throw error
    }
}


/**
 * 获取提取结果 - 根据后端API文档实现
 */
export async function getExtractionResultsApi(taskId, options = {}) {
    try {
        console.log('📄 开始获取提取结果:', taskId, options)

        // 构建查询参数
        const queryParams = new URLSearchParams()
        if (options.format) queryParams.append('format', options.format)
        if (options.includeMetadata !== undefined) queryParams.append('includeMetadata', options.includeMetadata)

        const url = `${API_ROUTES.DOCUMENTS.RESULTS(taskId)}${queryParams.toString() ? '?' + queryParams.toString() : ''}`

        console.log('📄 提取结果API请求:', {
            url: url,
            taskId: taskId,
            options: options
        })

        const response = await request(url, {
            timeout: API_CONFIG.AI_EXTRACTION_TIMEOUT  // 使用AI提取专用超时时间（5分钟）
        })

        console.log('📥 提取结果API响应:', response)

        // 兼容多种响应格式
        if (response && (response.code === 200 || response.success)) {
            console.log('✅ 获取提取结果成功')

            // 检查多种可能的数据结构
            let result = null
            if (response.data?.result) {
                result = response.data.result
                console.log('📊 使用 response.data.result 路径')
            } else if (response.data) {
                result = response.data
                console.log('📊 使用 response.data 路径')
            } else {
                result = response
                console.log('📊 使用 response 根路径')
            }

            console.log('📋 解析得到的result对象:', result)
            console.log('📋 result.extractedData:', result.extractedData)

            return {
                id: result.id,
                taskId: result.taskId,
                status: result.status,
                extractionSummary: result.extractionSummary,
                extractedData: result.extractedData,
                qualityMetrics: result.qualityMetrics,
                createdAt: result.createdAt,
                completedAt: result.completedAt
            }
        }

        throw new Error(response?.message || '获取提取结果失败')
    } catch (error) {
        console.error('❌ 获取提取结果失败:', error)
        throw error
    }
}

/**
 * 获取字段配置 - 根据API文档实现
 */
export async function getFieldConfigApi(documentType) {
    try {
        console.log('⚙️ 获取字段配置:', documentType)

        const response = await request(API_ROUTES.DOCUMENTS.FIELD_CONFIG(documentType))

        console.log('📥 字段配置API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 获取字段配置成功')
            return response.data
        }

        throw new Error(response?.message || '获取字段配置失败')
    } catch (error) {
        console.error('❌ 获取字段配置失败:', error)
        throw error
    }
}



/**
 * 获取原文档下载链接 - 根据API文档实现
 */
export async function getOriginalDocumentDownloadApi(documentId) {
    try {
        console.log('🔗 获取原文档下载链接:', documentId)

        const response = await request(API_ROUTES.DOCUMENTS.DOWNLOAD_ORIGINAL(documentId))

        console.log('📥 下载链接API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 获取下载链接成功')
            return response.data
        }

        throw new Error(response?.message || '获取下载链接失败')
    } catch (error) {
        console.error('❌ 获取下载链接失败:', error)
        throw error
    }
}

/**
 * 获取文档处理历史记录 - 根据后端API文档实现
 * @param {Object} params 查询参数
 * @param {number} params.page 页码 (默认1)
 * @param {number} params.pageSize 每页数量 (默认20)
 * @param {string} params.documentType 文档类型筛选 (fund_contract|custody_agreement|prospectus)
 * @param {string} params.status 状态筛选 (completed|processing|failed|pending)
 * @param {string} params.startDate 开始日期 (YYYY-MM-DD)
 * @param {string} params.endDate 结束日期 (YYYY-MM-DD)
 * @param {string} params.search 关键词搜索
 * @param {string} params.sortBy 排序字段 (如 createdAt)
 * @param {string} params.sortOrder 排序方向 (asc|desc，默认desc)
 * @returns {Promise} API响应
 */
export async function getDocumentHistoryApi(params = {}) {
    try {
        console.log('📄 开始获取文档历史记录:', params)

        // 构建查询参数
        const queryParams = new URLSearchParams()
        if (params.page) queryParams.append('page', params.page)
        if (params.pageSize) queryParams.append('pageSize', params.pageSize)
        if (params.documentType) queryParams.append('documentType', params.documentType)
        if (params.status) queryParams.append('status', params.status)
        if (params.startDate) queryParams.append('startDate', params.startDate)
        if (params.endDate) queryParams.append('endDate', params.endDate)
        if (params.search) queryParams.append('search', params.search)
        if (params.sortBy) queryParams.append('sortBy', params.sortBy)
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

        const url = `${API_ROUTES.DOCUMENTS.HISTORY}?${queryParams.toString()}`

        console.log('📄 历史记录API请求:', {
            url: url,
            fullUrl: `${getCurrentConfig().BASE_URL}${url}`,
            params: params
        })

        const response = await request(url)

        console.log('📥 历史记录API响应:', response)

        if (response && response.success && response.code === 200 && response.data) {
            console.log('✅ 获取历史记录成功')
            console.log('📋 完整响应数据结构:', JSON.stringify(response, null, 2))

            // 根据后端实际返回格式，支持多种可能的数据路径
            let documents = []
            let paginationData = {}

            // 尝试不同的数据路径
            if (response.data.data && response.data.data.documents) {
                // 格式：{ code: 200, data: { data: { documents: [...], pagination: {...} } } }
                documents = response.data.data.documents
                paginationData = response.data.data.pagination || response.data.data
                console.log('📄 使用路径: response.data.data.documents')
            } else if (response.data.documents) {
                // 格式：{ code: 200, data: { documents: [...], pagination: {...} } }
                documents = response.data.documents
                paginationData = response.data.pagination || response.data
                console.log('📄 使用路径: response.data.documents')
            } else if (response.data.items) {
                // 格式：{ code: 200, data: { items: [...], page, pageSize, total, totalPages } }
                documents = response.data.items
                paginationData = response.data
                console.log('📄 使用路径: response.data.items')
            } else if (Array.isArray(response.data)) {
                // 格式：{ code: 200, data: [...] }
                documents = response.data
                console.log('📄 使用路径: response.data (数组)')
            }

            console.log('📊 解析结果:', {
                documentsCount: documents.length,
                paginationData: paginationData,
                sampleDocument: documents[0] || null
            })

            return {
                records: documents,
                pagination: {
                    page: paginationData.page || paginationData.current || 1,
                    pageSize: paginationData.pageSize || paginationData.size || 20,
                    total: paginationData.total || paginationData.totalCount || documents.length,
                    totalPages: paginationData.totalPages || paginationData.pages || Math.ceil((paginationData.total || documents.length) / (paginationData.pageSize || 20))
                }
            }
        }

        throw new Error(response?.message || '获取处理历史失败')
    } catch (error) {
        console.error('❌ 获取处理历史失败:', error)
        throw error
    }
}

/**
 * 导出文档提取结果 - 根据后端API文档实现
 * @param {Object} exportConfig 导出配置
 * @param {string} exportConfig.taskId 任务ID
 * @param {string} exportConfig.format 导出格式 (pdf|xlsx|json，默认pdf)
 * @param {Object} exportConfig.options 导出附加配置
 * @returns {Promise} API响应
 */
export async function exportResultsApi(exportConfig) {
    try {
        console.log('📥 开始导出提取结果:', exportConfig)

        // 根据后端API文档，请求体格式为：{ taskId, format, options }
        const requestData = {
            taskId: exportConfig.taskId || (exportConfig.taskIds && exportConfig.taskIds[0]),
            format: exportConfig.format || 'pdf',
            options: exportConfig.options || {}
        }

        console.log('📋 导出请求数据:', requestData)

        const response = await request(API_ROUTES.DOCUMENTS.EXPORT, {
            method: 'POST',
            data: requestData
        })

        console.log('📥 导出API响应:', response)

        // 根据后端API文档，响应格式为：{ code: 200, data: { url: string } }
        if (response && response.code === 200 && response.data) {
            console.log('✅ 导出成功')
            return {
                downloadUrl: response.data.url,
                fileName: response.data.fileName || `提取结果.${requestData.format === 'xlsx' ? 'xlsx' : 'pdf'}`
            }
        }

        throw new Error(response?.message || '导出失败')
    } catch (error) {
        console.error('❌ 导出结果失败:', error)
        throw error
    }
}

/**
 * 导出基金字段PDF报告 - 根据新API文档实现
 */
export async function exportFundFieldsPdfApi(fieldsData, documentType, filename = '基金信息提取报告.pdf') {
    try {
        console.log('📄 开始导出基金字段PDF:', { documentType, filename })

        // 根据API文档构建请求数据
        const requestData = {
            fields: fieldsData,
            document_type: documentType,
            filename: filename
        }

        // 获取API配置
        const API_CONFIG = getCurrentConfig()
        const fullUrl = `${API_CONFIG.BASE_URL}/documents/enhanced/export-fields-pdf`

        // 构建请求头
        const headers = {
            'Content-Type': 'application/json'
        }

        // 添加认证头
        const token = uni.getStorageSync('token')
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        console.log('🔗 PDF导出API请求:', {
            url: fullUrl,
            headers: Object.keys(headers),
            dataKeys: Object.keys(requestData)
        })

        return new Promise((resolve, reject) => {
            uni.request({
                url: fullUrl,
                method: 'POST',
                data: requestData,
                header: headers,
                responseType: 'arraybuffer', // 重要：设置响应类型为二进制
                timeout: 60000, // 60秒超时，PDF生成可能需要较长时间
                success: (res) => {
                    console.log('📥 PDF导出API响应:', {
                        statusCode: res.statusCode,
                        headers: res.header,
                        dataType: typeof res.data,
                        dataLength: res.data ? res.data.byteLength : 0
                    })

                    if (res.statusCode === 200) {
                        // 检查Content-Type是否为PDF
                        const contentType = res.header['content-type'] || res.header['Content-Type']

                        if (contentType && contentType.includes('application/pdf')) {
                            // 二进制PDF数据
                            console.log('✅ 收到PDF文件数据:', res.data.byteLength, 'bytes')

                            // 在H5环境中，直接下载PDF
                            // #ifdef H5
                            const blob = new Blob([res.data], { type: 'application/pdf' })
                            const url = URL.createObjectURL(blob)

                            // 创建下载链接
                            const link = document.createElement('a')
                            link.href = url
                            link.download = filename
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            URL.revokeObjectURL(url)

                            console.log('✅ PDF文件下载成功:', filename)

                            resolve({
                                success: true,
                                message: 'PDF导出成功',
                                data: {
                                    filename: filename,
                                    size: res.data.byteLength
                                }
                            })
                            // #endif

                            // #ifndef H5
                            // 在uni-app环境中，处理下载
                            if (typeof uni !== 'undefined' && uni.env && uni.env.USER_DATA_PATH) {
                                // 创建临时文件
                                const tempFilePath = `${uni.env.USER_DATA_PATH}/${filename}`

                                // 写入文件
                                uni.getFileSystemManager().writeFile({
                                    filePath: tempFilePath,
                                    data: res.data,
                                    encoding: 'binary',
                                    success: function () {
                                        console.log('✅ PDF文件保存成功:', tempFilePath)

                                        // 打开PDF文件
                                        uni.openDocument({
                                            filePath: tempFilePath,
                                            showMenu: true,
                                            success: function () {
                                                console.log('✅ PDF文件打开成功')
                                            },
                                            fail: function (err) {
                                                console.error('❌ PDF文件打开失败:', err)
                                            }
                                        })

                                        resolve({
                                            success: true,
                                            message: 'PDF导出成功',
                                            data: {
                                                filePath: tempFilePath,
                                                size: res.data.byteLength
                                            }
                                        })
                                    },
                                    fail: function (err) {
                                        console.error('❌ PDF文件保存失败:', err)
                                        reject(new Error('PDF文件保存失败'))
                                    }
                                })
                            } else {
                                // 备用方案：返回blob数据
                                const blob = new Blob([res.data], { type: 'application/pdf' })
                                resolve({
                                    success: true,
                                    message: 'PDF导出成功',
                                    data: blob
                                })
                            }
                            // #endif
                        } else {
                            // 可能是JSON错误响应
                            try {
                                const textDecoder = new TextDecoder('utf-8')
                                const jsonStr = textDecoder.decode(res.data)
                                const jsonData = JSON.parse(jsonStr)

                                if (jsonData.success === false) {
                                    reject(new Error(jsonData.message || 'PDF导出失败'))
                                } else {
                                    resolve(jsonData)
                                }
                            } catch (parseError) {
                                console.error('❌ 响应解析失败:', parseError)
                                reject(new Error('PDF导出响应格式异常'))
                            }
                        }
                    } else {
                        // HTTP错误状态码
                        let errorMessage = `HTTP ${res.statusCode}: `

                        try {
                            // 尝试解析错误响应
                            if (res.data) {
                                const textDecoder = new TextDecoder('utf-8')
                                const jsonStr = textDecoder.decode(res.data)
                                const errorData = JSON.parse(jsonStr)
                                errorMessage += errorData.message || '未知错误'
                            } else {
                                errorMessage += '请求失败'
                            }
                        } catch (parseError) {
                            errorMessage += '请求失败'
                        }

                        reject(new Error(errorMessage))
                    }
                },
                fail: (error) => {
                    console.error('❌ PDF导出网络请求失败:', error)

                    let errorMessage = 'PDF导出失败'
                    if (error.errMsg) {
                        if (error.errMsg.includes('timeout')) {
                            errorMessage = 'PDF生成超时，请稍后重试'
                        } else if (error.errMsg.includes('network')) {
                            errorMessage = '网络连接失败，请检查网络设置'
                        } else {
                            errorMessage = error.errMsg
                        }
                    }

                    reject(new Error(errorMessage))
                }
            })
        })

    } catch (error) {
        console.error('❌ 导出基金字段PDF失败:', error)
        throw error
    }
}

/**
 * 导出PDF报告（旧版本兼容）
 */
export async function exportPdfApi(pdfConfig) {
    try {
        const response = await request(API_ROUTES.DOCUMENTS.EXPORT_PDF, {
            method: 'POST',
            data: pdfConfig
        })

        return response.data
    } catch (error) {
        console.error('导出PDF失败:', error)
        throw error
    }
}

/**
 * 获取历史记录的提取结果 - 使用新的API端点
 * @param {string} historyId 历史记录ID
 * @returns {Promise} API响应
 */
export async function getHistoryResultsApi(historyId) {
    try {
        console.log('📄 开始获取历史记录提取结果:', historyId)

        const response = await request(API_ROUTES.DOCUMENTS.HISTORY_RESULTS(historyId), {
            timeout: API_CONFIG.AI_EXTRACTION_TIMEOUT
        })

        console.log('📥 历史记录提取结果API响应:', response)

        // 兼容后端统一的响应格式
        if (response && (response.success || response.code === 200)) {
            console.log('✅ 获取历史记录提取结果成功')

            // 按照后端新的统一格式解析数据
            const result = response.data?.result || response.data

            console.log('📋 解析得到的result对象:', result)
            console.log('📋 result.extractedData:', result.extractedData)

            return {
                id: result.id,
                taskId: result.taskId,
                status: result.status,
                extractionSummary: result.extractionSummary,
                extractedData: result.extractedData,
                qualityMetrics: result.qualityMetrics,
                createdAt: result.createdAt,
                completedAt: result.completedAt
            }
        }

        throw new Error(response?.message || '获取历史记录提取结果失败')
    } catch (error) {
        console.error('❌ 获取历史记录提取结果失败:', error)
        throw error
    }
}

/**
 * 删除历史记录 - 使用正确的API调用方式
 * @param {string} historyId 历史记录ID
 * @returns {Promise} API响应
 */
export async function deleteDocumentRecordApi(historyId) {
    try {
        console.log('🗑️ 开始删除历史记录:', historyId)

        const response = await request(API_ROUTES.DOCUMENTS.DELETE_RECORD(historyId), {
            method: 'DELETE'
        })

        console.log('📥 删除历史记录API响应:', response)

        // 检查删除响应是否成功
        if (response && response.success) {
            console.log('✅ 历史记录删除成功:', response)
            // 刷新历史记录列表
            return response
        } else {
            console.error('❌ 删除失败:', response)
            throw new Error(response?.message || '删除历史记录失败')
        }
    } catch (error) {
        console.error('❌ 删除历史记录出错:', error)
        throw error
    }
}

/**
 * 获取原文档下载链接
 */
export async function getOriginalDocumentApi(fileId) {
    try {
        const response = await request(API_ROUTES.DOCUMENTS.DOWNLOAD_ORIGINAL(fileId))
        return response.data
    } catch (error) {
        console.error('获取原文档下载链接失败:', error)
        throw error
    }
}

// ===========================================
// 系统配置相关API
// ===========================================

// 用户API设置相关函数已移除，现在只使用全局配置

/**
 * 获取系统统计 - 根据API文档实现
 */
export async function getSystemStatisticsApi(params = {}) {
    try {
        console.log('📊 开始获取系统统计数据')

        // 构建查询参数
        const queryParams = new URLSearchParams()
        if (params.period) queryParams.append('period', params.period)
        if (params.includeDetails !== undefined) queryParams.append('includeDetails', params.includeDetails)
        if (params.groupBy) queryParams.append('groupBy', params.groupBy)

        const url = `${API_ROUTES.SYSTEM.STATISTICS}?${queryParams.toString()}`
        const response = await request(url)

        console.log('📥 系统统计API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 获取系统统计成功')
            return response.data
        }

        // 如果服务器返回错误，返回默认统计数据
        console.warn('⚠️ 服务器错误，使用默认统计数据')
        return {
            overview: {
                totalDocuments: 0,
                totalExtractions: 0,
                totalUsers: 0,
                activeUsers: 0,
                successRate: 0,
                averageProcessingTime: 0,
                systemHealth: 95.0,
                uptime: "99.9%"
            },
            periodStats: {
                period: "7d",
                documentsUploaded: 0,
                extractionsCompleted: 0,
                newUsers: 0,
                activeUsers: 0
            },
            documentTypes: [],
            performance: {
                systemLoad: {
                    cpu: 0,
                    memory: 0,
                    disk: 0,
                    network: 0
                }
            }
        }

    } catch (error) {
        console.error('❌ 获取系统统计失败:', error)
        console.warn('📊 使用默认统计数据')

        // 返回默认统计数据
        return {
            overview: {
                totalDocuments: 0,
                totalExtractions: 0,
                totalUsers: 0,
                activeUsers: 0,
                successRate: 0,
                averageProcessingTime: 0,
                systemHealth: 95.0,
                uptime: "99.9%"
            },
            periodStats: {
                period: "7d",
                documentsUploaded: 0,
                extractionsCompleted: 0,
                newUsers: 0,
                activeUsers: 0
            },
            documentTypes: [],
            performance: {
                systemLoad: {
                    cpu: 0,
                    memory: 0,
                    disk: 0,
                    network: 0
                }
            }
        }
    }
}

/**
 * 系统健康检查 - 根据API文档实现
 */
export async function getSystemHealthApi() {
    try {
        console.log('🏥 开始系统健康检查')

        const response = await request(API_ROUTES.SYSTEM.HEALTH, {
            needAuth: false // 根据API文档，这是公开接口
        })

        console.log('📥 系统健康检查API响应:', response)

        if (response && response.success && response.code === 200) {
            console.log('✅ 系统健康检查成功')
            return response.data
        }

        // 如果健康检查失败，返回基本的状态信息
        console.warn('⚠️ 系统健康检查失败，返回基本状态')
        return {
            status: 'degraded',
            timestamp: new Date().toISOString(),
            uptime: 0,
            version: 'unknown',
            environment: 'unknown',
            services: {
                database: { status: 'unknown', responseTime: 0 },
                redis: { status: 'unknown', responseTime: 0 },
                storage: { status: 'unknown' },
                aiProviders: {}
            },
            metrics: {
                requestsPerSecond: 0,
                averageResponseTime: 0,
                errorRate: 0,
                memoryUsage: 0,
                cpuUsage: 0
            }
        }
    } catch (error) {
        console.error('❌ 系统健康检查失败:', error)

        // 返回降级的健康状态
        return {
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: 0,
            version: 'unknown',
            environment: 'unknown',
            services: {
                database: { status: 'unhealthy', responseTime: 0 },
                redis: { status: 'unhealthy', responseTime: 0 },
                storage: { status: 'unhealthy' },
                aiProviders: {}
            },
            metrics: {
                requestsPerSecond: 0,
                averageResponseTime: 0,
                errorRate: 100,
                memoryUsage: 0,
                cpuUsage: 0
            }
        }
    }
}

// ===========================================
// 全局模型配置相关API
// ===========================================

/**
 * 设置全局默认配置 - 根据API文档实现
 */
export async function setGlobalConfigApi(globalConfig) {
    try {
        console.log('⚙️ 开始设置全局默认配置:', globalConfig)

        // 根据API文档构建请求数据
        const requestData = {
            model_name: globalConfig.model_name,           // 必填：模型名称
            api_key: globalConfig.api_key,                 // 必填：API密钥  
            base_url: globalConfig.base_url || null        // 可选：API地址
        }

        const response = await request(API_ROUTES.GLOBAL_CONFIG.SET, {
            method: 'POST',
            data: requestData
        })

        console.log('📥 设置全局配置API响应:', response)

        if (response && response.code === 200) {
            console.log('✅ 全局配置设置成功')
            return response.data
        }

        throw new Error(response?.message || '设置全局配置失败')
    } catch (error) {
        console.error('❌ 设置全局配置失败:', error)
        throw error
    }
}

/**
 * 获取当前全局配置 - 根据API文档实现
 */
export async function getGlobalConfigApi() {
    try {
        console.log('📊 获取当前全局配置')

        const response = await request(API_ROUTES.GLOBAL_CONFIG.GET)

        console.log('📥 获取全局配置API响应:', response)

        if (response && response.code === 200) {
            console.log('✅ 获取全局配置成功')

            // 处理不同的响应格式
            let configData = response.data

            // 如果data是字符串，尝试解析或创建配置对象
            if (typeof configData === 'string') {
                if (configData.includes('成功')) {
                    // 如果是成功消息，假设配置存在
                    configData = {
                        has_global_config: true,
                        message: configData
                    }
                } else {
                    configData = {
                        has_global_config: false,
                        message: configData
                    }
                }
            }

            // 确保有has_global_config字段
            if (configData && typeof configData === 'object' && !('has_global_config' in configData)) {
                // 如果有model_name或api_key，认为配置存在
                configData.has_global_config = !!(configData.model_name || configData.api_key)
            }

            return configData
        }

        throw new Error(response?.message || '获取全局配置失败')
    } catch (error) {
        console.error('❌ 获取全局配置失败:', error)
        throw error
    }
}

/**
 * 测试全局配置连接 - 根据API文档实现
 */
export async function testGlobalConfigApi() {
    try {
        console.log('📞 开始测试全局配置连接')

        const response = await request(API_ROUTES.GLOBAL_CONFIG.TEST, {
            method: 'POST'
        })

        console.log('📥 测试全局配置API响应:', response)

        if (response && response.code === 200) {
            console.log('✅ 全局配置连接测试成功')
            return response.data
        }

        throw new Error(response?.message || '全局配置连接测试失败')
    } catch (error) {
        console.error('❌ 全局配置连接测试失败:', error)
        throw error
    }
}

/**
 * 清除全局配置 - 根据API文档实现
 */
export async function clearGlobalConfigApi() {
    try {
        console.log('🧹 开始清除全局配置')

        const response = await request(API_ROUTES.GLOBAL_CONFIG.CLEAR, {
            method: 'DELETE'
        })

        console.log('📥 清除全局配置API响应:', response)

        if (response && response.code === 200) {
            console.log('✅ 全局配置清除成功')
            return response.data
        }

        throw new Error(response?.message || '清除全局配置失败')
    } catch (error) {
        console.error('❌ 清除全局配置失败:', error)
        throw error
    }
}

// ===========================================
// 工具函数
// ===========================================

/**
 * 自动重试机制
 * @param {function} apiFunction API函数
 * @param {number} maxRetries 最大重试次数
 * @param {number} delay 重试延迟(毫秒)
 */
export async function retryRequest(apiFunction, maxRetries = 3, delay = 1000) {
    let lastError = null

    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await apiFunction()
        } catch (error) {
            lastError = error

            // 如果是认证错误，不重试
            if (error.message === '未登录' || error.message === '认证失败') {
                throw error
            }

            // 最后一次重试失败
            if (i === maxRetries) {
                throw error
            }

            // 等待后重试
            await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
    }

    throw lastError
}

/**
 * 检查并刷新令牌
 */
export async function checkAndRefreshToken() {
    try {
        const token = uni.getStorageSync('token')
        const refreshToken = uni.getStorageSync('refreshToken')

        if (!token || !refreshToken) {
            return false
        }

        // 检查token是否快要过期
        const loginTime = uni.getStorageSync('loginTime')

        if (loginTime) {
            const now = new Date()
            const login = new Date(loginTime)
            const diffMinutes = (now - login) / (1000 * 60)

            // 如果登录超过50分钟（Token有效期1小时，提前10分钟刷新），尝试刷新token
            if (diffMinutes > 50) {
                console.log('🔄 Token即将过期，主动刷新...')
                await refreshTokenApi()
                return true
            }
        }

        return true
    } catch (error) {
        console.error('❌ 检查和刷新令牌失败:', error)
        return false
    }
}

/**
 * 批量请求处理
 * @param {Array} requests 请求配置数组
 * @returns {Promise} 所有请求的结果
 */
export async function batchRequests(requests) {
    try {
        const promises = requests.map(config => {
            return request(config.url, config.options)
        })

        const results = await Promise.allSettled(promises)
        return results.map((result, index) => ({
            index,
            success: result.status === 'fulfilled',
            data: result.status === 'fulfilled' ? result.value : null,
            error: result.status === 'rejected' ? result.reason : null
        }))
    } catch (error) {
        console.error('批量请求失败:', error)
        throw error
    }
}

/**
 * 下载文件
 * @param {string} downloadUrl 下载链接
 * @param {string} fileName 文件名
 */
export function downloadFile(downloadUrl, fileName) {
    try {
        uni.downloadFile({
            url: downloadUrl,
            success: (res) => {
                if (res.statusCode === 200) {
                    uni.saveFile({
                        tempFilePath: res.tempFilePath,
                        success: (saveRes) => {
                            uni.showToast({
                                title: '文件保存成功',
                                icon: 'success'
                            })
                        },
                        fail: (error) => {
                            console.error('文件保存失败:', error)
                            uni.showToast({
                                title: '文件保存失败',
                                icon: 'none'
                            })
                        }
                    })
                }
            },
            fail: (error) => {
                console.error('文件下载失败:', error)
                uni.showToast({
                    title: '文件下载失败',
                    icon: 'none'
                })
            }
        })
    } catch (error) {
        console.error('下载文件异常:', error)
    }
}

// 导出默认配置和工具函数
export default {
    request,
    uploadFile,
    downloadFile,
    retryRequest,
    checkAndRefreshToken,
    batchRequests,
    API_CONFIG
}
