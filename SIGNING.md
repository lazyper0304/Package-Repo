# 签名配置说明

## 签名文件位置

Release 签名文件需要放在 `D:\Code\Android Key\` 目录下：

```
D:\Code\Android Key\
├── repohos_release.p12          # 签名密钥库
├── repohos_release.cer          # 签名证书
└── repoHos Release.p7b          # 签名配置文件
```

## 换电脑时

1. 将上述 3 个签名文件复制到新电脑的 `D:\Code\Android Key\` 目录
2. 确保 DevEco Studio 已安装，`JAVA_HOME` 指向 JDK 17
3. 运行 `build_hap_release.bat` 或 `run_release.bat` 即可

## 临时签名文件备份

签名文件备份在 `packages/repoHos/ohos/signing/`（仅限当前电脑）。
