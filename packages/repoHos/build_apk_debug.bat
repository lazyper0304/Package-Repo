@echo off
chcp 65001 >nul
set JAVA_HOME=C:\Program Files\Java\jdk-17

set REPO_DIR=E:\code\Package-Repo\packages\repoHos
cd /d "%REPO_DIR%"

set PATH=%JAVA_HOME%\bin;%PATH%;E:\flutter_pub_cache\bin

echo [repoHos] Building APK (debug)...
fvm.bat flutter build apk --debug
echo [repoHos] Build complete!
pause
