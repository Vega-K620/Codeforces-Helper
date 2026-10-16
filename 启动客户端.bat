@echo off
chcp 65001 >nul
cd /d "%~dp0"
if exist "node_modules\electron\dist\electron.exe" (
    start "" "node_modules\electron\dist\electron.exe" .
) else (
    npm.cmd start
)
