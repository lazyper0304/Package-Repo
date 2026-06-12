# CLAUDE.md - Zombie Shooter (向僵尸开炮)

肉鸽射击游戏，俯视角自动射击 + 波次防守 + 肉鸽升级。

## 技术栈

- **游戏引擎**: Phaser.js 3 (auto-shooting, physics, object pooling)
- **UI**: React + Radix UI Themes + CSS Modules/Less
- **通信**: EventEmitter bridge (`bridge.ts`) 连接 Phaser ↔ React
- **端口**: 3010, base: `/zombie-shooter/`

## 架构

```
React UI (components/game/*, components/website/*)
    ↕ bridge.ts (gameBridge.emit / gameBridge.on)
Phaser Game (GameScene → Player, BulletManager, EnemyManager, WaveManager, SkillSystem)
```

### 组件目录结构

```
src/components/
├── game/                    # 游戏相关组件
│   ├── HUD/                # 游戏内 HUD (血量、技能、弹药、伤害统计、枪械属性)
│   ├── Lobby/              # 大厅 (商店/角色/战斗/核心/基地)
│   ├── UpgradePanel/       # 升级选择面板 (3选1)
│   ├── GameOverPanel/      # 游戏结束面板 (含伤害统计)
│   ├── PauseMenu/          # 暂停菜单
│   ├── CharacterPanel/     # 角色装备面板
│   ├── InventoryGrid/      # 背包网格
│   ├── GameContainer/      # Phaser canvas 容器
│   └── StartScreen/        # 开始屏幕
└── website/                 # 网站通用组件
    ├── Header/             # 顶部导航
    ├── Footer/             # 底部信息
    └── GradientBackground/ # 渐变背景
```

每个组件文件夹包含 `index.tsx` 和 `index.module.less`。

### 核心文件

| 文件 | 用途 |
|------|------|
| `src/game/scenes/GameScene.ts` | 主游戏场景，包含所有游戏逻辑 |
| `src/game/scenes/BootScene.ts` | 资源加载、动画创建 |
| `src/game/bridge.ts` | Phaser-React 事件桥 |
| `src/game/data/upgrades.ts` | 升级卡牌定义 (gun/skill/element/heal) |
| `src/game/data/enemies.ts` | 敌人定义 |
| `src/game/data/waves.ts` | 波次配置 |
| `src/game/data/balance.ts` | 数值平衡常量 |
| `src/game/systems/BuffSystem.ts` | Buff 系统 |
| `src/App.tsx` | 游戏状态管理 |

## 核心机制

### 防守墙与玩家
- **城墙**: `y=GAME_HEIGHT-100`，使用城堡素材图片
- **城墙底部**: 网格状砖块填充 (颜色 #735435)
- **玩家**: `y=GAME_HEIGHT-60`，使用士兵素材，缩放 0.7
- **攻击范围**: 鼠标悬浮人物时显示半透明区域

### 子弹系统
- 对象池管理 (1000 发)，追踪子弹用 `bullet.setData('target', enemy)`
- **齐射(burst)**: 以人物为圆心，向敌人方向扇形展开
  - 1级: 15° 扇形，2颗子弹
  - 2级: 25° 扇形，3颗子弹
  - 主子弹追踪目标，齐射子弹按角度直线飞行
- **连射(rapid)**: 垂直方向连续发射多排子弹
  - 每排间隔 80ms，轨迹相同
- **分裂弹**: 命中敌人后在敌人位置分裂，分裂子弹不再分裂
  - 分裂子弹使用自绘橙黄色小圆圈
- **元素子弹**: 选择后自动切换对应素材（火焰/冰冻/电击）
- **子弹层级**: depth=15，在敌人之上

### 敌人系统
- 对象池回收 (maxSize=200)，死亡/超出屏幕时回收
- **素材**: 普通僵尸、疾尸、僵尸王使用行走动画素材
- **尺寸**: walker 0.08, runner 0.06, elite 0.1, boss 0.12
- **精英/Boss**: 同时最多各 1 个，超限后 fallback 为 walker
- **碰撞**: 敌人到达城墙后停止，强制停在 `wall.y - 30`
- **Buff效果**: 冰冻/眩晕时暂停行走动画
- **唯一ID**: 每个敌人分配唯一ID，用于 buff 绑定

### 波次系统
- 间隔 20 秒生成新波次
- 精英: 波次 5、10 出现
- Boss: 波次 14 出现
- 20波总敌人约 680 个

### 经验值系统
- 每级需要 `totalEnemies / (maxLevel * 2)` 经验
- 20级满后不再出现升级卡牌，经验值不再增加

### 技能系统 (5 系，每系 3 阶)

| 系别 | 初始技能 | 进阶 1 | 进阶 2 | 冷却 |
|------|----------|--------|--------|------|
| 风 🌪️ | 风咒 (持续旋风) | 旋风斩 (分裂风刃) | 风卷残云 (碰撞分裂) | 5s |
| 雷 ⚡ | 雷咒 (单体雷罚) | 惊雷术 (分裂雷罚) | 天雷空破 (连续雷罚) | 3s |
| 水 💧 | 冰咒 (单体冰冻) | 寒冰破 (冰暴伤害) | 水漫金山 (击退) | 3s |
| 火 🔥 | 炎咒 (点燃1s) | 爆炎弹 (击退) | 三味真火 (燃烧3s) | 3s |
| 土 🪨 | 土咒 (单体击退) | 飞岩术 (眩晕) | 泰山压顶 (长眩晕) | 3s |

- 最多 3 系技能，选满后只显示已有系的进阶技能
- 进阶需要前置技能，满级后不再出现
- HUD 左侧显示技能图标 (36px) + 环形冷却进度
- 悬浮显示技能名称、等级、元素伤害

### 技能冷却显示（重要）
- **进度计算**: `progress = (remaining / cooldown) * 100`
- **逻辑**: 释放后 progress=100%，逐渐减小到 0%，0% 时可再次释放
- **圆环渲染**: 使用 SVG circle，`strokeDasharray` 计算圆周长
- **颜色**: 冷却中黄色 (#f59e0b)，就绪绿色 (#22c55e)
- **关键**: 使用函数式更新 `setActiveSkills(prev => ...)` 确保 React 重新渲染
- **key**: 使用 `${skill.name}-${index}` 避免 React 优化跳过更新

### 元素伤害卡牌
- 拥有某系技能后，随机出现该系伤害 +60% 卡牌
- 最多 600% 元素伤害加成

### Buff 系统
- **燃烧**: 每秒造成攻击30%伤害，3秒
- **冰冻**: 完全停止移动和攻击，暂停动画，1秒
- **麻痹**: 减速50% + 无法攻击，1秒
- **眩晕**: 完全停止，暂停动画，1秒
- **流血**: 受到的所有伤害增加30%，5秒
- **减速**: 移动速度降低50%，2秒
- 火系技能默认燃烧1秒，三味真火延长到3秒

### 伤害统计
- 按来源分类：枪械、风系、雷系、水系、火系、土系、燃烧、分裂
- 横向柱状图显示，标签在柱上方
- 局内悬浮显示，结算界面也显示

### 枪械属性悬浮窗
- 悬浮在枪械卡片上显示：伤害、增幅、齐射、连射、分裂、次级伤害、暴击率、暴伤

### 升级卡牌分类

| 类别 | 说明 |
|------|------|
| gun | 枪械相关 (增伤/齐射/连射/分裂/元素弹) |
| skill | 技能相关 (5 系 × 3 阶) |
| element | 元素伤害 (+60%，需有对应系技能) |
| heal | 回血 (仅在掉血时出现) |

### 伤害公式
- 基础伤害: baseDamage=100
- 暴击: 3x 伤害
- 技能伤害: 玩家攻击 × 2 + 元素伤害
- 元素伤害: 无视防御
- 子弹大小随伤害增加（基础0.5，最高1.5）

## UI 样式

- **高斯模糊**: 所有悬浮卡片使用 `backdrop-filter: blur(12px)`
- **背景**: rgba(0, 0, 0, 0.7) 半透明
- **HUD**: 升级、暂停、结算时都保留显示
- **枪械卡片**: 固定宽度 70px，点击切换自动/关火
- **城墙血量**: 右下角纯数字显示

## 资源文件

| 文件 | 用途 |
|------|------|
| `public/bullet.png` | 普通子弹素材 |
| `public/bullet-fire.png` | 火焰弹素材 |
| `public/bullet-ice.png` | 冰冻弹素材 |
| `public/bullet-thunder.png` | 电击弹素材 |
| `public/zombie-walk-1/2.png` | 普通僵尸行走动画 |
| `public/runner-walk-1/2.png` | 疾尸行走动画 |
| `public/boss-1/2.png` | 僵尸王行走动画 |
| `public/player.png` | 玩家素材 |
| `public/wall.png` | 城墙素材 |
| `public/background.webp` | 背景图 |

## 注意事项

- 墙体用 `this.add.sprite()` 不用 `this.physics.add.sprite()`，否则会阻挡子弹
- 敌人回收必须 `body!.reset(0, 0)` 再放回池，否则碰撞箱残留
- 子弹追踪需要设置初始速度，否则不会飞出
- 升级卡牌在升级时触发 (经验值满)，不是波次开始时
- 技能冷却信息通过 `skills:updated` 事件发送到 React
- 组件导入路径使用 `./index.module.less` 而非 `./XXX.module.less`
- 敌人使用唯一ID绑定 buff，不用位置坐标
- 子弹回收时重置纹理为普通子弹
