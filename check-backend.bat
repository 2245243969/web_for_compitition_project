@echo off
echo 检查后端服务状态...
echo.

:: 检查端口52198是否被占用
echo 正在检查端口52198...
netstat -an | findstr ":52198" > nul
if %errorlevel% == 0 (
    echo ✅ 端口52198已被占用，后端服务可能正在运行
    echo.
    echo 测试API连接...
    curl -s -o nul -w "HTTP状态码: %%{http_code}\n" http://localhost:52198/api/system/health
    if %errorlevel% == 0 (
        echo ✅ 后端API响应正常
    ) else (
        echo ❌ 后端API无响应，请检查后端服务或SSH隧道
    )
) else (
    echo ❌ 端口52198未被占用，后端服务未启动
    echo.
    echo 请确认：
    echo 1. 后端Django服务正在运行
    echo 2. SSH隧道正常工作 (52198端口转发到后端8000端口)
    echo 3. 或者直接在52198端口启动后端服务
)

echo.
echo 按任意键退出...
pause > nul
