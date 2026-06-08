@echo off
chcp 65001 >nul

set REPO_DIR=e:\code\Package-Repo\packages\repoHos
cd /d "%REPO_DIR%"

set PATH=%PATH%;E:\flutter_pub_cache\bin;C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\toolchains;C:\Program Files\Huawei\DevEco Studio\tools\ohpm\bin
set DEVECO_SDK_HOME=C:\Program Files\Huawei\DevEco Studio\sdk

echo [repoHos] Building HAP (debug for x64 emulator)...
fvm.bat flutter build hap --debug --target-platform ohos-x64
echo [repoHos] Build complete!
pause
