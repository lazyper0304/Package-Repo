@echo off
chcp 65001 >nul

cd /d "%~dp0"

echo [repoHos] Running on Android (debug)...
flutter run
pause
