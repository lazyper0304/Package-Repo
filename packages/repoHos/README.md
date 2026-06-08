# Repo 鸿蒙版

基于 Flutter 的鸿蒙应用包名查询工具，对接 `https://shenjack.top:10003` API。

## 功能特性

- 应用搜索：支持关键词搜索，分页加载
- 应用详情：查看应用完整信息（版本、评分、下载量等）
- 排行榜：下载增长榜、评分榜、最近更新
- 市场概览：应用总数、开发者数量等统计
- 深色模式：跟随系统或手动切换

## 技术栈

- Flutter SDK: `3.35.8-ohos-1.0.1`（通过 FVM 管理）
- 路由: `go_router`
- 状态管理: `signals_flutter`
- HTTP: `dio`
- UI: `liquid_glass_widgets` 玻璃拟态风格

## 开发环境

### 前置条件

1. 安装 FVM：
```bash
dart pub global activate fvm
```

2. 安装 Flutter 鸿蒙版本：
```bash
fvm install 3.35.8-ohos-1.0.1
```

3. 安装依赖：
```bash
cd packages/repoHos
fvm flutter pub get
```

### 运行

#### Web 端测试
```bash
fvm flutter run -d chrome
```

#### 鸿蒙模拟器测试
```bash
fvm flutter run -d 127.0.0.1:5555
```

### 构建

#### 构建 HAP（鸿蒙应用包）
```bash
fvm flutter build hap --release
```

## 项目结构

```
lib/
├── main.dart                    # 入口
├── router.dart                  # go_router 路由配置
├── services/
│   ├── api.dart                 # API 服务层
│   └── http_client.dart         # Dio HTTP 客户端封装
├── models/
│   ├── app.dart                 # 应用数据模型
│   └── ranking.dart             # 排行榜模型
├── screens/
│   ├── home_screen.dart         # 主页（搜索+列表+排行Tab）
│   ├── app_detail_screen.dart   # 应用详情页
│   └── ranking_screen.dart      # 排行榜页面
├── widgets/
│   ├── app_card.dart            # 应用卡片组件
│   ├── search_bar.dart          # 搜索栏
│   ├── glass_card.dart          # 玻璃拟态卡片
│   └── stat_card.dart           # 统计数据卡片
└── theme/
    └── app_theme.dart           # 主题配置
```

## API 接口

| 功能 | 方法 | 端点 |
|------|------|------|
| 搜索应用 | GET | `/api/v0/apps/list/{page}` |
| 按包名查询 | GET | `/api/v0/apps/pkg_name/{pkg_name}` |
| 按ID查询 | GET | `/api/v0/apps/app_id/{app_id}` |
| 应用指标 | GET | `/api/v0/apps/metrics/{pkg_id}` |
| 排行榜-下载增长 | GET | `/api/v0/rankings/download_increase` |
| 排行榜-评分 | GET | `/api/v0/rankings/ratings` |
| 排行榜-最近更新 | GET | `/api/v0/rankings/recent` |
| 市场统计 | GET | `/api/v0/market_info` |

## 鸿蒙平台配置

项目已配置 `ohos/` 目录，包含：

- `build-profile.json5` - 构建配置，指定 SDK 版本 `5.0.0(12)`
- `AppScope/app.json5` - 应用信息，bundleName: `com.vince.repoHos`
- `entry/` - 入口模块，包含 Ability 和页面配置

### 签名配置

首次运行前需要配置签名：

1. 打开 DevEco Studio
2. 进入 `File > Project Structure > Signing Configs`
3. 添加或修改签名配置，证书文件保存在 `~/.ohos/config/` 目录

### 构建 HAP

```bash
fvm flutter build hap --release
```

构建产物位于 `build/outputs/default/` 目录。
