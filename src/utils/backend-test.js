// 后端连接测试工具
import { getCurrentConfig } from '../config/api-config.js'

/**
 * 测试后端连接
 */
export async function testBackendConnection() {
    const API_CONFIG = getCurrentConfig()
    const testUrl = `${API_CONFIG.BASE_URL}/system/health`

    console.log('🔍 测试后端连接:', testUrl)

    return new Promise((resolve, reject) => {
        uni.request({
            url: testUrl,
            method: 'GET',
            timeout: 10000,
            success: (res) => {
                console.log('✅ 后端连接测试成功:', {
                    statusCode: res.statusCode,
                    data: res.data
                })
                resolve({
                    connected: true,
                    statusCode: res.statusCode,
                    data: res.data
                })
            },
            fail: (error) => {
                console.error('❌ 后端连接测试失败:', error)
                resolve({
                    connected: false,
                    error: error
                })
            }
        })
    })
}

/**
 * 测试文件上传接口是否可达
 */
export async function testUploadEndpoint() {
    const API_CONFIG = getCurrentConfig()
    const uploadUrl = `${API_CONFIG.BASE_URL}/documents/upload`

    console.log('🔍 测试上传接口:', uploadUrl)

    const token = uni.getStorageSync('token')

    return new Promise((resolve, reject) => {
        // 发送一个OPTIONS请求测试接口是否存在
        uni.request({
            url: uploadUrl,
            method: 'OPTIONS',
            header: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            timeout: 5000,
            success: (res) => {
                console.log('✅ 上传接口测试成功:', {
                    statusCode: res.statusCode,
                    headers: res.header
                })
                resolve({
                    available: true,
                    statusCode: res.statusCode,
                    headers: res.header
                })
            },
            fail: (error) => {
                console.log('⚠️ 上传接口测试:', error)
                resolve({
                    available: false,
                    error: error
                })
            }
        })
    })
}

/**
 * 检查文件是否真正上传到后端
 */
export async function checkFileOnServer(documentId) {
    const API_CONFIG = getCurrentConfig()
    const checkUrl = `${API_CONFIG.BASE_URL}/documents/${documentId}`

    console.log('🔍 检查服务器文件:', checkUrl)

    const token = uni.getStorageSync('token')

    return new Promise((resolve) => {
        uni.request({
            url: checkUrl,
            method: 'GET',
            header: {
                'Authorization': token ? `Bearer ${token}` : ''
            },
            timeout: 5000,
            success: (res) => {
                console.log('✅ 服务器文件检查成功:', res.data)
                resolve({
                    exists: true,
                    data: res.data
                })
            },
            fail: (error) => {
                console.log('❌ 服务器文件检查失败:', error)
                resolve({
                    exists: false,
                    error: error
                })
            }
        })
    })
}

/**
 * 完整的上传验证流程
 */
export async function fullUploadVerification(documentId) {
    console.log('🚀 开始完整上传验证流程...')

    const results = {
        backendConnection: await testBackendConnection(),
        uploadEndpoint: await testUploadEndpoint(),
        fileOnServer: documentId ? await checkFileOnServer(documentId) : null
    }

    console.log('📋 上传验证结果:', results)

    return results
}

