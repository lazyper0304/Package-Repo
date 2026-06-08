@echo off
chcp 65001 >nul

set REPO_DIR=e:\code\Package-Repo\packages\repoHos
cd /d "%REPO_DIR%"

set PATH=%PATH%;E:\flutter_pub_cache\bin;C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\toolchains;C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin
set DEVECO_SDK_HOME=C:\Program Files\Huawei\DevEco Studio\sdk

:: 切换到 release 签名配置
powershell -Command "(Get-Content ohos\build-profile.json5 -Raw) -replace '\"signingConfig\": \"default\"', '\"signingConfig\": \"release\"' | Set-Content ohos\build-profile.json5 -NoNewline -Encoding utf8"

echo [repoHos] Running on emulator (release)...
fvm.bat flutter run -d 127.0.0.1:5555 --release

:: 恢复为 debug 签名配置
powershell -Command "(Get-Content ohos\build-profile.json5 -Raw) -replace '\"signingConfig\": \"release\"', '\"signingConfig\": \"default\"' | Set-Content ohos\build-profile.json5 -NoNewline -Encoding utf8"

pause
