@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================================
echo   正在为您打包 Codeforces Helper 绿色免安装客户端...
echo ========================================================
set ELECTRON_MIRROR=https://cdn.npmmirror.com/binaries/electron/
call npm.cmd run pack
echo.
echo ========================================================
echo   打包完成！
echo   免安装目录位于: release\CodeforcesHelper-win32-x64
echo   您可以将该文件夹压缩后发给任何朋友，双击里面的
echo   CodeforcesHelper.exe 即可直接运行（无需安装任何环境）！
echo ========================================================
pause
