# 前端对接API文档

## 基础信息

**后端地址**: `http://localhost:52198/api/`

**认证方式**: JWT Bearer Token

**内容类型**: 
- JSON请求: `application/json`
- 文件上传: `multipart/form-data`

## 1. 用户认证

### 1.1 用户登录

**接口地址**: `POST /api/auth/login`

**请求参数**:
```json
{
    "username": "your_username",
    "password": "your_password"
}
```

**成功响应**:
```json
{
    "success": true,
    "code": 200,
    "message": "登录成功",
    "data": {
        "user": {
            "id": "uuid",
            "username": "your_username",
            "email": "user@example.com"
        },
        "tokens": {
            "accessToken": "jwt-access-token",
            "refreshToken": "jwt-refresh-token"
        }
    }
}
```

**前端示例**:
```javascript
// 使用前端封装的API
import { loginApi } from '@/utils/api.js'

const loginData = {
    username: 'your_username',
    password: 'your_password'
}

try {
    const result = await loginApi(loginData)
    console.log('登录成功:', result)
    // Token会自动保存到本地存储
} catch (error) {
    console.error('登录失败:', error.message)
}
```

## 2. 文件上传接口

### 2.1 上传文档

**接口地址**: `POST /api/documents/upload`

**请求头**:
```
Authorization: Bearer your-jwt-token
Content-Type: multipart/form-data
```

**请求参数** (FormData):
| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| file | File | 是 | PDF文件，最大50MB |
| documentType | String | 是 | 文档类型：fund_contract/custody_agreement/prospectus |
| description | String | 否 | 文档描述 |
| folder | String | 否 | 文档文件夹名称 |
| tags | String | 否 | JSON格式的标签数组，如：`["标签1","标签2"]` |

**成功响应**:
```json
{
    "success": true,
    "code": 200,
    "message": "文件上传成功",
    "data": {
        "id": "document-uuid",
        "fileName": "fund_contract_20250910_113308.pdf",
        "originalName": "contract.pdf",
        "documentType": "fund_contract",
        "description": "文档描述",
        "folder": "文件夹名称",
        "status": "UPLOADED"
    }
}
```

**错误响应**:
```json
{
    "success": false,
    "code": 400,
    "message": "文件上传失败",
    "error": {
        "type": "VALIDATION_ERROR",
        "details": [
            {
                "field": "file",
                "message": "文件格式不支持"
            }
        ]
    }
}
```

### 2.2 前端上传实现

#### 使用封装的API函数
```javascript
import { uploadDocumentApi } from '@/utils/api.js'

async function uploadFile() {
    try {
        // 文件选择
        const fileResult = await uni.chooseFile({
            count: 1,
            type: 'file',
            extension: ['.pdf']
        })
        
        const filePath = fileResult.tempFiles[0].path
        const documentType = 'fund_contract' // 或其他类型
        
        // 上传选项
        const options = {
            description: '基金合同文档',
            folder: 'fund_documents',
            tags: ['基金文档', '合同']
        }
        
        // 执行上传（带进度回调）
        const result = await uploadDocumentApi(
            filePath,
            documentType,
            options,
            (progress) => {
                console.log('上传进度:', progress + '%')
            }
        )
        
        console.log('上传成功:', result)
        return result
        
    } catch (error) {
        console.error('上传失败:', error.message)
        throw error
    }
}
```

#### 使用原生uni.uploadFile
```javascript
function uploadFileNative() {
    const token = uni.getStorageSync('token')
    
    return new Promise((resolve, reject) => {
        uni.uploadFile({
            url: 'http://localhost:52198/api/documents/upload',
            filePath: filePath,
            name: 'file',
            formData: {
                documentType: 'fund_contract',
                description: '文档描述',
                folder: '文件夹名称',
                tags: JSON.stringify(['标签1', '标签2'])
            },
            header: {
                'Authorization': `Bearer ${token}`
            },
            success: (res) => {
                const data = JSON.parse(res.data)
                if (data.success) {
                    resolve(data.data)
                } else {
                    reject(new Error(data.message))
                }
            },
            fail: reject
        })
    })
}
```

### 2.3 React/Vue H5示例

```javascript
// React示例
async function uploadFileReact(file) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentType', 'fund_contract')
    formData.append('description', '文档描述')
    formData.append('folder', '文件夹名称')
    formData.append('tags', JSON.stringify(['标签1', '标签2']))
    
    const token = localStorage.getItem('token')
    
    try {
        const response = await fetch('http://localhost:52198/api/documents/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
            console.log('上传成功:', result.data)
            return result.data
        } else {
            throw new Error(result.message)
        }
    } catch (error) {
        console.error('上传失败:', error)
        throw error
    }
}
```

## 3. 错误处理

### 3.1 常见错误码

| HTTP状态码 | 业务码 | 说明 |
|------------|--------|------|
| 200 | 200 | 成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未授权/Token过期 |
| 403 | 403 | 权限不足 |
| 413 | 413 | 文件过大 |
| 415 | 415 | 文件格式不支持 |
| 422 | 422 | 数据验证失败 |
| 500 | 500 | 服务器内部错误 |

### 3.2 错误处理示例

```javascript
try {
    const result = await uploadDocumentApi(filePath, documentType, options)
    // 处理成功
} catch (error) {
    switch (error.message) {
        case '文件大小超过限制':
            uni.showToast({ title: '文件不能超过50MB', icon: 'none' })
            break
        case '只支持PDF格式文件':
            uni.showToast({ title: '请选择PDF文件', icon: 'none' })
            break
        case '登录已过期，请重新登录':
            // 跳转到登录页
            uni.reLaunch({ url: '/pages/login/login' })
            break
        default:
            uni.showToast({ title: error.message || '上传失败', icon: 'none' })
    }
}
```

## 4. 文档类型说明

### 4.1 支持的文档类型

| 类型值 | 名称 | 说明 |
|--------|------|------|
| fund_contract | 基金合同 | 基金合同相关文档 |
| custody_agreement | 托管协议 | 基金托管协议文档 |
| prospectus | 招募说明书 | 基金招募说明书文档 |

### 4.2 文件限制

- **文件格式**: 仅支持PDF格式
- **文件大小**: 最大50MB
- **文件名**: 支持中文文件名
- **编码**: 支持UTF-8编码

## 5. 完整的上传流程示例

```javascript
// 完整的文件上传组件示例
export default {
    data() {
        return {
            selectedFile: null,
            documentType: '',
            uploadProgress: 0,
            isUploading: false
        }
    },
    
    methods: {
        // 选择文件
        async chooseFile() {
            try {
                const result = await uni.chooseFile({
                    count: 1,
                    type: 'file',
                    extension: ['.pdf']
                })
                
                this.selectedFile = {
                    name: result.tempFiles[0].name,
                    size: result.tempFiles[0].size,
                    path: result.tempFiles[0].path
                }
                
            } catch (error) {
                uni.showToast({ title: '文件选择失败', icon: 'none' })
            }
        },
        
        // 上传文件
        async uploadFile() {
            if (!this.selectedFile || !this.documentType) {
                uni.showToast({ title: '请先选择文件和文档类型', icon: 'none' })
                return
            }
            
            this.isUploading = true
            this.uploadProgress = 0
            
            try {
                const options = {
                    description: `${this.documentType}文档上传`,
                    folder: 'fund_documents',
                    tags: ['基金文档']
                }
                
                const result = await uploadDocumentApi(
                    this.selectedFile.path,
                    this.documentType,
                    options,
                    (progress) => {
                        this.uploadProgress = progress
                    }
                )
                
                uni.showToast({ title: '上传成功', icon: 'success' })
                
                // 保存文档ID用于后续操作
                this.uploadedDocumentId = result.id
                
            } catch (error) {
                console.error('上传失败:', error)
                uni.showToast({ 
                    title: error.message || '上传失败', 
                    icon: 'none' 
                })
            } finally {
                this.isUploading = false
            }
        }
    }
}
```

## 6. 注意事项

1. **Token管理**: 前端需要自动处理Token过期和刷新
2. **文件验证**: 上传前应在前端进行基本的文件格式和大小验证
3. **进度显示**: 大文件上传时应显示上传进度
4. **错误处理**: 需要对各种错误情况进行友好的用户提示
5. **网络重试**: 网络不稳定时可以实现上传重试机制

## 7. 调试信息

开发时可以在浏览器控制台查看详细的API调用日志：

```javascript
// 开启调试模式
console.log('🔗 API请求URL:', fullUrl)
console.log('📤 上传参数:', formData)
console.log('📥 API响应:', response)
```

所有的API调用都会在控制台输出详细的调试信息，便于开发调试。










