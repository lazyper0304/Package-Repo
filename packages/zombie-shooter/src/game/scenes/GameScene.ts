import Phaser from 'phaser';
import { gameBridge } from '../bridge';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { BALANCE } from '../data/balance';
import { ENEMY_TYPES } from '../data/enemies';
import { getRandomUpgradeOptions, type UpgradeId } from '../data/upgrades';
import { getWaveConfig, getTotalEnemiesFor20Waves } from '../data/waves';
import { buffManager, type BuffType } from '../systems/BuffSystem';

interface PlayerSprite extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  fireRate: number;
  damage: number;
  bulletCount: number;
  bulletSpeed: number;
  critChance: number;
  critMultiplier: number;
  baseHp: number;
  baseFireRate: number;
  baseDamage: number;
  baseBulletCount: number;
  baseBulletSpeed: number;
  baseCritChance: number;
  baseCritMultiplier: number;
  lastFireTime: number;
  // 弹夹系统
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadTime: number;
  reloadTimer: number;
}

interface WallSprite extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
}

interface BulletSprite extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  piercing: number;
  speed: number;
  isCrit: boolean;
}

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  enemyType: string;
  xpValue: number;
  isBoss: boolean;
  slowTimer: number;
  burnTimer: number;
  burnDamage: number;
  attackCooldown: number;
  defense: number;
  dodgeRate: number;
}

export class GameScene extends Phaser.Scene {
  private player!: PlayerSprite;
  private wall!: WallSprite;
  private wallHpText!: Phaser.GameObjects.Text;
  private wallShieldText!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private rangeIndicator!: Phaser.GameObjects.Graphics;

  private bullets!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private xpGems!: Phaser.Physics.Arcade.Group;

  private waveNumber = 0;
  private killCount = 0;
  private score = 0;

  // 技能系统
  private skillCooldowns: Record<string, number> = {};
  private skillTimers: Record<string, number> = {};
  private activeSkillElements: string[] = []; // 当前激活的技能系别
  private skillLevels: Record<string, number> = {}; // 技能等级

  private waveTimer = 0;
  private waveInterval = 20000; // 20秒一波
  private waveInProgress = false;
  private spawnTimers: { wave: number; timer: number; remaining: number; config: ReturnType<typeof getWaveConfig> }[] = [];

  private upgradeLevels: Record<UpgradeId, number> = {} as Record<UpgradeId, number>;
  private currentLevel = 1;
  private maxLevel = 20;

  // 经验值系统
  private xp = 0;
  private xpToNextLevel = 20; // 每级需要20经验
  private totalEnemies = 400; // 本关总僵尸数
  private xpPerEnemy = 1; // 每个僵尸1经验

  // 计时器
  private gameTime = 0;
  private pendingUpgrade = false;

  // 自动射击开关
  private autoShootEnabled = true;

  // 伤害统计
  private damageStats: Record<string, number> = {
    gun: 0,
    wind: 0,
    thunder: 0,
    water: 0,
    fire: 0,
    earth: 0,
    burn: 0,
    split: 0,
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.resetGameState();
    this.createBackground();
    this.createWall();
    this.createPlayer();
    this.createGroups();
    this.setupCollisions();
    this.setupBridgeListeners();

    // 设置世界边界 - 不阻挡子弹
    this.physics.world.setBoundsCollision(false, false, false, false);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Start the game
    this.time.delayedCall(100, () => {
      this.startNextWave();
    });
  }

  private resetGameState(): void {
    this.waveNumber = 0;
    this.killCount = 0;
    this.score = 0;
    this.waveTimer = 0;
    this.waveInProgress = false;
    this.spawnTimers = [];
    this.upgradeLevels = {} as Record<UpgradeId, number>;
    this.currentLevel = 1;
    this.xp = 0;

    // 动态计算每级所需经验：总敌人 / (最大等级 * 2)，加快升级速度
    const totalEnemies = getTotalEnemiesFor20Waves();
    this.xpToNextLevel = Math.max(10, Math.floor(totalEnemies / (this.maxLevel * 2)));
    this.totalEnemies = totalEnemies;

    this.gameTime = 0;

    // 重置技能状态
    this.activeSkillElements = [];
    this.skillLevels = {};
    this.skillCooldowns = {};
    this.skillTimers = {};

    // 重置伤害统计
    this.damageStats = {
      gun: 0,
      wind: 0,
      thunder: 0,
      water: 0,
      fire: 0,
      earth: 0,
      burn: 0,
      split: 0,
    };
  }

  private createBackground(): void {
    // 使用加载的背景图片
    if (this.textures.exists('background')) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background');
      bg.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      bg.setDepth(0);
    } else {
      // 备用：程序化生成背景
      const g = this.add.graphics();
      g.fillGradientStyle(0x1a3a0a, 0x1a3a0a, 0x2d5016, 0x2d5016, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      for (let i = 0; i < 50; i++) {
        const x = Phaser.Math.Between(0, GAME_WIDTH);
        const y = Phaser.Math.Between(0, GAME_HEIGHT);
        g.fillStyle(0x3a6b1e, 0.3);
        g.fillCircle(x, y, Phaser.Math.Between(1, 3));
      }
    }
  }

  private createWall(): void {
    // 使用加载的城墙图片
    if (this.textures.exists('wall')) {
      this.wall = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'wall') as unknown as WallSprite;
      // 缩放城墙图片以适应屏幕宽度
      const wallTexture = this.textures.get('wall');
      const wallWidth = wallTexture.getSourceImage().width;
      const wallHeight = wallTexture.getSourceImage().height;
      const scaleX = GAME_WIDTH / wallWidth;
      const scaleY = 120 / wallHeight; // 城墙高度设为120px
      this.wall.setScale(scaleX, scaleY);
    } else {
      // 备用：程序化生成城墙
      const wallGraphics = this.make.graphics({ x: 0, y: 0, add: false });
      wallGraphics.fillStyle(0x8b7355, 1);
      wallGraphics.fillRect(0, 0, GAME_WIDTH, 120);
      wallGraphics.generateTexture('wall-fallback', GAME_WIDTH, 120);
      this.wall = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'wall-fallback') as unknown as WallSprite;
    }

    this.wall.setDepth(5);

    // 在城墙下方渲染网格状城墙填充
    const wallFill = this.add.graphics();
    wallFill.setDepth(5);

    // 基础砖块颜色（与城堡素材一致）
    const brickColor = 0x735435; // 主砖色 #735435
    const brickShadow = 0x5a4028; // 砖块阴影（更深）
    const mortarColor = 0x4a3a28; // 灰缝颜色

    // 绘制网格状城墙
    const fillTop = GAME_HEIGHT - 40;
    const fillHeight = 40;

    // 背景色（灰缝）
    wallFill.fillStyle(mortarColor, 1);
    wallFill.fillRect(0, fillTop, GAME_WIDTH, fillHeight);

    // 绘制砖块网格
    const brickWidth = 30;
    const brickHeight = 10;

    for (let y = fillTop; y < GAME_HEIGHT; y += brickHeight) {
      // 每行偏移半块砖，形成交错效果
      const rowOffset = (Math.floor((y - fillTop) / brickHeight) % 2) * (brickWidth / 2);

      for (let x = -brickWidth; x < GAME_WIDTH + brickWidth; x += brickWidth) {
        const brickX = x + rowOffset;

        // 砖块主体
        wallFill.fillStyle(brickColor, 1);
        wallFill.fillRect(brickX + 1, y + 1, brickWidth - 2, brickHeight - 2);

        // 砖块底部和右侧阴影
        wallFill.fillStyle(brickShadow, 0.5);
        wallFill.fillRect(brickX + 1, y + brickHeight - 2, brickWidth - 2, 1);
        wallFill.fillRect(brickX + brickWidth - 2, y + 1, 1, brickHeight - 2);
      }
    }

    // 城墙属性
    this.wall.hp = 2000;
    this.wall.maxHp = 2000;
    this.wall.shield = 0;
    this.wall.maxShield = 0;
    this.wall.x = GAME_WIDTH / 2;
    this.wall.y = GAME_HEIGHT - 100;

    gameBridge.emit('wall:hp-changed', { hp: this.wall.hp, maxHp: this.wall.maxHp });
  }

  private createPlayer(): void {
    // 人物在城墙后面（底部）
    this.player = this.physics.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT - 60, 'player') as PlayerSprite;
    this.player.setImmovable(true);
    this.player.body!.allowGravity = false;
    this.player.setDepth(10);
    this.player.setRotation(0);
    this.player.setScale(0.7); // 缩小30% // 竖直站立

    // Player base stats
    this.player.baseHp = BALANCE.player.baseHp;
    this.player.baseFireRate = BALANCE.player.baseFireRate;
    this.player.baseDamage = BALANCE.player.baseDamage;
    this.player.baseBulletCount = BALANCE.player.baseBulletCount;
    this.player.baseBulletSpeed = BALANCE.player.baseBulletSpeed;
    this.player.baseCritChance = BALANCE.player.baseCritChance;
    this.player.baseCritMultiplier = BALANCE.player.baseCritMultiplier;

    // Player current stats
    this.player.hp = this.player.baseHp;
    this.player.maxHp = this.player.baseHp;
    this.player.fireRate = this.player.baseFireRate;
    this.player.damage = this.player.baseDamage;
    this.player.bulletCount = this.player.baseBulletCount;
    this.player.bulletSpeed = this.player.baseBulletSpeed;
    this.player.critChance = this.player.baseCritChance;
    this.player.critMultiplier = this.player.baseCritMultiplier;
    this.player.lastFireTime = 0;
    // 弹夹系统
    this.player.ammo = 30;
    this.player.maxAmmo = 30;
    this.player.isReloading = false;
    this.player.reloadTime = 2000; // 2秒换弹
    this.player.reloadTimer = 0;

    gameBridge.emit('player:hp-changed', { hp: this.player.hp, maxHp: this.player.maxHp });
    gameBridge.emit('ammo:changed', { ammo: this.player.ammo, maxAmmo: this.player.maxAmmo, isReloading: false });

    // 攻击范围指示器（默认隐藏）
    this.rangeIndicator = this.add.graphics();
    this.rangeIndicator.setDepth(1);
    this.rangeIndicator.setVisible(false);

    // 鼠标悬浮在人物上时显示攻击范围
    this.player.setInteractive();
    this.player.on('pointerover', () => {
      this.showAttackRange();
    });
    this.player.on('pointerout', () => {
      this.rangeIndicator.setVisible(false);
    });
  }

  private showAttackRange(): void {
    this.rangeIndicator.clear();
    this.rangeIndicator.setVisible(true);

    // 攻击范围：从城墙到屏幕80%高度
    const rangeTop = 0;
    const rangeBottom = GAME_HEIGHT * 0.8;
    const rangeHeight = rangeBottom - rangeTop;

    // 绘制半透明矩形表示攻击范围
    this.rangeIndicator.fillStyle(0xff0000, 0.1);
    this.rangeIndicator.fillRect(0, rangeTop, GAME_WIDTH, rangeHeight);
    this.rangeIndicator.lineStyle(1, 0xff0000, 0.3);
    this.rangeIndicator.strokeRect(0, rangeTop, GAME_WIDTH, rangeHeight);
  }

  private createGroups(): void {
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 1000, // 增加子弹池大小
      runChildUpdate: false,
    });

    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 200, // 增加敌人池大小
      runChildUpdate: false,
    });

    this.xpGems = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 50,
      runChildUpdate: false,
    });
  }

  private setupCollisions(): void {
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
    this.physics.add.overlap(this.player, this.xpGems, this.onCollectXP as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, undefined, this);
  }

  private setupBridgeListeners(): void {
    gameBridge.on('upgrade:selected', (data: { upgradeId: string }) => {
      this.applyUpgrade(data.upgradeId);
      // 安全恢复场景
      try {
        if (this.scene && this.scene.isPaused()) {
          this.scene.resume();
        }
      } catch (e) {
        // 场景可能已销毁
      }
    });

    gameBridge.on('game:restart', () => {
      try {
        this.scene.restart();
      } catch (e) {
        // 场景可能已销毁
      }
    });

    gameBridge.on('game:pause', () => {
      try {
        if (this.scene && this.scene.isActive()) {
          this.scene.pause();
        }
      } catch (e) {
        // 场景可能已销毁
      }
    });

    gameBridge.on('game:resume', () => {
      try {
        if (this.scene && this.scene.isPaused()) {
          this.scene.resume();
        }
      } catch (e) {
        // 场景可能已销毁
      }
    });

    gameBridge.on('game:toggle-shoot', (data: { enabled: boolean }) => {
      this.autoShootEnabled = data.enabled;
    });
  }

  update(time: number, delta: number): void {
    this.gameTime += delta;
    gameBridge.emit('game:time', { time: this.gameTime });

    this.updatePlayerAutoAim();
    this.updatePlayerFire(time);
    this.updateReload(delta);
    this.updateBullets(delta);
    this.updateEnemies(delta);
    this.updateWaveTimers(delta);
    this.checkXPAttraction();
    this.updateSkillCooldownInfo();
    this.updateDamageStats();
    this.updateGunStats();
  }

  private updateGunStats(): void {
    const burstLevel = this.upgradeLevels['gun_burst'] || 0;
    const rapidLevel = this.upgradeLevels['gun_rapid'] || 0;
    const splitLevel = this.upgradeLevels['gun_split_2'] ? 2 : (this.upgradeLevels['gun_split_4'] ? 4 : 0);
    const damageBonus = ((this.upgradeLevels['gun_damage'] || 0) * 60) + ((this.upgradeLevels['gun_all_damage'] || 0) * 100);
    const splitDamage = Math.round(this.player.damage * 0.5);

    gameBridge.emit('gun:stats', {
      damage: this.player.damage,
      damageBonus,
      burstCount: 1 + burstLevel,
      rapidCount: 1 + rapidLevel,
      splitCount: splitLevel,
      splitDamage,
      critChance: this.player.critChance,
      critMultiplier: this.player.critMultiplier,
    });
  }

  private updateDamageStats(): void {
    const totalDamage = Object.values(this.damageStats).reduce((sum, val) => sum + val, 0);
    if (totalDamage === 0) return;

    const statNames: Record<string, string> = {
      gun: '枪械',
      wind: '风系',
      thunder: '雷系',
      water: '水系',
      fire: '火系',
      earth: '土系',
      burn: '燃烧',
      split: '分裂',
    };

    const stats = Object.entries(this.damageStats)
      .filter(([_, damage]) => damage > 0)
      .map(([source, damage]) => ({
        source,
        icon: statNames[source] || source,
        damage: Math.round(damage),
        percentage: Math.round((damage / totalDamage) * 100),
      }))
      .sort((a, b) => b.damage - a.damage);

    gameBridge.emit('damage:stats', { stats });
  }

  private updateSkillCooldownInfo(): void {
    const skillNames: Record<string, string[]> = {
      wind: ['风咒', '旋风斩', '风卷残云'],
      thunder: ['雷咒', '惊雷术', '天雷空破'],
      water: ['冰咒', '寒冰破', '水漫金山'],
      fire: ['炎咒', '爆炎弹', '三味真火'],
      earth: ['土咒', '飞岩术', '泰山压顶'],
    };

    const skillInfo = this.activeSkillElements.map(element => {
      const skillId = `${element}_basic`;
      const cooldown = this.skillCooldowns[element] || 3000;
      const remaining = Math.max(0, this.skillTimers[skillId] || 0);
      const progress = cooldown > 0 ? (remaining / cooldown) * 100 : 0;
      const level = this.skillLevels[element] || 1;
      const name = skillNames[element]?.[level - 1] || element;
      const elementDamage = this.getElementDamage(element);

      return {
        name,
        element,
        level,
        cooldown,
        remaining,
        progress,
        elementDamage,
      };
    });
    gameBridge.emit('skills:updated', { skills: skillInfo });
  }

  private updateReload(delta: number): void {
    if (this.player.isReloading) {
      this.player.reloadTimer -= delta;
      if (this.player.reloadTimer <= 0) {
        this.player.isReloading = false;
        this.player.ammo = this.player.maxAmmo;
        gameBridge.emit('ammo:changed', { ammo: this.player.ammo, maxAmmo: this.player.maxAmmo, isReloading: false });
      }
    }
  }

  private updatePlayerAutoAim(): void {
    // 每次都重新寻找目标（确保目标有效）
    let currentTarget: EnemySprite | null = null;

    // 攻击范围：城墙以上到屏幕80%高度
    const attackRangeTop = GAME_HEIGHT * 0.2; // 屏幕80%高度（从顶部算20%）
    const attackRangeBottom = this.wall.y; // 城墙位置

    // 收集所有在范围内的敌人
    const candidates: EnemySprite[] = [];
    let maxY = -Infinity;

    this.enemies.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) return;
      if (enemy.y < attackRangeTop || enemy.y > attackRangeBottom) return;

      if (enemy.y > maxY) {
        maxY = enemy.y;
      }
    });

    // 收集所有y值最大的敌人（离城墙最近的）
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) return;
      if (enemy.y < attackRangeTop || enemy.y > attackRangeBottom) return;
      if (Math.abs(enemy.y - maxY) < 10) {
        candidates.push(enemy);
      }
    });

    // 随机选择一个
    if (candidates.length > 0) {
      currentTarget = candidates[Math.floor(Math.random() * candidates.length)];
    }

    this.player.setData('targetEnemy', currentTarget);
  }

  private updatePlayerFire(time: number): void {
    if (!this.autoShootEnabled) return; // 自动射击关闭时不射击
    if (this.player.isReloading) return;
    if (time - this.player.lastFireTime < this.player.fireRate) return;

    this.player.lastFireTime = time;
    this.fireBullets();
  }

  private fireBullets(): void {
    if (this.player.isReloading) return;

    // 检查弹夹
    if (this.player.ammo <= 0) {
      this.startReload();
      return;
    }

    // 获取目标敌人
    const targetEnemy = this.player.getData('targetEnemy') as EnemySprite | null;
    if (!targetEnemy || !targetEnemy.active) return;

    const burstLevel = this.upgradeLevels['gun_burst'] || 0;
    const burstCount = 1 + burstLevel; // 齐射数量
    const rapidLevel = this.upgradeLevels['gun_rapid'] || 0;
    const rapidCount = 1 + rapidLevel; // 连射数量
    const bulletSpeed = this.player.bulletSpeed;
    const verticalOffset = 12; // 连射子弹垂直间距

    // 齐射角度：1级15度，2级25度
    const burstAngles = [0, 15, 25];
    const totalSpreadAngle = burstLevel > 0 ? burstAngles[burstLevel] : 0;

    // 计算基础角度（从人物到敌人）
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetEnemy.x, targetEnemy.y);

    // 连射：垂直方向发射多排子弹（轨迹相同，只是起始位置不同）
    for (let r = 0; r < rapidCount; r++) {
      this.time.delayedCall(r * 80, () => { // 每排间隔80ms
        if (!this.player.active || this.player.isReloading) return;

        // 齐射：每排发射多颗子弹（以基础角度为中心，扇形展开）
        for (let i = 0; i < burstCount; i++) {
          // 计算角度偏移（以基础角度为中心，左右展开）
          let angleOffset = 0;
          if (burstCount > 1 && totalSpreadAngle > 0) {
            angleOffset = (i - (burstCount - 1) / 2) * (totalSpreadAngle / (burstCount - 1));
          }
          const angle = baseAngle + Phaser.Math.DegToRad(angleOffset);

          // 子弹从人物顶部射出
          const startX = this.player.x;
          const startY = this.player.y - 26 - r * verticalOffset;

          // 从池中获取子弹（复用不活跃的）
          let bullet: BulletSprite | null = null;
          const children = this.bullets.getChildren();
          for (let j = 0; j < children.length; j++) {
            const b = children[j] as BulletSprite;
            if (!b.active) {
              bullet = b;
              break;
            }
          }

          // 如果池中没有不活跃的子弹，且池未满，则创建新的
          if (!bullet) {
            if (this.bullets.getLength() >= this.bullets.maxSize!) {
              return; // 池满了，无法创建
            }
            bullet = this.bullets.create(startX, startY, 'bullet') as BulletSprite;
          }

          if (!bullet) continue;

          // 根据元素子弹类型设置纹理
          if (this.upgradeLevels['gun_fire'] && this.textures.exists('bullet-fire')) {
            bullet.setTexture('bullet-fire');
          } else if (this.upgradeLevels['gun_ice'] && this.textures.exists('bullet-ice')) {
            bullet.setTexture('bullet-ice');
          } else if (this.upgradeLevels['gun_thunder'] && this.textures.exists('bullet-thunder')) {
            bullet.setTexture('bullet-thunder');
          } else {
            bullet.setTexture('bullet');
          }

          // 计算子弹伤害
          const isCrit = Math.random() < this.player.critChance;
          bullet.damage = isCrit ? this.player.damage * this.player.critMultiplier : this.player.damage;
          bullet.isCrit = isCrit;
          bullet.piercing = 0;

          // 主子弹大小统一（基于基础伤害，不含暴击）
          const damageRatio = this.player.damage / this.player.baseDamage;
          const bulletScale = Math.min(1.5, 0.5 + damageRatio * 0.25);

          // 重置子弹状态
          bullet.setPosition(startX, startY);
          bullet.setActive(true);
          bullet.setVisible(true);
          bullet.setScale(bulletScale);
          bullet.setDepth(15); // 子弹在敌人之上
          bullet.body!.setSize(12, 12);
          bullet.body!.reset(startX, startY);

          // 主子弹（中间那颗）追踪目标，齐射子弹不追踪
          const isCenterBullet = burstCount === 1 || i === Math.floor(burstCount / 2);
          bullet.setData('target', isCenterBullet ? targetEnemy : null);
          bullet.speed = bulletSpeed;
          bullet.setData('canSplit', true); // 标记可以分裂

          // 子弹朝向计算好的角度飞行
          const vx = Math.cos(angle) * bulletSpeed;
          const vy = Math.sin(angle) * bulletSpeed;
          bullet.setVelocity(vx, vy);
          bullet.setRotation(angle + Math.PI / 2); // 旋转子弹头部朝向飞行方向
        }
      });
    }

    // 扣除弹药
    this.player.ammo -= 1;
    gameBridge.emit('ammo:changed', { ammo: this.player.ammo, maxAmmo: this.player.maxAmmo, isReloading: false });

    // 弹药用完开始换弹
    if (this.player.ammo <= 0) {
      this.startReload();
    }
  }

  private recycleBullet(bullet: BulletSprite): void {
    bullet.setActive(false);
    bullet.setVisible(false);
    bullet.body!.stop();
    bullet.body!.reset(0, 0);
    bullet.setTexture('bullet'); // 重置为普通子弹纹理
    bullet.setData('target', null);
    bullet.setData('canSplit', null);
    bullet.setData('hit', null);
  }

  private startReload(): void {
    this.player.isReloading = true;
    this.player.reloadTimer = this.player.reloadTime;
    gameBridge.emit('ammo:changed', { ammo: 0, maxAmmo: this.player.maxAmmo, isReloading: true });
  }

  private updateBullets(_delta: number): void {
    const bulletsToRecycle: BulletSprite[] = [];

    this.bullets.getChildren().forEach((child) => {
      const bullet = child as BulletSprite;
      if (!bullet.active) return;

      // 追踪目标 - 只追踪原始目标，目标死亡后不再追踪
      const target = bullet.getData('target') as EnemySprite;
      if (target) {
        if (target.active) {
          // 目标还活着，继续追踪
          const angle = Phaser.Math.Angle.Between(bullet.x, bullet.y, target.x, target.y);
          bullet.setVelocity(
            Math.cos(angle) * bullet.speed,
            Math.sin(angle) * bullet.speed
          );
        } else {
          // 目标已死亡，清除目标引用，子弹保持当前方向飞行
          bullet.setData('target', null);
        }
      }

      // 超出屏幕回收
      if (bullet.y < -50 || bullet.y > GAME_HEIGHT + 50 || bullet.x < -50 || bullet.x > GAME_WIDTH + 50) {
        bulletsToRecycle.push(bullet);
      }
    });

    // 回收子弹
    bulletsToRecycle.forEach(bullet => {
      this.recycleBullet(bullet);
    });
  }

  private updateEnemies(delta: number): void {
    const currentTime = this.time.now;
    const enemiesToRecycle: EnemySprite[] = [];

    this.enemies.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) return;

      // 回收超出屏幕的敌人（底部）
      if (enemy.y > GAME_HEIGHT + 100) {
        enemiesToRecycle.push(enemy);
        return;
      }

      // 回收在城墙停留超过30秒的敌人
      const wallArriveTime = enemy.getData('wallArriveTime') || 0;
      if (wallArriveTime > 0 && currentTime - wallArriveTime > 30000) {
        enemiesToRecycle.push(enemy);
        return;
      }

      // 获取或生成唯一ID
      let enemyId = enemy.getData('uniqueId') as string;
      if (!enemyId) {
        enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        enemy.setData('uniqueId', enemyId);
      }

      // 更新buff效果
      const buffResult = buffManager.update(enemyId, delta, currentTime);

      // 更新buff视觉效果
      this.updateEnemyBuffVisuals(enemy, enemyId);

      // 限制敌人在屏幕范围内（减少10单位边距）
      enemy.y = Phaser.Math.Clamp(enemy.y, 10, GAME_HEIGHT - 20);
      enemy.x = Phaser.Math.Clamp(enemy.x, 10, GAME_WIDTH - 20);

      // 应用DOT伤害
      if (buffResult.dotDamage > 0) {
        const dotDamageAmount = Math.round(this.player.damage * buffResult.dotDamage);
        enemy.hp -= dotDamageAmount;
        this.showDamageNumber(enemy.x, enemy.y - 20, dotDamageAmount, false);

        // 记录燃烧伤害
        if (buffManager.hasBuff(enemyId, 'burn')) {
          this.damageStats.burn = (this.damageStats.burn || 0) + dotDamageAmount;
        }

        if (enemy.hp <= 0) {
          this.killEnemy(enemy);
          return;
        }
      }

      // 应用移动限制
      if (!buffResult.shouldMove) {
        enemy.setVelocity(0, 0);
        // 冰冻/眩晕时暂停动画
        if (enemy.anims && enemy.anims.isPlaying) {
          enemy.anims.pause();
        }
      } else if (buffResult.moveMultiplier < 1) {
        enemy.setVelocityY(enemy.speed * buffResult.moveMultiplier);
        // 恢复动画
        if (enemy.anims && enemy.anims.isPaused) {
          enemy.anims.resume();
        }
      } else {
        // 没有减速buff时，恢复正常速度
        const wallTop = this.wall.y - 30;
        if (enemy.y < wallTop) {
          // 还没到城墙，继续移动
          enemy.setVelocityY(enemy.speed);
        } else {
          // 已经到达或超过城墙，强制停在城墙位置
          enemy.y = wallTop;
          enemy.setVelocityY(0);
          enemy.setVelocityX(0);
          enemy.body!.reset(enemy.x, enemy.y);
        }
        // 恢复动画
        if (enemy.anims && enemy.anims.isPaused) {
          enemy.anims.resume();
        }
      }

      // 确保敌人不会穿过城墙
      const wallTop = this.wall.y - 30;
      if (enemy.y > wallTop) {
        enemy.y = wallTop;
        enemy.body!.reset(enemy.x, enemy.y);
      }

      // 更新血条位置
      this.updateEnemyHpBar(enemy);

      // 检查攻击城墙
      if (buffResult.shouldAttack) {
        // 敌人停在城墙顶部
        const wallTop = this.wall.y - 30;
        if (enemy.y >= wallTop) {
          enemy.y = wallTop;
          enemy.setVelocityY(0);
          enemy.setVelocityX(0);
          // 同步碰撞体位置
          enemy.body!.reset(enemy.x, enemy.y);

          // 记录到达城墙的时间
          if (!enemy.getData('wallArriveTime')) {
            enemy.setData('wallArriveTime', currentTime);
          }

          const lastAttack = enemy.getData('lastWallAttack') || 0;

          if (currentTime - lastAttack >= enemy.attackCooldown) {
            enemy.setData('lastWallAttack', currentTime);
            this.wall.hp = Math.max(0, this.wall.hp - enemy.damage);

            // 更新城墙血量显示
            this.updateWallHpDisplay();

            this.showDamageNumber(this.wall.x, this.wall.y - 30, enemy.damage, false);
            gameBridge.emit('wall:hp-changed', { hp: this.wall.hp, maxHp: this.wall.maxHp });

            if (this.wall.hp <= 0) {
              this.gameOver();
            }
          }
        }
      }
    });

    // 回收超出屏幕的敌人
    enemiesToRecycle.forEach(enemy => {
      this.recycleEnemy(enemy);
    });
  }

  private recycleEnemy(enemy: EnemySprite): void {
    // 销毁血条
    const hpBar = enemy.getData('hpBar') as Phaser.GameObjects.Graphics;
    if (hpBar) hpBar.destroy();

    // 销毁名称文本
    const nameText = enemy.getData('nameText') as Phaser.GameObjects.Text;
    if (nameText) nameText.destroy();

    // 销毁血量文本
    const hpText = enemy.getData('hpText') as Phaser.GameObjects.Text;
    if (hpText) hpText.destroy();

    // 销毁buff图标
    const buffIcon = enemy.getData('buffIcon') as Phaser.GameObjects.Text;
    if (buffIcon) buffIcon.destroy();

    // 清除所有数据
    enemy.setData('hpBar', null);
    enemy.setData('nameText', null);
    enemy.setData('hpText', null);
    enemy.setData('buffIcon', null);
    enemy.setData('wallArriveTime', null);
    enemy.setData('lastWallAttack', null);
    enemy.setData('uniqueId', null); // 清除唯一ID

    // 回收到池中
    enemy.setActive(false);
    enemy.setVisible(false);
    enemy.body!.stop();
    enemy.body!.reset(0, 0);
  }

  private updateWallHpDisplay(): void {
    // 城墙血量已通过 bridge 发送到 React HUD 显示
  }

  private updateEnemyBuffVisuals(enemy: EnemySprite, enemyId: string): void {
    const buffs = buffManager.getBuffs(enemyId);

    // 清除旧的buff图标
    const oldBuffIcon = enemy.getData('buffIcon') as Phaser.GameObjects.Text;
    if (oldBuffIcon) {
      oldBuffIcon.destroy();
    }

    // 如果有buff，显示图标
    if (buffs.length > 0) {
      const buffEmojis: Record<string, string> = {
        burn: '🔥',
        freeze: '❄️',
        paralyze: '⚡',
        stun: '💫',
        bleed: '🩸',
        slow: '🐌',
      };

      // 显示第一个buff的图标
      const firstBuff = buffs[0];
      const emoji = buffEmojis[firstBuff.type] || '✨';

      const buffIcon = this.add.text(enemy.x, enemy.y - enemy.height * enemy.scaleY / 2 - 25, emoji, {
        fontSize: '16px',
      });
      buffIcon.setOrigin(0.5);
      buffIcon.setDepth(17);
      enemy.setData('buffIcon', buffIcon);
    }
  }

  private updateWaveTimers(delta: number): void {
    this.waveTimer += delta;
    if (this.waveTimer >= this.waveInterval) {
      this.waveTimer -= this.waveInterval;
      this.startNextWave();
    }

    // 更新技能冷却
    this.updateSkillCooldowns(delta);

    // 自动释放技能
    this.autoUseSkills();

    for (let i = this.spawnTimers.length - 1; i >= 0; i--) {
      const wave = this.spawnTimers[i];
      wave.timer += delta;

      if (wave.timer >= wave.config.spawnInterval && wave.remaining > 0) {
        wave.timer -= wave.config.spawnInterval;
        this.spawnEnemyForWave(wave.config, wave.wave);
        wave.remaining--;
      }

      if (wave.remaining <= 0) {
        this.spawnTimers.splice(i, 1);
      }
    }
  }

  private updateSkillCooldowns(delta: number): void {
    for (const skillId in this.skillTimers) {
      if (this.skillTimers[skillId] > 0) {
        this.skillTimers[skillId] -= delta;
      }
    }
  }

  private autoUseSkills(): void {
    // 自动释放激活的技能
    for (const element of this.activeSkillElements) {
      const skillId = `${element}_basic`;
      const cooldown = this.skillCooldowns[element] || 3000;
      // 只有当冷却完成（progress >= 100）时才能释放
      if (!this.skillTimers[skillId] || this.skillTimers[skillId] <= 0) {
        this.useSkill(element);
        // 设置临时冷却，防止在技能效果期间重复释放
        this.skillTimers[skillId] = cooldown;
      }
    }
  }

  private startSkillCooldown(element: string): void {
    const skillId = `${element}_basic`;
    const cooldown = this.skillCooldowns[element] || 3000;
    this.skillTimers[skillId] = cooldown;
  }

  private useSkill(element: string): void {
    const skillEmojis: Record<string, string> = {
      wind: '🌪️',
      thunder: '⚡',
      water: '💧',
      fire: '🔥',
      earth: '🪨',
    };

    const emoji = skillEmojis[element];
    if (!emoji) return;

    // 技能范围：城墙以上到屏幕60%高度
    const skillRangeTop = GAME_HEIGHT * 0.4; // 屏幕60%高度（从顶部算40%）
    const skillRangeBottom = this.wall.y;

    // 随机选择一个在技能范围内的敌人
    const enemies = this.enemies.getChildren().filter(e => {
      const enemy = e as EnemySprite;
      return enemy.active && enemy.y >= skillRangeTop && enemy.y <= skillRangeBottom;
    }) as EnemySprite[];

    if (enemies.length === 0) return;

    const target = enemies[Math.floor(Math.random() * enemies.length)];

    // 在敌人上方50px创建技能效果
    const skillEffect = this.add.text(target.x, target.y - 50, emoji, {
      fontSize: '32px',
    });
    skillEffect.setOrigin(0.5);
    skillEffect.setDepth(20);

    // 计算技能伤害（基础2倍 + 元素伤害加成）
    const elementDamageBonus = this.getElementDamage(element);
    const baseDamage = this.player.damage * 2;
    const totalDamage = baseDamage + elementDamageBonus;

    // 风系技能有持续时间
    if (element === 'wind') {
      this.createWindSkill(skillEffect, target, totalDamage);
      return;
    }

    // 其他技能一次性效果
    this.tweens.add({
      targets: skillEffect,
      y: target.y,
      duration: 500,
      onComplete: () => {
        // 获取敌人唯一ID
        const enemyId = target.getData('uniqueId') as string;
        if (!enemyId) {
          skillEffect.destroy();
          return;
        }

        // 获取buff效果（包括流血增伤）
        const buffResult = buffManager.update(enemyId, 0, this.time.now);
        const damageMultiplier = buffResult.damageMultiplier;

        // 计算实际伤害（考虑流血增伤）
        const actualDamage = Math.round(totalDamage * damageMultiplier);
        target.hp -= actualDamage;
        this.showDamageNumber(target.x, target.y - 20, actualDamage, false);

        // 记录技能伤害
        this.damageStats[element] = (this.damageStats[element] || 0) + actualDamage;

        // 应用元素效果
        const skillLevel = this.skillLevels[element] || 1;
        switch (element) {
          case 'fire':
            // 火系默认燃烧1秒，三味真火(skill_fire_3)延长到3秒
            const burnDuration = skillLevel >= 3 ? 3000 : 1000;
            buffManager.addBuff(enemyId, 'burn', burnDuration);
            break;
          case 'water':
            buffManager.addBuff(enemyId, 'freeze');
            break;
          case 'thunder':
            buffManager.addBuff(enemyId, 'paralyze');
            break;
          case 'earth':
            buffManager.addBuff(enemyId, 'stun');
            break;
        }

        if (target.hp <= 0) {
          this.killEnemy(target);
        }

        skillEffect.destroy();
      },
    });
  }

  private getElementDamage(element: string): number {
    const elementUpgradeId = `element_${element}` as UpgradeId;
    const elementLevel = this.upgradeLevels[elementUpgradeId] || 0;
    // 每级元素伤害增加60%的基础伤害
    return this.player.baseDamage * (elementLevel * 0.6);
  }

  private createWindSkill(skillEffect: Phaser.GameObjects.Text, target: EnemySprite, baseDamage: number): void {
    // 风系技能：持续5秒，碰到敌人就造成伤害
    const duration = 5000;
    const damageInterval = 500; // 每0.5秒检测一次碰撞
    const startTime = this.time.now;
    let lastDamageTime = 0;

    // 技能飞到目标位置
    this.tweens.add({
      targets: skillEffect,
      y: target.y,
      duration: 500,
      onComplete: () => {
        // 创建定时器检测碰撞
        const windTimer = this.time.addEvent({
          delay: damageInterval,
          callback: () => {
            const currentTime = this.time.now;

            // 检查持续时间
            if (currentTime - startTime >= duration) {
              skillEffect.destroy();
              windTimer.destroy();
              return;
            }

            // 让技能在目标位置附近飘动
            skillEffect.x += Phaser.Math.Between(-20, 20);
            skillEffect.y += Phaser.Math.Between(-10, 10);

            // 检测与敌人的碰撞
            this.enemies.getChildren().forEach((child) => {
              const enemy = child as EnemySprite;
              if (!enemy.active) return;

              const distance = Phaser.Math.Distance.Between(
                skillEffect.x, skillEffect.y,
                enemy.x, enemy.y
              );

              // 碰撞范围
              if (distance < 40 && currentTime - lastDamageTime >= damageInterval) {
                lastDamageTime = currentTime;

                const enemyId = `enemy_${enemy.x}_${enemy.y}`;

                // 获取buff效果（包括流血增伤）
                const buffResult = buffManager.update(enemyId, 0, currentTime);
                const damageMultiplier = buffResult.damageMultiplier;

                // 计算实际伤害（考虑流血增伤）
                const actualDamage = Math.round(baseDamage * damageMultiplier);
                enemy.hp -= actualDamage;
                this.showDamageNumber(enemy.x, enemy.y - 20, actualDamage, false);

                // 记录风系伤害
                this.damageStats.wind += actualDamage;

                // 应用减速效果
                buffManager.addBuff(enemyId, 'slow');

                if (enemy.hp <= 0) {
                  this.killEnemy(enemy);
                }
              }
            });
          },
          loop: true,
        });
      },
    });
  }

  private startNextWave(): void {
    this.waveNumber++;
    this.waveInProgress = true;
    const waveConfig = getWaveConfig(this.waveNumber);

    gameBridge.emit('wave:started', { waveNumber: this.waveNumber });

    this.spawnTimers.push({
      wave: this.waveNumber,
      timer: 0,
      remaining: waveConfig.totalEnemies,
      config: waveConfig,
    });
  }

  private spawnEnemyForWave(waveConfig: ReturnType<typeof getWaveConfig>, waveNum: number): void {
    let enemyTypeKey = this.selectEnemyType(waveConfig.enemyTypes);
    let enemyType = ENEMY_TYPES[enemyTypeKey];

    // 检查精英和首领数量限制
    if (enemyType.type === 'elite' || enemyType.type === 'boss') {
      const currentEliteCount = this.enemies.getChildren().filter(e =>
        e.active && (e as EnemySprite).enemyType === 'tank'
      ).length;
      const currentBossCount = this.enemies.getChildren().filter(e =>
        e.active && (e as EnemySprite).enemyType === 'boss'
      ).length;

      if (enemyType.type === 'elite' && currentEliteCount >= 1) {
        // 已有精英，改为生成普通敌人
        enemyTypeKey = 'walker';
        enemyType = ENEMY_TYPES['walker'];
      }
      if (enemyType.type === 'boss' && currentBossCount >= 1) {
        // 已有首领，改为生成普通敌人
        enemyTypeKey = 'walker';
        enemyType = ENEMY_TYPES['walker'];
      }
    }

    // 敌人从顶部生成，随机x位置
    const spawnX = Phaser.Math.Between(30, GAME_WIDTH - 30);
    const spawnY = -30;

    // 从池中获取敌人（复用不活跃的）
    let enemy: EnemySprite | null = null;
    const children = this.enemies.getChildren();
    for (let j = 0; j < children.length; j++) {
      const e = children[j] as EnemySprite;
      if (!e.active) {
        enemy = e;
        break;
      }
    }

    // 如果池中没有不活跃的敌人，且池未满，则创建新的
    if (!enemy) {
      if (this.enemies.getLength() >= this.enemies.maxSize!) {
        return; // 池满了，无法创建
      }
      enemy = this.enemies.create(spawnX, spawnY, enemyType.texture) as EnemySprite;
    }

    if (!enemy) return;

    // 重置敌人状态
    enemy.setPosition(spawnX, spawnY);
    enemy.setActive(true);
    enemy.setVisible(true);

    // 设置唯一ID
    const uniqueId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    enemy.setData('uniqueId', uniqueId);

    // 设置敌人纹理和缩放（素材是600x1080，需要大幅缩小）
    if (enemyTypeKey === 'walker' && this.textures.exists('zombie-walk-1')) {
      enemy.setTexture('zombie-walk-1');
      enemy.setScale(0.08); // 600*0.08=48px宽
    } else if (enemyTypeKey === 'runner' && this.textures.exists('runner-walk-1')) {
      enemy.setTexture('runner-walk-1');
      enemy.setScale(0.06); // 600*0.06=36px宽
    } else if (enemyTypeKey === 'tank' && this.textures.exists('zombie-walk-1')) {
      // 精英暂时使用普通僵尸素材
      enemy.setTexture('zombie-walk-1');
      enemy.setScale(0.1); // 稍大
    } else if (enemyTypeKey === 'splitter' && this.textures.exists('zombie-walk-1')) {
      // 分裂尸暂时使用普通僵尸素材
      enemy.setTexture('zombie-walk-1');
      enemy.setScale(0.08);
    } else if (enemyTypeKey === 'boss' && this.textures.exists('boss')) {
      enemy.setTexture('boss');
      enemy.setScale(0.12); // Boss稍大
    } else {
      enemy.setTexture(enemyType.texture);
      enemy.setScale(enemyType.scale);
    }

    enemy.setCollideWorldBounds(true);
    enemy.setDepth(3); // 敌人在城墙层级下面
    enemy.body!.reset(spawnX, spawnY);

    // 设置碰撞体大小（基于缩放后的纹理）
    const textureWidth = enemy.width * enemy.scaleX;
    const textureHeight = enemy.height * enemy.scaleY;
    enemy.body!.setSize(textureWidth * 0.8, textureHeight * 0.8);

    // 为walker类型添加行走动画
    if (enemyTypeKey === 'walker' && this.anims.exists('zombie-walk')) {
      enemy.play('zombie-walk');
    } else if (enemyTypeKey === 'runner' && this.anims.exists('runner-walk')) {
      enemy.play('runner-walk');
    } else if (enemyTypeKey === 'tank' && this.anims.exists('zombie-walk')) {
      // 精英使用普通僵尸动画
      enemy.play('zombie-walk');
    } else if (enemyTypeKey === 'splitter' && this.anims.exists('zombie-walk')) {
      // 分裂尸使用普通僵尸动画
      enemy.play('zombie-walk');
    } else if (enemyTypeKey === 'boss' && this.anims.exists('boss-walk')) {
      enemy.play('boss-walk');
    }

    // 关卡基础血量 = 100 * 关卡数
    const stageBaseHp = 100 * waveNum;
    const hpMultiplier = 1 + (waveNum - 1) * 0.1;

    enemy.hp = Math.floor(enemyType.baseHp * stageBaseHp * hpMultiplier);
    enemy.maxHp = enemy.hp;
    // 速度直接使用敌人定义的速度（已在enemies.ts中降低40%）
    enemy.speed = enemyType.speed;
    enemy.damage = enemyType.damage;
    enemy.enemyType = enemyTypeKey;
    enemy.xpValue = enemyType.xpValue;
    enemy.isBoss = enemyType.isBoss || false;
    enemy.slowTimer = 0;
    enemy.burnTimer = 0;
    enemy.burnDamage = 0;
    enemy.attackCooldown = enemyType.attackCooldown;
    enemy.defense = enemyType.defense;
    enemy.dodgeRate = enemyType.dodgeRate;

    // 添加血条
    const hpBar = this.add.graphics();
    hpBar.setDepth(15);
    enemy.setData('hpBar', hpBar);
    this.updateEnemyHpBar(enemy);

    // 精英和首领添加名称显示
    if (enemyType.type === 'elite' || enemyType.type === 'boss') {
      const nameText = this.add.text(enemy.x, enemy.y - enemy.height * enemy.scaleY / 2 - 16, enemyType.name, {
        fontSize: enemyType.type === 'boss' ? '14px' : '12px',
        fontFamily: 'Arial',
        color: enemyType.type === 'boss' ? '#fbbf24' : '#a855f7',
        stroke: '#000000',
        strokeThickness: 2,
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(16);
      enemy.setData('nameText', nameText);

      // 首领显示总血量
      if (enemyType.type === 'boss') {
        const hpText = this.add.text(enemy.x, enemy.y - enemy.height * enemy.scaleY / 2 - 32, `HP: ${Math.round(enemy.hp)}`, {
          fontSize: '12px',
          fontFamily: 'Arial',
          color: '#ef4444',
          stroke: '#000000',
          strokeThickness: 2,
        });
        hpText.setOrigin(0.5);
        hpText.setDepth(16);
        enemy.setData('hpText', hpText);
      }
    }

    enemy.setVelocityY(enemy.speed); // 向下移动

    if (enemyType.zigzag) {
      enemy.setVelocityX(Phaser.Math.Between(-30, 30)); // 水平锯齿移动
    }
  }

  private updateEnemyHpBar(enemy: EnemySprite): void {
    const hpBar = enemy.getData('hpBar') as Phaser.GameObjects.Graphics;
    if (!hpBar || !enemy.active) return;

    hpBar.clear();

    const barWidth = 40;
    const barHeight = 4;
    const x = enemy.x - barWidth / 2;
    const y = enemy.y - enemy.height * enemy.scaleY / 2 - 8;

    // 背景
    hpBar.fillStyle(0x000000, 0.5);
    hpBar.fillRect(x, y, barWidth, barHeight);

    // 血量
    const hpPercent = enemy.hp / enemy.maxHp;
    const hpColor = hpPercent > 0.5 ? 0x22c55e : hpPercent > 0.25 ? 0xf59e0b : 0xef4444;
    hpBar.fillStyle(hpColor, 1);
    hpBar.fillRect(x, y, barWidth * hpPercent, barHeight);

    // 边框
    hpBar.lineStyle(1, 0x000000, 0.8);
    hpBar.strokeRect(x, y, barWidth, barHeight);

    // 更新名称文本位置
    const nameText = enemy.getData('nameText') as Phaser.GameObjects.Text;
    if (nameText) {
      nameText.setPosition(enemy.x, enemy.y - enemy.height * enemy.scaleY / 2 - 16);
    }

    // 更新血量文本位置（首领）
    const hpText = enemy.getData('hpText') as Phaser.GameObjects.Text;
    if (hpText) {
      hpText.setPosition(enemy.x, enemy.y - enemy.height * enemy.scaleY / 2 - 32);
      hpText.setText(`HP: ${Math.round(enemy.hp)}`);
    }
  }

  private selectEnemyType(types: { type: string; weight: number }[]): string {
    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const t of types) {
      random -= t.weight;
      if (random <= 0) return t.type;
    }

    return types[0].type;
  }

  private generateUpgradeOptions(): void {
    const playerHpPercent = (this.player.hp / this.player.maxHp) * 100;
    const options = getRandomUpgradeOptions(this.upgradeLevels, playerHpPercent, this.activeSkillElements, 3);

    const upgradeOptions = options.map(u => ({
      id: u.id,
      name: u.name,
      description: u.levelEffect((this.upgradeLevels[u.id] || 0) + 1),
      category: u.category,
      icon: u.icon,
      currentLevel: this.upgradeLevels[u.id] || 0,
      maxLevel: u.maxLevel,
    }));

    gameBridge.emit('upgrade:options', { options: upgradeOptions });
    this.scene.pause();
  }

  private applyUpgrade(upgradeId: string): void {
    this.upgradeLevels[upgradeId as UpgradeId] = (this.upgradeLevels[upgradeId as UpgradeId] || 0) + 1;
    const level = this.upgradeLevels[upgradeId as UpgradeId];

    console.log(`applyUpgrade: ${upgradeId}, level=${level}`);

    switch (upgradeId) {
      case 'gun_damage':
        this.player.damage = this.player.baseDamage * (1 + level * 0.6);
        break;
      case 'gun_burst':
        // 齐射效果在fireBullets中通过upgradeLevels处理
        console.log(`gun_burst upgraded to level ${level}`);
        break;
      case 'gun_rapid':
        // 连射效果在fireBullets中处理
        console.log(`gun_rapid upgraded to level ${level}`);
        break;
      case 'heal_30':
        const healAmount = this.player.maxHp * 0.3;
        this.player.hp = Math.min(this.player.hp + healAmount, this.player.maxHp);
        gameBridge.emit('player:hp-changed', { hp: this.player.hp, maxHp: this.player.maxHp });
        break;
    }

    // 处理技能卡牌
    const skillMatch = upgradeId.match(/^skill_(\w+)_(\d)$/);
    if (skillMatch) {
      const element = skillMatch[1];
      const skillLevel = parseInt(skillMatch[2]);

      // 添加到激活的技能系别
      if (!this.activeSkillElements.includes(element)) {
        this.activeSkillElements.push(element);
      }

      // 更新技能等级
      this.skillLevels[element] = skillLevel;

      // 更新技能冷却时间（等级越高冷却越短）
      // 初始技能3秒，进阶1为2.5秒，进阶2为2秒
      const baseCooldown = element === 'wind' ? 5000 : 3000;
      this.skillCooldowns[element] = Math.max(1500, baseCooldown - (skillLevel - 1) * 500);
    }

    // 处理元素伤害卡牌
    const elementMatch = upgradeId.match(/^element_(\w+)$/);
    if (elementMatch) {
      // 元素伤害在useSkill中计算
    }
  }

  private onBulletHitEnemy(bullet: BulletSprite, enemy: EnemySprite): void {
    if (!bullet.active || !enemy.active) return;

    // 防止同一颗子弹多次命中
    if (bullet.getData('hit')) return;
    bullet.setData('hit', true);

    // 获取敌人唯一ID
    let enemyId = enemy.getData('uniqueId') as string;
    if (!enemyId) {
      enemyId = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      enemy.setData('uniqueId', enemyId);
    }

    // 获取buff效果（包括流血增伤）
    const buffResult = buffManager.update(enemyId, 0, this.time.now);
    const damageMultiplier = buffResult.damageMultiplier;

    // 计算实际伤害（考虑流血增伤）
    const actualDamage = Math.round(bullet.damage * damageMultiplier);
    enemy.hp -= actualDamage;
    this.showDamageNumber(enemy.x, enemy.y - 20, actualDamage, bullet.isCrit);

    // 记录枪械伤害
    this.damageStats.gun += actualDamage;

    // 分裂子弹效果 - 只有标记了 canSplit 的子弹才能分裂
    const canSplit = bullet.getData('canSplit') !== false;
    if (canSplit) {
      const splitLevel = this.upgradeLevels['gun_split_2'] ? 2 : (this.upgradeLevels['gun_split_4'] ? 4 : 0);
      if (splitLevel > 0) {
        this.createSplitBullets(enemy.x, enemy.y, splitLevel, bullet.damage * 0.5);
      }
    }

    // 元素子弹效果 - 使用buff系统
    if (this.upgradeLevels['gun_fire']) {
      buffManager.addBuff(enemyId, 'burn');
    }
    if (this.upgradeLevels['gun_ice']) {
      buffManager.addBuff(enemyId, 'freeze');
    }
    if (this.upgradeLevels['gun_thunder']) {
      buffManager.addBuff(enemyId, 'paralyze');
    }

    if (bullet.piercing > 0) {
      bullet.piercing--;
      bullet.setData('hit', false); // 穿透子弹可以继续命中
    } else {
      this.recycleBullet(bullet);
    }

    if (enemy.hp <= 0) {
      this.killEnemy(enemy);
    }
  }

  private createSplitBullets(x: number, y: number, count: number, damage: number): void {
    const splitAngle = 120; // 分裂角度范围
    const speed = this.player.bulletSpeed;

    for (let i = 0; i < count; i++) {
      // 向上分裂，均匀分布
      const angle = -90 + (i - (count - 1) / 2) * (splitAngle / Math.max(count - 1, 1));
      const rad = Phaser.Math.DegToRad(angle);

      // 从池中获取子弹
      let bullet: BulletSprite | null = null;
      const children = this.bullets.getChildren();
      for (let j = 0; j < children.length; j++) {
        const b = children[j] as BulletSprite;
        if (!b.active) {
          bullet = b;
          break;
        }
      }

      if (!bullet) {
        if (this.bullets.getLength() >= this.bullets.maxSize!) {
          return;
        }
        bullet = this.bullets.create(x, y, 'split-bullet') as BulletSprite;
      }

      if (!bullet) continue;

      bullet.setPosition(x, y);
      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setTexture('split-bullet'); // 使用分裂子弹纹理
      bullet.setScale(1);
      bullet.setDepth(5); // 分裂子弹也在人物层级下面
      bullet.body!.setSize(8, 8);
      bullet.body!.reset(x, y);

      bullet.setVelocity(Math.cos(rad) * speed, Math.sin(rad) * speed);
      bullet.damage = damage;
      bullet.isCrit = false;
      bullet.piercing = 0;
      bullet.speed = speed;
      bullet.setData('canSplit', false); // 分裂的子弹不能再分裂
      bullet.setData('target', null);

      this.time.delayedCall(1500, () => {
        if (bullet.active) {
          this.recycleBullet(bullet);
        }
      });
    }
  }

  private killEnemy(enemy: EnemySprite): void {
    // 回收敌人到池中
    this.recycleEnemy(enemy);

    this.killCount++;
    this.score += enemy.xpValue * 10;

    // 首领不计算经验值
    if (!enemy.isBoss) {
      // 只有未满级时才增加经验值
      if (this.currentLevel < this.maxLevel) {
        this.xp += this.xpPerEnemy;

        // 检查升级
        while (this.xp >= this.xpToNextLevel && this.currentLevel < this.maxLevel) {
          this.xp -= this.xpToNextLevel;
          this.currentLevel++;
          this.generateUpgradeOptions();
        }
      }
    }

    gameBridge.emit('score:changed', { score: this.score });
    gameBridge.emit('enemy:killed', { type: enemy.enemyType });
    gameBridge.emit('xp:changed', { xp: this.xp, level: this.currentLevel });
  }

  private onCollectXP(_player: PlayerSprite, gem: Phaser.Physics.Arcade.Sprite): void {
    if (!gem.active) return;

    gem.setActive(false);
    gem.setVisible(false);
    gem.body!.stop();

    // 只有未满级时才增加经验值
    if (this.currentLevel < this.maxLevel) {
      const xpGain = gem.getData('value') || 1;
      this.xp += xpGain;

      while (this.xp >= this.xpToNextLevel && this.currentLevel < this.maxLevel) {
        this.xp -= this.xpToNextLevel;
        this.currentLevel++;
      }
    }

    gameBridge.emit('xp:changed', { xp: this.xp, level: this.currentLevel });
  }

  private spawnXPGem(x: number, y: number, value: number): void {
    const gem = this.xpGems.create(x, y, 'xp-gem') as Phaser.Physics.Arcade.Sprite;
    if (!gem) return;

    gem.setActive(true);
    gem.setVisible(true);
    gem.setData('value', value);
    gem.setScale(0.8 + value * 0.1);

    gem.setVelocity(Phaser.Math.Between(-50, 50), Phaser.Math.Between(-80, -40));
    gem.setDrag(100);
    gem.setGravityY(50);
  }

  private checkXPAttraction(): void {
    const range = 100;

    this.xpGems.getChildren().forEach((child) => {
      const gem = child as Phaser.Physics.Arcade.Sprite;
      if (!gem.active) return;

      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, gem.x, gem.y);

      if (distance < range) {
        this.physics.moveToObject(gem, this.player, 200);
      }
    });
  }

  private formatNumber(num: number): string {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'k';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
  }

  private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean): void {
    const text = this.add.text(x, y, this.formatNumber(damage), {
      fontSize: isCrit ? '18px' : '14px',
      fontFamily: 'Arial',
      color: isCrit ? '#fbbf24' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    text.setDepth(100);

    this.tweens.add({
      targets: text,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy(),
    });
  }

  private gameOver(): void {
    gameBridge.emit('player:died', {
      waveNumber: this.waveNumber,
      killCount: this.killCount,
    });

    this.scene.pause();
  }
}
