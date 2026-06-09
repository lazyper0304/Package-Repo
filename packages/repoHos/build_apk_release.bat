@echo off
chcp 65001 >nul

cd /d "%~dp0"

echo [repoHos] Building APK (release)...
flutter build apk --release
echo [repoHos] Build complete!
pause
