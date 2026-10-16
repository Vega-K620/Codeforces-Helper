@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================================
echo   正在为您打包 Codeforces Helper 绿色免安装客户端...
echo ========================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "$outDir = 'release\CodeforcesHelper-win32-x64'; $appDir = \"$outDir\resources\app\"; if (Test-Path $outDir) { Remove-Item $outDir -Recurse -Force }; New-Item -ItemType Directory -Path $outDir -Force | Out-Null; Copy-Item 'node_modules\electron\dist\*' $outDir -Recurse -Force; Rename-Item \"$outDir\electron.exe\" 'CodeforcesHelper.exe' -Force; if (Test-Path \"$outDir\resources\default_app.asar\") { Remove-Item \"$outDir\resources\default_app.asar\" -Force }; New-Item -ItemType Directory -Path \"$appDir\node_modules\echarts\dist\" -Force | Out-Null; Copy-Item 'package.json','main.js','preload.js','LICENSE','README.md' $appDir -Force; Copy-Item 'src' \"$appDir\src\" -Recurse -Force; Copy-Item 'node_modules\echarts\dist\echarts.min.js' \"$appDir\node_modules\echarts\dist\echarts.min.js\" -Force; $zipPath = 'release\CodeforcesHelper-v1.0.0-win64.zip'; if (Test-Path $zipPath) { Remove-Item $zipPath -Force }; Compress-Archive -Path $outDir -DestinationPath $zipPath -CompressionLevel Optimal"
echo.
echo ========================================================
echo   打包完成！
echo   1. 免安装目录: release\CodeforcesHelper-win32-x64
echo   2. GitHub Release 压缩包: release\CodeforcesHelper-v1.0.0-win64.zip
echo ========================================================
pause
