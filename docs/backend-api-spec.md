## 后端接口规范（供后端开发对接）

说明：以下接口依据前端现有实现整理。所有 REST 接口均以 `BASE_URL` 作为前缀（具体地址请根据实际部署环境配置）。除特别说明外，均需要在 Header 中携带 `Authorization: Bearer <accessToken>`。

### 认证与用户

- POST /auth/login
  - 描述：用户登录
  - 是否鉴权：否
  - 请求体（JSON）：
    - username: string
    - password: string
    - rememberMe: boolean（可选）
  - 响应（200）：
    - code: 200
    - data: { user: object, tokens: { accessToken: string, refreshToken: string } }

- POST /auth/register
  - 描述：用户注册
  - 是否鉴权：否
  - 请求体（JSON）：
    - email: string
    - password: string
    - confirmPassword: string
    - firstName: string
    - lastName: string
    - username: string
    - phone: string（可选）
    - company: string（可选）
    - agreement: { termsOfService: boolean, privacyPolicy: boolean, version: string }
  - 响应（201）：
    - code: 201
    - data: { user: object, tokens?: { accessToken: string, refreshToken: string } }

- POST /auth/refresh
  - 描述：刷新访问令牌
  - 是否鉴权：否
  - 请求体（JSON）：
    - refreshToken: string
  - 响应（200）：
    - code: 200
    - data: { tokens: { accessToken: string, refreshToken: string } }

- POST /auth/logout
  - 描述：退出登录
  - 是否鉴权：是
  - 请求体：无
  - 响应（200）：{ code: 200 }

- GET /users/profile
  - 描述：获取当前用户信息
  - 是否鉴权：是
  - 响应（200）：
    - code: 200
    - data: { user: { id, username, email, firstName, lastName, avatar, ... } }

- PUT /users/profile/update
  - 描述：更新用户信息
  - 是否鉴权：是
  - 请求体（JSON）：用户可编辑字段（如 firstName、lastName、phone、company 等）
  - 响应（200）：
    - code: 200
    - data: { user: object }

- POST /users/avatar
  - 描述：上传头像（multipart/form-data）
  - 是否鉴权：是
  - 表单字段：
    - file: 二进制文件
  - 响应（200）：{ code: 200, data: { url?: string, ... } }

- PUT /users/password
  - 描述：修改密码
  - 是否鉴权：是
  - 请求体（JSON）：
    - oldPassword: string
    - newPassword: string
  - 响应（200）：{ code: 200 }

### 文档处理

- POST /documents/upload
  - 描述：上传PDF文档（multipart/form-data）
  - 是否鉴权：是
  - 表单字段：
    - file: 二进制文件
    - documentType: string（如：基金公告类型）
    - tags: string[]（可选）
    - description: string（可选）
    - folder: string（可选）
  - 响应（200）：
    - code: 200
    - data: { document: { id: string, name, size, contentType, ... } }

- POST /documents/{fileId}/extract
  - 描述：发起结构化数据提取任务
  - 是否鉴权：是
  - 路径参数：
    - fileId: string
  - 请求体（JSON）：
    - extractionConfig: {
        provider: "deepseek",
        model: string,
        apiKey: string,
        baseUrl: string,    // 例如 https://api.deepseek.com/v1/chat/completions
        temperature: number,
        maxTokens: number,
        timeout: number,
        maxRetries: number
      }
    - extractionOptions: {
        mode: "full" | "partial",
        fieldsToExtract: string[],
        extractionDepth: "detailed" | "basic",
        includeConfidence: boolean,
        includeSourceReferences: boolean,
        validateResults: boolean,
        outputFormat: "structured" | "raw"
      }
    - processingOptions: {
        priority: "low" | "normal" | "high",
        async: boolean,
        notifyOnComplete: boolean,
        retainIntermediateResults: boolean
      }
  - 响应（200）：
    - code: 200
    - data: { task: { id: string, status: "pending"|"processing"|"completed"|"failed", createdAt, ... } }

- GET /documents/tasks/{taskId}/progress
  - 描述：查询提取任务进度
  - 是否鉴权：是
  - 路径参数：taskId: string
  - 响应（200）：
    - code: 200
    - data: { task: { id, status, progress: number(0-100), message?: string, updatedAt } }

- GET /documents/tasks/{taskId}/results?format=structured&includeMetadata=true&includeSourceRefs=true
  - 描述：获取提取结果
  - 是否鉴权：是
  - 路径参数：taskId: string
  - 查询参数：format、includeMetadata、includeSourceRefs
  - 响应（200）：
    - code: 200
    - data: { result: { fields: object, confidence?: object, sources?: object[], raw?: object } }

- GET /documents/field-config/{docType}
  - 描述：获取指定文档类型的字段配置
  - 是否鉴权：是
  - 路径参数：docType: string
  - 响应（200）：{ code: 200, data: object }

- GET /documents/history
  - 描述：获取文档处理历史列表（用于页面筛选与分页）
  - 是否鉴权：是
  - 查询参数（全部可选）：
    - page: number（默认1）
    - pageSize: number（默认20）
    - documentType: string（fund_contract|custody_agreement|prospectus）
    - status: string（completed|processing|failed|pending）
    - startDate: string（YYYY-MM-DD）
    - endDate: string（YYYY-MM-DD）
    - sortBy: string（如 createdAt）
    - sortOrder: string（asc|desc，默认desc）
  - 响应（200）：
    - code: 200
    - data: {
        items: Array<{
          taskId: string,
          fileId: string,
          fileName: string,
          documentType: string,
          status: "completed"|"processing"|"failed"|"pending",
          extractedFields?: number,
          totalFields?: number,
          processingTime?: number,
          createdAt: string
        }>,
        page: number,
        pageSize: number,
        total: number,
        totalPages: number
      }

- POST /documents/export-pdf
  - 描述：导出PDF报告
  - 是否鉴权：是
  - 请求体（JSON）：由前端传入的导出配置（pdfConfig）
  - 响应（200）：{ code: 200, data: { url: string } }

- POST /documents/export
  - 描述：导出指定任务/记录（用于历史记录详情里的“导出”按钮）
  - 是否鉴权：是
  - 请求体（JSON）：
    - taskId: string
    - format: string（pdf|xlsx|json，默认pdf）
    - options?: object（导出附加配置）
  - 响应（200）：{ code: 200, data: { url: string } }

- GET /documents/{fileId}/download-original
  - 描述：获取原始文档下载链接或直接触发下载
  - 是否鉴权：是
  - 路径参数：fileId: string
  - 响应（200）：{ code: 200, data: { url: string } } 或直接返回文件流

（可选）GET /documents/{fileId}/download-original/serve
  - 描述：用于H5端直接访问的静态代理服务

### 系统管理

- POST /system/users/api-settings
  - 描述：保存用户的第三方大模型 API 设置
  - 是否鉴权：是
  - 请求体（JSON）：
    - apiKey: string
    - baseUrl: string（如 `https://api.openai.com/v1` 或 `https://api.deepseek.com/v1/chat/completions`）
    - modelName: string
    - timeout: number（秒）
  - 响应（200）：{ code: 200 }

- GET /system/users/api-settings
  - 描述：获取用户的第三方大模型 API 设置
  - 是否鉴权：是
  - 响应（200）：{ code: 200, data: { apiKey, baseUrl, modelName, timeout } }

- POST /system/users/api-settings/test
  - 描述：测试第三方大模型 API 连接有效性
  - 是否鉴权：是
  - 请求体（JSON）：{ apiKey, baseUrl, modelName }
  - 响应（200）：{ code: 200, data: { success: boolean, latencyMs?: number, message?: string } }

- GET /system/statistics
  - 描述：获取系统统计数据（当前前端有占位实现，后端实现后可直接接入）
  - 是否鉴权：是
  - 响应（200）：
    - code: 200
    - data: {
        totalDocuments: number,
        todayDocuments: number,
        successRate: number,
        averageProcessTime: number,
        systemPerformance: number,
        documentTypes: Array<{ type: string, count: number }>
      }

- POST /system/error-logs
  - 描述：上报前端错误日志（可选实现，用于错误监控）
  - 是否鉴权：是
  - 请求体（JSON）：
    - logs: Array<{
        message: string,
        stack?: string,
        timestamp: string,
        type: string,
        context?: object,
        userAgent?: string,
        url?: string
      }>
  - 响应（200）：{ code: 200 }

### WebSocket 实时通道

- 连接地址：`WS_URL`（具体地址请根据实际部署环境配置，如：`ws://your-domain/ws` 或 `wss://your-domain/ws`）
- 鉴权：通过查询参数携带 token，例如：`wss://.../ws?token=<accessToken>`
- 心跳：前端每 30 秒发送一次 `{ type: "ping", data: { timestamp } }`
- 消息格式（统一）：
  - 入站/出站均为 JSON：{ type: string, data: any, timestamp?: string, meta?: any }

- 订阅提取进度
  - 前端发送：{ type: "subscribe", data: { channel: "extraction_progress", taskId } }
  - 后端推送：
    - { type: "extraction_progress", data: { taskId, status, progress, message? }, meta?: { ... } }
  - 取消订阅：{ type: "unsubscribe", data: { channel: "extraction_progress", taskId } }

### 通用返回结构与错误码

- 统一成功：`{ code: 200, data: any, message?: string }`
- 统一错误：`{ code: <非200>, message: string, error?: { details?: [{ message: string }] } }`
- HTTP 状态码：前端已针对 400/401/403/404/409/413/415/422/429/500/502/503 做了用户提示处理

### 认证与刷新流程

- 前端将 accessToken 写入 `Authorization: Bearer <token>`。
- 当接口返回 401 时，前端会以 `POST /auth/refresh` 携带 `refreshToken` 自动刷新，成功后重试原请求；刷新失败则引导重新登录。

### 附录：环境端点配置

请根据实际部署情况配置以下环境变量：

- 开发/测试环境：
  - BASE_URL: `http://localhost:端口号/api` （如：`http://localhost:8000/api`）
  - WS_URL: `ws://localhost:端口号/ws` （如：`ws://localhost:8000/ws`）
  
- 生产环境：
  - BASE_URL: `https://your-domain.com/api` （替换为实际域名）
  - WS_URL: `wss://your-domain.com/ws` （替换为实际域名）


