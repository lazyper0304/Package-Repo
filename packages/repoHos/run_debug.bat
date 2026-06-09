@echo off
chcp 65001 >nul
set JAVA_HOME=C:\Program Files\Java\jdk-17

set REPO_DIR=E:\code\Package-Repo\packages\repoHos
cd /d "%REPO_DIR%"

set PATH=%JAVA_HOME%\bin;%PATH%;E:\flutter_pub_cache\bin;C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\toolchains;C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin
set DEVECO_SDK_HOME=C:\Program Files\Huawei\DevEco Studio\sdk

:: 确保使用 debug 签名配置
powershell -Command "$f='ohos\build-profile.json5'; $c=[System.IO.File]::ReadAllText($f); $c=$c -replace '\"signingConfig\":\s*\"release\"', '\"signingConfig\": \"default\"'; [System.IO.File]::WriteAllText($f, $c, [System.Text.UTF8Encoding]::new($false))"

echo [repoHos] Running on emulator (debug)...
fvm.bat flutter run -d 127.0.0.1:5555
pause
