// 用户认证状态管理工具

/**
 * 检查用户是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
    try {
        return uni.getStorageSync('isLoggedIn') === true
    } catch (error) {
        console.error('检查登录状态失败:', error)
        return false
    }
}

/**
 * 获取当前用户信息
 * @returns {object|null} 用户信息对象或null
 */
export function getCurrentUser() {
    try {
        const userInfo = uni.getStorageSync('userInfo')
        return userInfo || null
    } catch (error) {
        console.error('获取用户信息失败:', error)
        return null
    }
}

/**
 * 设置用户登录状态
 * @param {object} userInfo 用户信息
 */
export function setUserLogin(userInfo) {
    try {
        uni.setStorageSync('userInfo', userInfo)
        uni.setStorageSync('isLoggedIn', true)
        uni.setStorageSync('loginTime', new Date().toISOString())
    } catch (error) {
        console.error('设置登录状态失败:', error)
        throw error
    }
}

/**
 * 用户登出（本地清理）
 */
export function logout() {
    try {
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('isLoggedIn')
        uni.removeStorageSync('loginTime')
        uni.removeStorageSync('token')
        uni.removeStorageSync('refreshToken')

        // 可选：保留记住的用户名
        // uni.removeStorageSync('rememberedUsername')

        // 跳转到登录页面
        uni.reLaunch({
            url: '/pages/login/login'
        })
    } catch (error) {
        console.error('登出失败:', error)
    }
}

/**
 * 清理异常的认证状态（用于修复认证状态不一致的问题）
 */
export function clearAuthState() {
    try {
        console.log('🧹 清理所有认证状态')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('isLoggedIn')
        uni.removeStorageSync('loginTime')
        uni.removeStorageSync('token')
        uni.removeStorageSync('refreshToken')
        console.log('✅ 认证状态清理完成')
    } catch (error) {
        console.error('清理认证状态失败:', error)
    }
}

/**
 * 检查登录状态并重定向
 * @param {string} redirectUrl 未登录时的重定向URL，默认为登录页
 */
export function checkAuthAndRedirect(redirectUrl = '/pages/login/login') {
    const hasLoginStatus = isLoggedIn()
    const hasToken = uni.getStorageSync('token')

    // 如果状态不一致（有登录状态但没有token），清理所有认证信息
    if (hasLoginStatus && !hasToken) {
        console.warn('⚠️ 认证状态不一致，清理所有认证信息')
        logout()
        return false
    }

    if (!hasLoginStatus || !hasToken) {
        console.log('认证失败，跳转到登录页')
        uni.reLaunch({
            url: redirectUrl
        })
        return false
    }
    return true
}

/**
 * 强制登录检查（用于页面onLoad）
 * 如果未登录，立即跳转到登录页
 */
export function requireAuth() {
    const isAuthenticated = checkAuthAndRedirect()
    if (!isAuthenticated) {
        throw new Error('需要登录')
    }
    return true
}

/**
 * 获取认证头信息（用于API请求）
 * @returns {object} 包含认证信息的头部对象
 */
export function getAuthHeaders() {
    const userInfo = getCurrentUser()
    if (!userInfo) {
        return {}
    }

    return {
        'Authorization': `Bearer ${userInfo.token}`,
        'User-ID': userInfo.id || userInfo.username
    }
}

/**
 * 验证token是否有效（模拟）
 * @returns {boolean} token是否有效
 */
export function validateToken() {
    const loginTime = uni.getStorageSync('loginTime')
    if (!loginTime) {
        return false
    }

    // 模拟token有效期为7天
    const loginDate = new Date(loginTime)
    const now = new Date()
    const diffDays = (now - loginDate) / (1000 * 60 * 60 * 24)

    return diffDays < 7
}

/**
 * 更新用户信息
 * @param {object} updates 要更新的用户信息字段
 */
export function updateUserInfo(updates) {
    try {
        const currentUser = getCurrentUser()
        if (!currentUser) {
            throw new Error('用户未登录')
        }

        const updatedUser = { ...currentUser, ...updates }
        uni.setStorageSync('userInfo', updatedUser)
        return updatedUser
    } catch (error) {
        console.error('更新用户信息失败:', error)
        throw error
    }
}

/**
 * 格式化用户显示名称
 * @param {object} userInfo 用户信息
 * @returns {string} 显示名称
 */
export function getUserDisplayName(userInfo = null) {
    const user = userInfo || getCurrentUser()
    if (!user) return '游客'

    return user.displayName || user.username || user.email?.split('@')[0] || '用户'
}

/**
 * 检查用户权限（扩展功能）
 * @param {string} permission 权限名称
 * @returns {boolean} 是否有权限
 */
export function hasPermission(permission) {
    const user = getCurrentUser()
    if (!user) return false

    // 简单的权限检查逻辑，可以根据需要扩展
    const userPermissions = user.permissions || ['basic']
    return userPermissions.includes(permission) || userPermissions.includes('admin')
}

// 自动检查token有效性的函数
export function autoCheckAuth() {
    if (isLoggedIn() && !validateToken()) {
        logout()
        uni.showToast({
            title: '登录已过期，请重新登录',
            icon: 'none'
        })
    }
}

/**
 * 获取API设置
 * @deprecated 已弃用，请使用全局配置API
 * @returns {object} API配置对象
 */
export function getApiSettings() {
    try {
        const settings = uni.getStorageSync('apiSettings')
        return settings || {
            apiKey: '',
            baseUrl: '',
            timeout: 60,
            selectedModel: 'deepseek-chat'
        }
    } catch (error) {
        console.error('获取API设置失败:', error)
        return {
            apiKey: '',
            baseUrl: '',
            timeout: 60,
            selectedModel: 'deepseek-chat'
        }
    }
}

/**
 * 保存API设置
 * @deprecated 已弃用，请使用全局配置API
 * @param {object} settings API设置对象
 */
export function saveApiSettings(settings) {
    try {
        uni.setStorageSync('apiSettings', settings)
        return true
    } catch (error) {
        console.error('保存API设置失败:', error)
        return false
    }
}

/**
 * 获取选中的模型名称
 * @deprecated 已弃用，请使用全局配置API
 * @returns {string} 模型名称
 */
export function getSelectedModel() {
    try {
        const savedModel = uni.getStorageSync('selectedModel')
        // 兼容旧格式（对象）和新格式（字符串）
        if (typeof savedModel === 'string') {
            return savedModel
        } else if (savedModel && savedModel.id) {
            return savedModel.id
        }
        return 'deepseek-chat' // 默认模型
    } catch (error) {
        console.error('获取模型设置失败:', error)
        return 'deepseek-chat'
    }
}


