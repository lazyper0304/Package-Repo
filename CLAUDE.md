# CLAUDE.md

This file provides guidance to kscc (claude.ai/code) when working with code in this repository.

## 项目概述

Yarn workspaces monorepo，包含多个 Web 工具应用。

## 常用命令

```bash
# 开发（所有项目并行）
yarn dev

# 单个项目开发
yarn dev:server    # 3001
yarn dev:repo      # 3003
yarn dev:site      # 3002
yarn dev:fish      # 3004
yarn dev:tier      # 3005
yarn dev:vectorizer # 3006

# 构建
yarn build              # 构建所有前端到 dist/
yarn build:repo         # 构建单个项目

# Rust/WASM（vectorizer 和 repo 依赖）
cd packages/rust && wasm-pack build --target web
```

## 架构

### 包结构
- **site** — 主入口/工具导航站（`/`）
- **repo** — 应用包名查询工具（`/repo/`），最复杂的前端
- **fish** — 闲鱼水印工具（`/fish/`）
- **tier** — 排名生成器（`/tier/`）
- **vectorizer** — 图片矢量化（`/vectorizer/`），使用 Rust/WASM
- **server** — Express 后端（MySQL + JWT）
- **rust** — vtracer WASM 库，被 repo 和 vectorizer 通过 `file:../rust/pkg` 引用

### 前端模式
- **UI 框架**：统一使用 Radix UI Themes，不要混用其他 UI 库
- **样式**：CSS Modules + Less，`localsConvention: 'camelCase'`
- **主题**：`useLocalStorageState` 保存主题 → `useMemo` 计算 appearance → `useEffect` 设置 `data-theme`，主题状态在 App 组件管理，通过 props 传给 Header
- **状态管理**：React Context + useReducer（repo 项目），简单项目用 useState
- **布局**：`height: 100vh` 固定视口，卡片用 `flex: 1` 撑满，需要滚动的面板用 ScrollArea
- **共享组件**：GradientBackground、Footer 各项目独立复制，非共享库

### 后端模式
- Express + MySQL2，JWT 认证
- 路由：`routes/app.js`、`routes/appType.js`、`routes/util.js`
- HttpClient 自动注入 token，过期时派发 `auth-expired` 事件

## 新建项目检查清单

1. **端口分配**：从 3007 开始递增，检查不与现有冲突
2. **vite.config.ts**：
   - `base: '/项目名/'`
   - WASM 项目加 `vite-plugin-wasm` 和 `vite-plugin-top-level-await`
   - 输出到 `../../dist/项目名`
3. **index.html**：favicon 用 `/favicon.png`，不要硬编码 base 前缀
4. **package.json**：依赖 vtracer 用 `"file:../rust/pkg"`
5. **nginx.conf**：
   ```nginx
   location = /xxx { rewrite ^ /xxx/ last; }
   location ^~ /xxx/ { try_files $uri $uri/ /xxx/index.html; }
   ```
6. **根目录 package.json**：添加 `dev:xxx`、`build:xxx`，更新 concurrently
7. **site/tools.ts**：添加工具配置，开发环境 URL 不带路径前缀
8. **组件风格**：统一使用 Radix UI，不要自定义背景/卡片样式
9. **Header 样式统一**：
   - 固定定位 `position: fixed`，`z-index: 999`
   - 左侧：Logo（42x42）+ 标题（fontSize: 22, fontWeight: 500）
   - 右侧：主题切换按钮（IconButton, variant="soft", size="3", radius="full"）
   - 背景透明，padding: 12px 8px
10. **移动端布局**：
    - 使用 `useMobile` hook（断点 768px）
    - 桌面端：绝对定位居中 `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%)`
    - 移动端：`min-height: 100vh`，`padding-top: 68px`，从顶部开始
    - 使用 `isMobile ? styles.appWrapperMobile : styles.appWrapper` 条件渲染
    - 移动端动画使用 `translateY` 而非 `translate(-50%, -50%)`
    - 内容容器需要 `overflow-y: auto` 支持滚动
    - Tab 等横向内容需要 `overflow-x: auto` 支持水平滚动
    - 主内容区需要 `padding-top: 80px` 避免被 header 遮挡
11. **上传卡片样式统一**：
    - 虚线边框 `border: 2px dashed var(--text-muted)`
    - 圆角 `border-radius: var(--radius-md)`
    - 悬停效果：边框变色 `var(--accent)`
    - 拖拽效果：背景色变化 `rgba(6, 182, 212, 0.08)`
    - 背景色 `rgba(241, 245, 249, 0.1)`
    - 不同项目只是换图标和文案
12. **卡片比例**：
    - PC端卡片比例建议 4:3，避免太瘦长

## 注意事项

- UI 语言为中文
- site 的 `src/data/tools.ts` 控制工具导航，区分开发/正式环境 URL
- 构建产物在 `dist/` 目录
