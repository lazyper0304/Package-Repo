@echo off
chcp 65001 >nul

cd /d "%~dp0"

echo [repoHos] Building APK (debug)...
flutter build apk --debug
echo [repoHos] Build complete!
pause
