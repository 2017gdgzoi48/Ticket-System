
@echo off
chcp 65001 >nul
node -v >nul
if %errorlevel% neq 0 (
	cls
	echo 请先安装依赖！
	echo 即运行"InstallDependence.cmd"。
	pause
	exit
)

net session >nul
if %errorlevel% neq 0 (
	cls
	echo 请以管理员权限运行此程序！
	pause
	exit
)

cd /d "%~dp0"
echo Step 1 - 填写基本信息
set /p http_port=HTTP端口(8080)  
set /p ws_port=WebSocket端口(1234)  
set /p http_server_instance=HTTPServer实例数量(5)  
set /p ws_server_instance=WebSocketer实例数量(5) 
set /p mysql_password=Mysql数据库密码(随机生成) 
set /p local_ip=本机服务器IP(127.0.0.1) 
set /p mysql_folder=MySQL安装位置(C:\Program Files\MySQL\MySQL Server 5.7\)
cls

echo Step 2 - 初始化
node installer.js
pause
cls

echo Step 3 - 编译构建
cd Project\frontend
echo 正在编译前端...
start /wait cmd /c "npm install && exit "
start /wait cmd /c "npx vite build && exit" 
echo 前端编译完成
echo 拷贝文件...
xcopy .\dist ..\dist\ /e
cd ..
xcopy .\backend .\ /e 
echo 删除多余文件...
rmdir /s /q backend
rmdir /s /q frontend
start /wait cmd /c "npm install && exit "
echo 后端编译完成！
pause
cls

echo Step 4 - 启动nginx
cd /d "%~dp0"
cd app
xcopy .\nginx ..\nginx\ /e
cd ..\nginx
start "nginx" cmd /c "nginx.exe"
cd ..
echo nginx启动成功！（可以关掉nginx，会在后台运行）
rmdir /s /q app
rmdir /s /q template
pause
cls

cd /d "%~dp0"
echo if exist Installer.cmd ( >> cli.cmd
echo del Installer.cmd >> cli.cmd
echo ) >> cli.cmd
echo cd Project >> cli.cmd
echo node index.js >> cli.cmd
del Installer.js
del InstallDependence.cmd

echo 安装已完成！
echo 可以删除目录下的“InstallDependence.cmd”、“Installer.cmd”、“installer.js”文件及安装说明
echo 即将打开购票系统命令行进行下一步操作……
pause

cli