// API调试工具 - 专门用于调试历史记录API响应格式

import { getDocumentHistoryApi } from './api.js'
import { getCurrentConfig } from '../config/api-config.js'

/**
 * 调试历史记录API响应格式
 */
export async function debugHistoryApiResponse() {
    console.log('🔍 ===== 历史记录API调试 =====')

    try {
        // 直接调用底层request函数，获取原始响应
        const API_CONFIG = getCurrentConfig()
        const url = `/documents/history?page=1&pageSize=5`

        console.log('📡 发送原始请求:', `${API_CONFIG.BASE_URL}${url}`)

        // 手动构建请求
        const token = uni.getStorageSync('token')
        const headers = {
            'Content-Type': 'application/json'
        }

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        return new Promise((resolve, reject) => {
            uni.request({
                url: `${API_CONFIG.BASE_URL}${url}`,
                method: 'GET',
                header: headers,
                success: (res) => {
                    console.log('📥 原始响应状态:', res.statusCode)
                    console.log('📥 原始响应头:', res.header)
                    console.log('📥 原始响应数据:', res.data)
                    console.log('📥 响应数据类型:', typeof res.data)

                    // 详细分析数据结构
                    if (res.data) {
                        console.log('🔍 数据结构分析:')
                        console.log('  - res.data keys:', Object.keys(res.data))

                        if (res.data.data) {
                            console.log('  - res.data.data keys:', Object.keys(res.data.data))

                            if (res.data.data.data) {
                                console.log('  - res.data.data.data keys:', Object.keys(res.data.data.data))

                                if (res.data.data.data.documents) {
                                    console.log('  - res.data.data.data.documents 长度:', res.data.data.data.documents.length)
                                    console.log('  - 第一条记录:', res.data.data.data.documents[0])
                                }
                            }

                            if (res.data.data.documents) {
                                console.log('  - res.data.data.documents 长度:', res.data.data.documents.length)
                                console.log('  - 第一条记录:', res.data.data.documents[0])
                            }
                        }

                        if (res.data.documents) {
                            console.log('  - res.data.documents 长度:', res.data.documents.length)
                            console.log('  - 第一条记录:', res.data.documents[0])
                        }

                        if (res.data.items) {
                            console.log('  - res.data.items 长度:', res.data.items.length)
                            console.log('  - 第一条记录:', res.data.items[0])
                        }
                    }

                    console.log('================================')
                    resolve(res.data)
                },
                fail: (error) => {
                    console.error('❌ 原始请求失败:', error)
                    reject(error)
                }
            })
        })

    } catch (error) {
        console.error('❌ 调试过程出错:', error)
        throw error
    }
}

/**
 * 比较API包装函数和原始响应的差异
 */
export async function compareApiResponses() {
    console.log('🔍 ===== 比较API响应 =====')

    try {
        // 1. 获取原始响应
        console.log('1️⃣ 获取原始响应...')
        const rawResponse = await debugHistoryApiResponse()

        // 2. 获取包装后的响应
        console.log('2️⃣ 获取包装后的响应...')
        const wrappedResponse = await getDocumentHistoryApi({
            page: 1,
            pageSize: 5
        })

        console.log('📊 比较结果:')
        console.log('  - 原始响应记录数:', rawResponse?.data?.data?.documents?.length || rawResponse?.data?.documents?.length || rawResponse?.data?.items?.length || 0)
        console.log('  - 包装后记录数:', wrappedResponse?.records?.length || 0)

        return {
            raw: rawResponse,
            wrapped: wrappedResponse
        }

    } catch (error) {
        console.error('❌ 比较过程出错:', error)
        throw error
    }
}

// 全局暴露调试函数（仅开发环境）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.debugHistoryApi = debugHistoryApiResponse
    window.compareApiResponses = compareApiResponses
    console.log('🔧 调试函数已暴露到全局:')
    console.log('  - window.debugHistoryApi()')
    console.log('  - window.compareApiResponses()')
}
