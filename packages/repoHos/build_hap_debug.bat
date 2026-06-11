@echo off
chcp 65001 >nul
set JAVA_HOME=C:\Program Files\Java\jdk-17

set REPO_DIR=E:\code\Package-Repo\packages\repoHos
cd /d "%REPO_DIR%"

set PATH=%REPO_DIR%\bin;%JAVA_HOME%\bin;%PATH%;E:\flutter_pub_cache\bin;C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\toolchains;C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin
set DEVECO_SDK_HOME=C:\Program Files\Huawei\DevEco Studio\sdk
set HOS_SDK_HOME=C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony

:: 确保使用 debug 签名配置
powershell -Command "$f='ohos\build-profile.json5'; $c=[System.IO.File]::ReadAllText($f); $c=$c -replace '\"signingConfig\":\s*\"release\"', '\"signingConfig\": \"default\"'; [System.IO.File]::WriteAllText($f, $c, [System.Text.UTF8Encoding]::new($false))"

echo [repoHos] Building HAP (debug for x64 emulator)...
C:\Users\hexu\fvm\versions\3.35.8-ohos-1.0.1\bin\flutter build hap --debug --target-platform ohos-x64
echo [repoHos] Build complete!
pause
