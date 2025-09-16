// 认证调试工具
export function debugAuthState() {
    const token = uni.getStorageSync('token')
    const isLoggedIn = uni.getStorageSync('isLoggedIn')
    const userInfo = uni.getStorageSync('userInfo')

    console.group('🔍 认证状态调试信息')
    console.log('登录状态:', isLoggedIn)
    console.log('Token存在:', !!token)
    console.log('Token长度:', token ? token.length : 0)
    console.log('Token前20字符:', token ? token.substring(0, 20) + '...' : 'null')
    console.log('用户信息:', userInfo)

    // 尝试解析JWT token（如果是JWT格式）
    if (token) {
        try {
            const parts = token.split('.')
            if (parts.length === 3) {
                // 这是JWT token
                const header = JSON.parse(atob(parts[0]))
                const payload = JSON.parse(atob(parts[1]))
                console.log('JWT Header:', header)
                console.log('JWT Payload:', payload)
                console.log('JWT过期时间:', payload.exp ? new Date(payload.exp * 1000) : '未设置')
                console.log('当前时间:', new Date())
                console.log('Token是否过期:', payload.exp ? (payload.exp * 1000 < Date.now()) : '无法判断')
            }
        } catch (e) {
            console.log('Token不是标准JWT格式或解析失败')
        }
    }
    console.groupEnd()
}

// 测试API连接（测试用户信息接口）
export async function testApiConnection() {
    try {
        console.log('🧪 测试基础API连接...')

        // 使用配置文件中的API地址
        const { getCurrentConfig } = await import('../config/api-config.js')
        const config = getCurrentConfig()

        // 测试系统健康检查接口（通常不需要认证）
        const response = await uni.request({
            url: `${config.BASE_URL}/system/health`,
            method: 'GET',
            header: {
                'Content-Type': 'application/json'
            },
            timeout: 5000 // 5秒超时
        })
        console.log('📡 基础API响应:', response)
        return response
    } catch (error) {
        console.error('❌ 基础API调用失败:', error)
        console.warn('⚠️ 可能的原因：1) 后端服务未启动 2) 端口配置错误 3) 网络连接问题')
        return null
    }
}

// 测试API连接（带认证 - 用户信息接口）
export async function testApiConnectionWithAuth() {
    try {
        const token = uni.getStorageSync('token')
        if (!token) {
            console.log('❌ 没有token，无法测试认证API')
            return null
        }

        console.log('🔐 测试认证API（用户信息接口）...')

        // 使用配置文件中的API地址
        const { getCurrentConfig } = await import('../config/api-config.js')
        const config = getCurrentConfig()

        const response = await uni.request({
            url: `${config.BASE_URL}/users/profile`,
            method: 'GET',
            header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            timeout: 10000 // 10秒超时
        })
        console.log('🔐 认证API响应:', response)
        return response
    } catch (error) {
        console.error('❌ 认证API调用失败:', error)
        console.warn('⚠️ 认证API测试失败，可能是token过期或后端服务问题')
        return null
    }
}
