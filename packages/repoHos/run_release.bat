@echo off
chcp 65001 >nul
set JAVA_HOME=C:\Program Files\Java\jdk-17

set REPO_DIR=E:\code\Package-Repo\packages\repoHos
cd /d "%REPO_DIR%"

set PATH=%JAVA_HOME%\bin;%PATH%;E:\flutter_pub_cache\bin;C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\toolchains;C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin
set DEVECO_SDK_HOME=C:\Program Files\Huawei\DevEco Studio\sdk

:: 确保签名文件存在
set SIGN_DIR=D:\Code\Android Key
if not exist "%SIGN_DIR%\repohos_release.p12" (
    echo [repoHos] 签名文件不存在，请将签名文件放到 %SIGN_DIR%
    pause
    exit /b 1
)

:: 切换到 release 签名配置
powershell -Command "$f='ohos\build-profile.json5'; $c=[System.IO.File]::ReadAllText($f); $c=$c -replace '\"signingConfig\":\s*\"default\"', '\"signingConfig\": \"release\"'; [System.IO.File]::WriteAllText($f, $c, [System.Text.UTF8Encoding]::new($false))"

echo [repoHos] Running on emulator (release)...
fvm.bat flutter run -d 127.0.0.1:5555 --release

:: 恢复为 debug 签名配置
powershell -Command "$f='ohos\build-profile.json5'; $c=[System.IO.File]::ReadAllText($f); $c=$c -replace '\"signingConfig\":\s*\"release\"', '\"signingConfig\": \"default\"'; [System.IO.File]::WriteAllText($f, $c, [System.Text.UTF8Encoding]::new($false))"

pause
