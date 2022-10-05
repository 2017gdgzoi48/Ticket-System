
@echo off
chcp 65001
cd APP
echo 安装依赖 0/4
start "" /wait "node-v16.13.0-x64.msi"
cls
echo 安装依赖 1/4
start "" /wait "Redis-x64-5.0.14.1.msi"
cls
echo 安装依赖 2/4
start "" /wait "vcredist_x64.exe"
cls
echo 安装依赖 3/4
start "" /wait "mysql-5.7.34-winx64.msi"
cls
echo 安装依赖 4/4
pause