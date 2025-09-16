# 前端问题诊断指南

## 常见问题及解决方案

### 1. 后端连接失败 (ERR_EMPTY_RESPONSE)

**问题现象：**
- 控制台显示 `ERR_EMPTY_RESPONSE`
- API请求失败，显示 `request:fail`
- 系统统计数据无法加载

**解决方案：**
1. 检查后端服务是否启动
   ```bash
   # 运行检查脚本
   check-backend.bat
   ```

2. 启动后端服务
   ```bash
   # 进入后端项目目录，然后运行：
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

3. 检查端口配置
   - 确认后端运行在端口8000
   - 确认前端API配置正确（src/config/api-config.js）

### 2. 浏览器扩展程序错误

**问题现象：**
- 控制台显示 `This is a Pro feature. Please use it after becoming a Pro member.`
- 扩展程序相关的错误信息

**解决方案：**
- 这些错误已经被自动处理，不会影响应用功能
- 如果仍有干扰，可以暂时禁用相关浏览器扩展

### 3. 认证相关错误

**问题现象：**
- Token解析失败
- 用户信息获取失败
- 认证状态异常

**解决方案：**
1. 清除浏览器存储
   ```javascript
   // 在浏览器控制台执行
   localStorage.clear()
   sessionStorage.clear()
   ```

2. 重新登录应用

### 4. 开发环境配置

**确认以下配置正确：**

1. **API配置** (src/config/api-config.js)
   ```javascript
   DEVELOPMENT: {
       BASE_URL: 'http://localhost:52198/api',
       WS_URL: 'ws://localhost:52198/ws',
       TIMEOUT: 30000,
       RETRY_TIMES: 3
   }
   ```

2. **环境变量**
   - 确认 `NODE_ENV` 设置为 `development`

3. **网络连接**
   - 确认本地网络正常
   - 确认防火墙没有阻止52198端口
   - 确认SSH隧道正常工作（如果使用SSH转发）

### 5. 错误处理优化

应用已经实现了以下错误处理机制：

1. **自动忽略浏览器扩展错误**
2. **网络错误静默处理**
3. **API失败时使用默认数据**
4. **用户友好的错误提示**

## 调试工具

### 1. 开发者工具
- 打开浏览器开发者工具 (F12)
- 查看 Console 标签页的日志信息
- 查看 Network 标签页的网络请求

### 2. 认证状态调试
应用会自动输出认证调试信息，包括：
- 登录状态
- Token信息
- JWT解析结果

### 3. API连接测试
开发环境下会自动进行API连接测试，输出连接状态。

## 联系支持

如果以上解决方案无法解决问题，请提供：
1. 浏览器控制台的完整错误信息
2. 当前的环境配置
3. 后端服务状态
4. 具体的操作步骤
