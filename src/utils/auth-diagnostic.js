// 认证诊断工具
import { getCurrentUser, isLoggedIn } from './auth.js'
import { getCurrentConfig } from '../config/api-config.js'

/**
 * 完整的认证状态诊断
 * @returns {Object} 诊断结果
 */
export function diagnoseAuthState() {
    const diagnosis = {
        timestamp: new Date().toISOString(),
        storage: {},
        auth: {},
        api: {},
        issues: [],
        recommendations: []
    }

    try {
        // 1. 检查本地存储
        diagnosis.storage = {
            token: uni.getStorageSync('token'),
            refreshToken: uni.getStorageSync('refreshToken'),
            userInfo: uni.getStorageSync('userInfo'),
            isLoggedIn: uni.getStorageSync('isLoggedIn'),
            loginTime: uni.getStorageSync('loginTime')
        }

        // 2. 检查认证状态
        diagnosis.auth = {
            isLoggedInCheck: isLoggedIn(),
            hasToken: !!diagnosis.storage.token,
            hasRefreshToken: !!diagnosis.storage.refreshToken,
            hasUserInfo: !!diagnosis.storage.userInfo,
            tokenLength: diagnosis.storage.token ? diagnosis.storage.token.length : 0,
            tokenPreview: diagnosis.storage.token ?
                diagnosis.storage.token.substring(0, 20) + '...' : null
        }

        // 3. 检查API配置
        const apiConfig = getCurrentConfig()
        diagnosis.api = {
            baseUrl: apiConfig.BASE_URL,
            timeout: apiConfig.TIMEOUT,
            historyUrl: `${apiConfig.BASE_URL}/documents/history`
        }

        // 4. 分析问题
        if (!diagnosis.storage.isLoggedIn) {
            diagnosis.issues.push('用户未登录状态 (isLoggedIn = false)')
            diagnosis.recommendations.push('需要重新登录')
        }

        if (!diagnosis.storage.token) {
            diagnosis.issues.push('缺少JWT Token')
            diagnosis.recommendations.push('检查登录流程，确保token正确保存')
        }

        if (diagnosis.storage.isLoggedIn && !diagnosis.storage.token) {
            diagnosis.issues.push('登录状态与token不一致')
            diagnosis.recommendations.push('清理认证状态并重新登录')
        }

        if (diagnosis.storage.token && diagnosis.storage.token.length < 50) {
            diagnosis.issues.push('Token长度异常，可能不是有效的JWT')
            diagnosis.recommendations.push('检查登录API响应格式')
        }

        if (!diagnosis.storage.userInfo) {
            diagnosis.issues.push('用户信息缺失')
            diagnosis.recommendations.push('检查登录时用户信息保存')
        }

        // 5. 检查token有效性（简单验证）
        if (diagnosis.storage.token) {
            try {
                const tokenParts = diagnosis.storage.token.split('.')
                if (tokenParts.length !== 3) {
                    diagnosis.issues.push('Token格式不正确，不是标准JWT格式')
                    diagnosis.recommendations.push('检查后端返回的token格式')
                }
            } catch (error) {
                diagnosis.issues.push('Token解析失败')
            }
        }

        // 6. 检查登录时间
        if (diagnosis.storage.loginTime) {
            const loginTime = new Date(diagnosis.storage.loginTime)
            const now = new Date()
            const diffMinutes = (now - loginTime) / (1000 * 60)

            diagnosis.auth.loginTimeAgo = Math.round(diffMinutes)

            if (diffMinutes > 60) {
                diagnosis.issues.push(`Token可能已过期 (登录于${Math.round(diffMinutes)}分钟前)`)
                diagnosis.recommendations.push('尝试刷新token或重新登录')
            }
        }

    } catch (error) {
        diagnosis.issues.push(`诊断过程出错: ${error.message}`)
    }

    return diagnosis
}

/**
 * 打印认证诊断报告
 */
export function printAuthDiagnosis() {
    const diagnosis = diagnoseAuthState()

    console.log('🔍 ===== 认证状态诊断报告 =====')
    console.log('🕐 诊断时间:', diagnosis.timestamp)
    console.log('')

    console.log('📦 本地存储状态:')
    console.log('  - Token:', diagnosis.storage.token ? `存在 (${diagnosis.auth.tokenLength}字符)` : '不存在')
    console.log('  - RefreshToken:', diagnosis.storage.refreshToken ? '存在' : '不存在')
    console.log('  - 登录状态:', diagnosis.storage.isLoggedIn)
    console.log('  - 用户信息:', diagnosis.storage.userInfo ? '存在' : '不存在')
    console.log('  - 登录时间:', diagnosis.storage.loginTime || '未知')
    console.log('')

    console.log('🔐 认证检查结果:')
    console.log('  - isLoggedIn():', diagnosis.auth.isLoggedInCheck)
    console.log('  - 登录时间差:', diagnosis.auth.loginTimeAgo ? `${diagnosis.auth.loginTimeAgo}分钟前` : '未知')
    console.log('  - Token预览:', diagnosis.auth.tokenPreview || '无')
    console.log('')

    console.log('🌐 API配置:')
    console.log('  - 基础URL:', diagnosis.api.baseUrl)
    console.log('  - 历史API:', diagnosis.api.historyUrl)
    console.log('')

    if (diagnosis.issues.length > 0) {
        console.log('❌ 发现问题:')
        diagnosis.issues.forEach((issue, index) => {
            console.log(`  ${index + 1}. ${issue}`)
        })
        console.log('')
    }

    if (diagnosis.recommendations.length > 0) {
        console.log('💡 建议操作:')
        diagnosis.recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`)
        })
    }

    console.log('================================')

    return diagnosis
}

/**
 * 修复常见认证问题
 */
export function fixAuthIssues() {
    console.log('🔧 尝试修复认证问题...')

    const diagnosis = diagnoseAuthState()

    // 修复状态不一致问题
    if (diagnosis.storage.isLoggedIn && !diagnosis.storage.token) {
        console.log('🧹 清理不一致的登录状态...')
        uni.removeStorageSync('isLoggedIn')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('loginTime')

        uni.showModal({
            title: '认证状态异常',
            content: '检测到认证状态不一致，已清理。请重新登录。',
            showCancel: false,
            confirmText: '去登录',
            success: () => {
                uni.reLaunch({
                    url: '/pages/login/login'
                })
            }
        })
        return true
    }

    // 修复过期token
    if (diagnosis.auth.loginTimeAgo && diagnosis.auth.loginTimeAgo > 60) {
        console.log('🕐 清理过期认证信息...')
        uni.removeStorageSync('token')
        uni.removeStorageSync('refreshToken')
        uni.removeStorageSync('isLoggedIn')
        uni.removeStorageSync('userInfo')
        uni.removeStorageSync('loginTime')

        uni.showModal({
            title: '登录已过期',
            content: '您的登录已过期，请重新登录。',
            showCancel: false,
            confirmText: '去登录',
            success: () => {
                uni.reLaunch({
                    url: '/pages/login/login'
                })
            }
        })
        return true
    }

    console.log('✅ 未发现可自动修复的问题')
    return false
}




