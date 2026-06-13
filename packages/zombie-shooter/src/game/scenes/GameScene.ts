import Phaser from 'phaser';
import { gameBridge } from '../bridge';
import { GAME_WIDTH, GAME_HEIGHT } from '../config';
import { BALANCE } from '../data/balance';
import { ENEMY_TYPES } from '../data/enemies';
import { getRandomUpgradeOptions, type UpgradeId } from '../data/upgrades';
import { getWaveConfig, getTotalEnemiesFor20Waves } from '../data/waves';
import { ELEMENT_BASE_DAMAGE } from '../data/skills';
import { buffManager, type BuffType } from '../systems/BuffSystem';
import { getAndClearPendingGameData } from '../PhaserGame';

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
  private currentStage = 1;

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

  // 装备词条效果
  private affixEffects: Record<string, number> = {};
  private wallInvincibleTimer = 0;
  private wallInvincibleUsed = false;
  private wallShieldRegenTimer = 0;
  private elementDamageByType: Record<string, number> = {};
  private playerDodgeRate = 0;
  private hitRateBonus = 0;

  // 伤害统计
  private damageStats: Record<string, number> = {
    gun: 0,
    wind: 0,
    thunder: 0,
    water: 0,
    fire: 0,
    earth: 0,
    burn: 0,
    explosion: 0,
    split: 0,
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  init(): void {
    this.setupBridgeListeners();
  }

  create(): void {
    this.resetGameState();
    this.createBackground();
    this.createWall();
    this.createPlayer();
    this.createGroups();
    this.setupCollisions();

    // 设置世界边界
    this.physics.world.setBoundsCollision(false, false, false, false);
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 读取启动数据并应用装备效果
    this.applyPendingData();

    // 通知 React 场景已准备好
    gameBridge.emit('scene:ready', {});
  }

  private applyPendingData(): void {
    const data = getAndClearPendingGameData();
    if (!data) return;

    this.currentStage = data.startWave;

    // 应用装备属性加成
    if (data.bonusHp) {
      this.player.hp += data.bonusHp;
      this.player.maxHp += data.bonusHp;
    }
    if (data.bonusAttack || data.playerAttackBonus) {
      const atkBonus = (data.bonusAttack || 0) + (data.playerAttackBonus || 0);
      this.player.damage += atkBonus;
      this.player.baseDamage += atkBonus;
    }

    // 应用暴击率加成
    if (data.playerCritChanceBonus) {
      this.player.critChance += data.playerCritChanceBonus;
    }

    // 应用暴击伤害加成
    if (data.playerCritDamageBonus) {
      this.player.critMultiplier += data.playerCritDamageBonus;
    }

    // 应用闪避率
    this.playerDodgeRate = data.playerDodgeRate || 0;

    // 应用命中率
    this.hitRateBonus = data.hitRateBonus || 0;

    // 保存词条效果
    this.affixEffects = data.affixEffects || {};
    this.elementDamageByType = data.elementDamageByType || {};

    // 应用预计算的城墙属性
    this.wall.maxHp = data.wallMaxHp;
    this.wall.hp = data.wallMaxHp;
    this.wall.maxShield = data.wallShield;
    this.wall.shield = data.wallShield;

    // 重置无敌和护盾回复计时器
    this.wallInvincibleTimer = 0;
    this.wallInvincibleUsed = false;
    this.wallShieldRegenTimer = 0;

    // 发送更新后的城墙和玩家属性
    gameBridge.emit('wall:hp-changed', { hp: this.wall.hp, maxHp: this.wall.maxHp });
    gameBridge.emit('wall:shield-changed', { shield: this.wall.shield, maxShield: this.wall.maxShield });
    gameBridge.emit('player:hp-changed', { hp: this.player.hp, maxHp: this.player.maxHp });

    // 延迟再次发送，确保 React 监听已注册
    this.time.delayedCall(100, () => {
      gameBridge.emit('wall:hp-changed', { hp: this.wall.hp, maxHp: this.wall.maxHp });
      gameBridge.emit('wall:shield-changed', { shield: this.wall.shield, maxShield: this.wall.maxShield });
    });

    // 发送生效词条信息
    this.emitAffixesInfo();

    // 开始第一波
    this.startNextWave();
  }

  private emitAffixesInfo(): void {
    const affixNames: Record<string, { name: string; desc: string; source: string }> = {
      'hit_rate_5': { name: '命中率+5%', desc: '命中率增加5%（转化为暴击率）', source: '宝石' },
      'hit_rate_10': { name: '命中率+10%', desc: '命中率增加10%', source: '宝石' },
      'hit_rate_15': { name: '命中率+15%', desc: '命中率增加15%', source: '宝石' },
      'hit_rate_20': { name: '命中率+20%', desc: '命中率增加20%', source: '宝石' },
      'hit_rate_25': { name: '命中率+25%', desc: '命中率增加25%', source: '宝石' },
      'hit_rate_30': { name: '命中率+30%', desc: '命中率增加30%', source: '宝石' },
      'attack_20': { name: '攻击+20', desc: '攻击力增加20', source: '宝石' },
      'attack_40': { name: '攻击+40', desc: '攻击力增加40', source: '宝石' },
      'attack_60': { name: '攻击+60', desc: '攻击力增加60', source: '宝石' },
      'attack_80': { name: '攻击+80', desc: '攻击力增加80', source: '宝石' },
      'attack_100': { name: '攻击+100', desc: '攻击力增加100', source: '宝石' },
      'attack_120': { name: '攻击+120', desc: '攻击力增加120', source: '宝石' },
      'attack_random': { name: '随机增幅', desc: '攻击随机增幅-20%~+30%', source: '宝石' },
      'attack_random_40': { name: '随机增幅', desc: '攻击随机增幅-20%~+40%', source: '宝石' },
      'attack_random_50': { name: '随机增幅', desc: '攻击随机增幅-20%~+50%', source: '宝石' },
      'attack_random_60': { name: '随机增幅', desc: '攻击随机增幅-20%~+60%', source: '宝石' },
      'attack_random_70': { name: '随机增幅', desc: '攻击随机增幅-20%~+70%', source: '宝石' },
      'crit_rate_5': { name: '暴击率+5%', desc: '暴击率增加5%', source: '宝石' },
      'crit_rate_10': { name: '暴击率+10%', desc: '暴击率增加10%', source: '宝石' },
      'crit_rate_15': { name: '暴击率+15%', desc: '暴击率增加15%', source: '宝石' },
      'crit_rate_20': { name: '暴击率+20%', desc: '暴击率增加20%', source: '宝石' },
      'crit_rate_30': { name: '暴击率+30%', desc: '暴击率增加30%', source: '宝石' },
      'crit_rate_40': { name: '暴击率+40%', desc: '暴击率增加40%', source: '宝石' },
      'crit_damage_10': { name: '暴伤+10%', desc: '暴击伤害增加10%', source: '宝石' },
      'crit_damage_20': { name: '暴伤+20%', desc: '暴击伤害增加20%', source: '宝石' },
      'crit_damage_30': { name: '暴伤+30%', desc: '暴击伤害增加30%', source: '宝石' },
      'crit_damage_40': { name: '暴伤+40%', desc: '暴击伤害增加40%', source: '宝石' },
      'crit_damage_50': { name: '暴伤+50%', desc: '暴击伤害增加50%', source: '宝石' },
      'crit_damage_60': { name: '暴伤+60%', desc: '暴击伤害增加60%', source: '宝石' },
      'dodge_5': { name: '闪避+5%', desc: '闪避率增加5%', source: '宝石' },
      'dodge_10': { name: '闪避+10%', desc: '闪避率增加10%', source: '宝石' },
      'dodge_15': { name: '闪避+15%', desc: '闪避率增加15%', source: '宝石' },
      'dodge_20': { name: '闪避+20%', desc: '闪避率增加20%', source: '宝石' },
      'dodge_30': { name: '闪避+30%', desc: '闪避率增加30%', source: '宝石' },
      'dodge_40': { name: '闪避+40%', desc: '闪避率增加40%', source: '宝石' },
      'slow_1': { name: '减速1%', desc: '攻击1%概率减速50%', source: '宝石' },
      'slow_2': { name: '减速2%', desc: '攻击2%概率减速50%', source: '宝石' },
      'slow_3': { name: '减速3%', desc: '攻击3%概率减速50%', source: '宝石' },
      'slow_4': { name: '减速4%', desc: '攻击4%概率减速50%', source: '宝石' },
      'slow_5': { name: '减速5%', desc: '攻击5%概率减速60%', source: '宝石' },
      'slow_6': { name: '减速6%', desc: '攻击6%概率减速70%', source: '宝石' },
      'stun_1': { name: '眩晕1%', desc: '暴击1%概率眩晕', source: '宝石' },
      'stun_2': { name: '眩晕2%', desc: '暴击2%概率眩晕', source: '宝石' },
      'stun_3': { name: '眩晕3%', desc: '暴击3%概率眩晕', source: '宝石' },
      'stun_4': { name: '眩晕4%', desc: '暴击4%概率眩晕', source: '宝石' },
      'stun_5': { name: '眩晕5%', desc: '暴击5%概率眩晕', source: '宝石' },
      'stun_6': { name: '眩晕6%', desc: '暴击6%概率眩晕', source: '宝石' },
      'bleed_1': { name: '流血1%', desc: '攻击1%概率流血', source: '宝石' },
      'bleed_2': { name: '流血2%', desc: '攻击2%概率流血', source: '宝石' },
      'bleed_3': { name: '流血3%', desc: '攻击3%概率流血', source: '宝石' },
      'bleed_4': { name: '流血4%', desc: '攻击4%概率流血', source: '宝石' },
      'bleed_5': { name: '流血5%', desc: '攻击5%概率流血', source: '宝石' },
      'bleed_6': { name: '流血6%', desc: '攻击6%概率流血', source: '宝石' },
      'teleport_1': { name: '传送1%', desc: '攻击1%概率传送敌人回起点', source: '宝石' },
      'teleport_2': { name: '传送2%', desc: '攻击2%概率传送敌人', source: '宝石' },
      'teleport_3': { name: '传送3%', desc: '攻击3%概率传送敌人', source: '宝石' },
      'teleport_4': { name: '传送4%', desc: '攻击4%概率传送敌人', source: '宝石' },
      'teleport_5': { name: '传送5%', desc: '攻击5%概率传送敌人', source: '宝石' },
      'teleport_6': { name: '传送6%', desc: '攻击6%概率传送敌人', source: '宝石' },
      'instant_kill_1': { name: '秒杀1%', desc: '攻击1%概率秒杀', source: '宝石' },
      'instant_kill_2': { name: '秒杀2%', desc: '攻击2%概率秒杀', source: '宝石' },
      'no_ammo_5': { name: '省弹5%', desc: '5%概率不消耗弹药', source: '宝石' },
      'no_ammo_10': { name: '省弹10%', desc: '10%概率不消耗弹药', source: '宝石' },
      'no_ammo_15': { name: '省弹15%', desc: '15%概率不消耗弹药', source: '宝石' },
      'no_ammo_20': { name: '省弹20%', desc: '20%概率不消耗弹药', source: '宝石' },
      'no_ammo_25': { name: '省弹25%', desc: '25%概率不消耗弹药', source: '宝石' },
      'no_ammo_30': { name: '省弹30%', desc: '30%概率不消耗弹药', source: '宝石' },
      'invincible_1s': { name: '低血无敌1s', desc: '血量<30%时无敌1秒（一局一次）', source: '宝石' },
      'invincible_1s_40': { name: '低血无敌1s', desc: '血量<40%时无敌1秒', source: '宝石' },
      'invincible_2s': { name: '低血无敌2s', desc: '血量<40%时无敌2秒', source: '宝石' },
      'invincible_3s': { name: '低血无敌3s', desc: '血量<40%时无敌3秒', source: '宝石' },
      'invincible_4s': { name: '低血无敌4s', desc: '血量<40%时无敌4秒', source: '宝石' },
      'invincible_5s': { name: '低血无敌5s', desc: '血量<40%时无敌5秒', source: '宝石' },
      'wall_hp_200': { name: '城墙+200', desc: '城墙血量+200', source: '宝石' },
      'wall_hp_400': { name: '城墙+400', desc: '城墙血量+400', source: '宝石' },
      'wall_hp_600': { name: '城墙+600', desc: '城墙血量+600', source: '宝石' },
      'wall_hp_800': { name: '城墙+800', desc: '城墙血量+800', source: '宝石' },
      'wall_hp_1000': { name: '城墙+1000', desc: '城墙血量+1000', source: '宝石' },
      'wall_hp_1200': { name: '城墙+1200', desc: '城墙血量+1200', source: '宝石' },
      'wall_shield_100': { name: '护盾+100', desc: '城墙护盾+100', source: '宝石' },
      'wall_shield_200': { name: '护盾+200', desc: '城墙护盾+200', source: '宝石' },
      'wall_shield_300': { name: '护盾+300', desc: '城墙护盾+300', source: '宝石' },
      'wall_shield_400': { name: '护盾+400', desc: '城墙护盾+400', source: '宝石' },
      'wall_shield_500': { name: '护盾+500', desc: '城墙护盾+500', source: '宝石' },
      'wall_shield_600': { name: '护盾+600', desc: '城墙护盾+600', source: '宝石' },
      'wall_counter_10': { name: '反击10%', desc: '受击10%概率反击2倍', source: '宝石' },
      'wall_counter_20': { name: '反击20%', desc: '受击20%概率反击2倍', source: '宝石' },
      'wall_counter_30': { name: '反击30%', desc: '受击30%概率反击2倍', source: '宝石' },
      'wall_counter_40': { name: '反击40%', desc: '受击40%概率反击2倍', source: '宝石' },
      'wall_counter_50': { name: '反击50%', desc: '受击50%概率反击3倍', source: '宝石' },
      'wall_counter_60': { name: '反击60%', desc: '受击60%概率反击4倍', source: '宝石' },
      'wall_regen_shield': { name: '护盾回复', desc: '每30s回复10%最大护盾', source: '宝石' },
      'lifesteal_wall': { name: '吸血城墙', desc: '攻击2%概率吸血40%恢复城墙', source: '宝石' },
      'burn_extra_damage': { name: '灼烧增伤', desc: '对燃烧敌人额外0.01%最大生命伤害', source: '宝石' },
      'freeze_extra_damage': { name: '冰冻增伤', desc: '对冰冻敌人额外0.01%最大生命伤害', source: '宝石' },
      'paralyze_extra_damage': { name: '麻痹增伤', desc: '对麻痹敌人额外0.01%最大生命伤害', source: '宝石' },
    };

    const affixes = Object.keys(this.affixEffects)
      .filter(id => this.affixEffects[id] > 0)
      .map(id => {
        const info = affixNames[id];
        return info
          ? { name: info.name, description: info.desc, source: info.source }
          : { name: id, description: `${id}: ${this.affixEffects[id]}`, source: '未知' };
      });

    gameBridge.emit('affixes:updated', { affixes });
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

    // 重置词条相关计时器
    this.wallInvincibleTimer = 0;
    this.wallInvincibleUsed = false;
    this.wallShieldRegenTimer = 0;

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
      explosion: 0,
      split: 0,
    };
  }

  private createBackground(): void {
    // 使用关卡背景图片，等比拉伸填满屏幕（10张图循环使用）
    const stageNum = ((this.currentStage - 1) % 10) + 1;
    const stageKey = `stage-${stageNum}`;
    if (this.textures.exists(stageKey)) {
      const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, stageKey);
      const bgTexture = this.textures.get(stageKey);
      const bgWidth = bgTexture.getSourceImage().width;
      const bgHeight = bgTexture.getSourceImage().height;

      const scaleX = GAME_WIDTH / bgWidth;
      const scaleY = GAME_HEIGHT / bgHeight;
      const scale = Math.max(scaleX, scaleY);

      bg.setScale(scale);
      bg.setDepth(0);
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

    // 在城墙下方渲染网格状城墙填充（层级比城墙高）
    const wallFill = this.add.graphics();
    wallFill.setDepth(6);

    // 基础砖块颜色（与城堡素材一致）
    const brickColor = 0x735435; // 主砖色 #735435
    const brickShadow = 0x5a4028; // 砖块阴影（更深）
    const mortarColor = 0x4a3a28; // 灰缝颜色

    // 绘制网格状城墙
    const fillTop = GAME_HEIGHT - 38; // 下移2px
    const fillHeight = 38;

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
    this.wall.y = GAME_HEIGHT - 90; // 下移10px

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
      try {
        if (this.scene && this.scene.isPaused()) {
          this.scene.resume();
        }
      } catch (e) {}
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

    // 装备附加攻击 = 总攻击 - 基础攻击 - 升级增幅
    const baseDamage = BALANCE.player.baseDamage;
    const upgradeDamage = Math.round(baseDamage * damageBonus / 100);
    const equipDamage = Math.max(0, this.player.damage - baseDamage - upgradeDamage);

    // 随机增幅范围
    let randomBoostMin = 0;
    let randomBoostMax = 0;
    if (this.affixEffects['attack_random']) { randomBoostMin = -20; randomBoostMax = 30; }
    else if (this.affixEffects['attack_random_40']) { randomBoostMin = -20; randomBoostMax = 40; }
    else if (this.affixEffects['attack_random_50']) { randomBoostMin = -20; randomBoostMax = 50; }
    else if (this.affixEffects['attack_random_60']) { randomBoostMin = -20; randomBoostMax = 60; }
    else if (this.affixEffects['attack_random_70']) { randomBoostMin = -20; randomBoostMax = 70; }

    gameBridge.emit('gun:stats', {
      damage: this.player.damage,
      baseDamage,
      equipDamage,
      damageBonus,
      randomBoostMin,
      randomBoostMax,
      burstCount: 1 + burstLevel,
      rapidCount: 1 + rapidLevel,
      splitCount: splitLevel,
      splitDamage,
      critChance: this.player.critChance,
      critMultiplier: this.player.critMultiplier,
      hasExplosive: (this.upgradeLevels['gun_explosive'] || 0) > 0,
      explosiveDamage: Math.round(this.player.damage * 0.3),
      hitRate: this.hitRateBonus || 0,
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
      explosion: '爆炸',
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
    const skillInfo = this.activeSkillElements.map(element => {
      const skillId = `${element}_basic`;
      const cooldown = this.skillCooldowns[element] || 3000;
      const remaining = Math.max(0, this.skillTimers[skillId] || 0);
      const progress = cooldown > 0 ? (remaining / cooldown) * 100 : 0;
      const level = this.skillLevels[element] || 1;
      const skillNames: Record<string, string[]> = {
        wind: ['风咒', '旋风斩', '风卷残云'],
        thunder: ['雷咒', '惊雷术', '天雷空破'],
        water: ['冰咒', '寒冰破', '水漫金山'],
        fire: ['炎咒', '爆炎弹', '三味真火'],
        earth: ['土咒', '飞岩术', '泰山压顶'],
      };
      const skillEmojis: Record<string, string> = {
        wind: '🌪️',
        thunder: '⚡',
        water: '💧',
        fire: '🔥',
        earth: '🪨',
      };
      const name = skillNames[element]?.[level - 1] || element;
      const icon = skillEmojis[element] || '✨';
      const elementDamage = this.getElementDamage(element);
      const skillBaseDamage = ELEMENT_BASE_DAMAGE[element] || 300;
      // 元素增幅倍率
      const elementUpgradeId = `element_${element}` as UpgradeId;
      const elementUpgradeLevel = this.upgradeLevels[elementUpgradeId] || 0;
      const elementMultiplier = 1 + (elementUpgradeLevel * 0.6);
      // 最终伤害 = (基础伤害 + 元素加成) * 元素增幅
      const totalDamage = Math.round((skillBaseDamage + (elementDamage || 0)) * elementMultiplier);

      // 技能效果描述
      const effects: string[] = [];
      // 基础效果
      if (element === 'wind') effects.push('持续5秒旋风');
      if (element === 'thunder') effects.push('雷罚单体敌人');
      if (element === 'water') effects.push('冰冻单体敌人');
      if (element === 'fire') effects.push('点燃单体敌人');
      if (element === 'earth') effects.push('击退单体敌人');
      // 进阶1效果
      if (level >= 2) {
        if (element === 'wind') effects.push('命中分裂2个风刃');
        if (element === 'thunder') effects.push('命中分裂2道雷罚');
        if (element === 'water') effects.push('冰冻结束冰暴伤害');
        if (element === 'fire') effects.push('命中击退1单位');
        if (element === 'earth') effects.push('命中击退+眩晕');
      }
      // 进阶2效果
      if (level >= 3) {
        if (element === 'wind') effects.push('每5次命中分裂新旋风');
        if (element === 'thunder') effects.push('连续3记雷罚');
        if (element === 'water') effects.push('击退3单位');
        if (element === 'fire') effects.push('附加3秒燃烧');
        if (element === 'earth') effects.push('眩晕增加到3秒');
      }

      return {
        name,
        element,
        level,
        icon,
        cooldown,
        remaining,
        progress,
        elementDamage,
        baseDamage: skillBaseDamage,
        totalDamage,
        elementUpgradeLevel,
        effects,
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
    const verticalOffset = 64; // 连射子弹垂直间距

    // 齐射角度：1级15度，2级25度
    const burstAngles = [0, 15, 25];
    const totalSpreadAngle = burstLevel > 0 ? burstAngles[burstLevel] : 0;

    // 计算基础角度（从人物到敌人）
    const baseAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetEnemy.x, targetEnemy.y);

    // 齐射+连射：每条线发射rapidCount颗子弹，沿同一角度飞行
    for (let i = 0; i < burstCount; i++) {
      // 计算这条线的角度偏移
      let angleOffset = 0;
      if (burstCount > 1 && totalSpreadAngle > 0) {
        angleOffset = (i - (burstCount - 1) / 2) * (totalSpreadAngle / (burstCount - 1));
      }
      const angle = baseAngle + Phaser.Math.DegToRad(angleOffset);

      // 沿这条线发射rapidCount颗子弹
      for (let r = 0; r < rapidCount; r++) {
        this.time.delayedCall(r * 80, () => { // 每颗间隔80ms
          if (!this.player.active || this.player.isReloading) return;

          // 子弹从人物顶部射出，连射偏移垂直位置
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

          if (!bullet) return;

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
        });
      }
    }

    // 扣除弹药（no_ammo词条有概率不消耗）
    const noAmmoChance = (this.affixEffects['no_ammo_5'] || 0) + (this.affixEffects['no_ammo_10'] || 0) +
      (this.affixEffects['no_ammo_15'] || 0) + (this.affixEffects['no_ammo_20'] || 0) +
      (this.affixEffects['no_ammo_25'] || 0) + (this.affixEffects['no_ammo_30'] || 0);
    const skipAmmo = noAmmoChance > 0 && Math.random() * 100 < noAmmoChance;
    if (!skipAmmo) {
      this.player.ammo -= 1;
      gameBridge.emit('ammo:changed', { ammo: this.player.ammo, maxAmmo: this.player.maxAmmo, isReloading: false });
    }

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

            // === 城墙无敌词条 ===
            if (this.wallInvincibleTimer > 0) {
              this.showDamageNumber(this.wall.x, this.wall.y - 30, 0, false, '#3b82f6');
              return;
            }

            // === 闪避词条 ===
            if (this.playerDodgeRate > 0 && Math.random() < this.playerDodgeRate) {
              this.showDamageNumber(this.wall.x, this.wall.y - 30, 0, false, '#22c55e');
              return;
            }

            // 先扣护盾
            if (this.wall.shield > 0) {
              const shieldDamage = Math.min(this.wall.shield, enemy.damage);
              this.wall.shield -= shieldDamage;
              const remainDamage = enemy.damage - shieldDamage;
              if (remainDamage > 0) {
                this.wall.hp = Math.max(0, this.wall.hp - remainDamage);
              }
              gameBridge.emit('wall:shield-changed', { shield: this.wall.shield, maxShield: this.wall.maxShield });
            } else {
              this.wall.hp = Math.max(0, this.wall.hp - enemy.damage);
            }

            // 检查无敌词条触发（血量低于阈值时，一局只能触发一次）
            const hpPercent = (this.wall.hp / this.wall.maxHp) * 100;
            if (!this.wallInvincibleUsed && this.wallInvincibleTimer <= 0) {
              const invincibleThresholds = [
                { id: 'invincible_1s', hpPercent: 30, duration: 1000 },
                { id: 'invincible_1s_40', hpPercent: 40, duration: 1000 },
                { id: 'invincible_2s', hpPercent: 40, duration: 2000 },
                { id: 'invincible_3s', hpPercent: 40, duration: 3000 },
                { id: 'invincible_4s', hpPercent: 40, duration: 4000 },
                { id: 'invincible_5s', hpPercent: 40, duration: 5000 },
              ];
              for (const threshold of invincibleThresholds) {
                if (this.affixEffects[threshold.id] && hpPercent < threshold.hpPercent) {
                  this.wallInvincibleTimer = threshold.duration;
                  this.wallInvincibleUsed = true;
                  this.showDamageNumber(this.wall.x, this.wall.y - 50, 0, false, '#3b82f6');
                  break;
                }
              }
            }

            // === 城墙反击词条 ===
            const counterChance = (this.affixEffects['wall_counter_10'] || 0) + (this.affixEffects['wall_counter_20'] || 0) +
              (this.affixEffects['wall_counter_30'] || 0) + (this.affixEffects['wall_counter_40'] || 0) +
              (this.affixEffects['wall_counter_50'] || 0) + (this.affixEffects['wall_counter_60'] || 0);
            if (counterChance > 0 && Math.random() * 100 < counterChance) {
              // 反击倍率：legendary=3倍, mythic=4倍, 其他=2倍
              const counterMultiplier = this.affixEffects['wall_counter_60'] ? 4 : this.affixEffects['wall_counter_50'] ? 3 : 2;
              const counterDamage = Math.round(this.player.damage * counterMultiplier);
              enemy.hp -= counterDamage;
              this.showDamageNumber(enemy.x, enemy.y - 20, counterDamage, false, '#f59e0b');
              if (enemy.hp <= 0) {
                this.killEnemy(enemy);
                return;
              }
            }

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

    // 销毁元素图标
    const elementIcon = enemy.getData('elementIcon') as Phaser.GameObjects.Text;
    if (elementIcon) elementIcon.destroy();

    // 清除所有数据
    enemy.setData('hpBar', null);
    enemy.setData('nameText', null);
    enemy.setData('hpText', null);
    enemy.setData('buffIcon', null);
    enemy.setData('elementIcon', null);
    enemy.setData('element', null);
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
    // 更新城墙无敌计时器
    if (this.wallInvincibleTimer > 0) {
      this.wallInvincibleTimer -= delta;
    }

    // 更新城墙护盾回复
    if (this.affixEffects['wall_regen_shield']) {
      this.wallShieldRegenTimer += delta;
      if (this.wallShieldRegenTimer >= 30000) { // 每30秒
        this.wallShieldRegenTimer = 0;
        const regenAmount = Math.round(this.wall.maxShield * (this.affixEffects['wall_regen_shield'] / 100));
        this.wall.shield = Math.min(this.wall.shield + regenAmount, this.wall.maxShield);
        gameBridge.emit('wall:shield-changed', { shield: this.wall.shield, maxShield: this.wall.maxShield });
      }
    }

    this.waveTimer += delta;
    if (this.waveTimer >= this.waveInterval && this.waveNumber < 20) {
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

    // 检查第20波是否通关（所有波次完成且没有活跃敌人）
    if (this.waveNumber >= 20 && this.spawnTimers.length === 0) {
      const activeEnemies = this.enemies.getChildren().filter(e => e.active).length;
      if (activeEnemies === 0) {
        this.gameWin();
      }
    }
  }

  private gameWin(): void {
    // 通关成功，先发送最终城墙血量
    gameBridge.emit('wall:hp-changed', { hp: this.wall.hp, maxHp: this.wall.maxHp });
    gameBridge.emit('player:died', {
      waveNumber: this.waveNumber,
      killCount: this.killCount,
      totalEnemies: this.totalEnemies,
      cleared: true,
      wallHp: this.wall.hp,
      wallMaxHp: this.wall.maxHp,
    });
    this.scene.pause();
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

    // 在敌人上方创建技能效果，限制在屏幕范围内
    const iconSize = 80;
    const clampedX = Math.max(iconSize / 2, Math.min(GAME_WIDTH - iconSize / 2, target.x));
    const clampedY = Math.max(iconSize / 2, Math.min(GAME_HEIGHT - iconSize / 2, target.y - 50));
    const skillEffect = this.add.text(clampedX, clampedY, emoji, {
      fontSize: `${iconSize}px`,
      padding: { x: 10, y: 10 },
    });
    skillEffect.setOrigin(0.5);
    skillEffect.setDepth(20);

    // 计算技能伤害（元素初始伤害 + 元素伤害加成）* 元素增幅
    const elementDamageBonus = this.getElementDamage(element);
    const skillBaseDamage = ELEMENT_BASE_DAMAGE[element] || 300;
    const elementUpgradeId = `element_${element}` as UpgradeId;
    const elementUpgradeLevel = this.upgradeLevels[elementUpgradeId] || 0;
    const elementMultiplier = 1 + (elementUpgradeLevel * 0.6);
    const totalDamage = Math.round((skillBaseDamage + (elementDamageBonus || 0)) * elementMultiplier);

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

        // === 敌人元素免疫检查 ===
        const enemyElement = target.getData('element') as string | null;
        if (enemyElement) {
          // 克制关系：水克火，火克雷，雷克风，风克土，土克水
          const weakness: Record<string, string> = { water: 'fire', fire: 'thunder', thunder: 'wind', wind: 'earth', earth: 'water' };
          if (weakness[element] !== enemyElement) {
            // 不克制，免疫
            this.showDamageNumber(target.x, target.y - 20, 0, false, '#9ca3af', '免疫');
            skillEffect.destroy();
            return;
          }
        }

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
            buffManager.addBuff(enemyId, 'burn', skillLevel >= 3 ? 3000 : 1000);
            // 火进阶1: 击退
            if (skillLevel >= 2) {
              this.knockbackEnemy(target, 5);
            }
            break;
          case 'water':
            buffManager.addBuff(enemyId, 'freeze');
            // 水进阶1: 冰冻结束冰暴伤害
            if (skillLevel >= 2) {
              this.time.delayedCall(1000, () => {
                this.createFreezeExplosion(target.x, target.y, totalDamage * 0.5);
              });
            }
            // 水进阶2: 击退
            if (skillLevel >= 3) {
              this.knockbackEnemy(target, 15);
            }
            break;
          case 'thunder':
            buffManager.addBuff(enemyId, 'paralyze');
            // 雷进阶1: 命中后分裂2道雷罚
            if (skillLevel >= 2) {
              this.createChainThunder(target, totalDamage * 0.5, 2);
            }
            // 雷进阶2: 命中后连续3记雷罚
            if (skillLevel >= 3) {
              this.createChainThunder(target, totalDamage * 0.3, 3);
            }
            break;
          case 'earth':
            buffManager.addBuff(enemyId, 'stun');
            // 土系击退: 初始1单位(50px)，进阶2增加到3单位(150px)
            const knockbackDist = skillLevel >= 3 ? 15 : 5;
            this.knockbackEnemy(target, knockbackDist);
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
    const upgradeDamage = (this.player.baseDamage || 0) * (elementLevel * 0.6);
    const equipDamage = this.elementDamageByType[element] || 0;
    return upgradeDamage + equipDamage;
  }

  // 击退敌人
  private knockbackEnemy(enemy: EnemySprite, distance: number): void {
    if (!enemy.active || !enemy.body) return;
    const targetY = Math.max(0, enemy.y - distance);
    this.tweens.add({
      targets: enemy,
      y: targetY,
      duration: 200,
      ease: 'Power2',
    });
  }

  // 雷系连锁
  private createChainThunder(source: EnemySprite, damage: number, count: number): void {
    const enemies = this.enemies.getChildren().filter(e => {
      const enemy = e as EnemySprite;
      return enemy.active && enemy !== source;
    }) as EnemySprite[];

    const sorted = enemies.sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(source.x, source.y, a.x, a.y);
      const distB = Phaser.Math.Distance.Between(source.x, source.y, b.x, b.y);
      return distA - distB;
    });

    const targets = sorted.slice(0, count);
    targets.forEach((target, i) => {
      this.time.delayedCall(i * 200, () => {
        if (!target.active) return;
        const iconSize = 72;
        const cx = Math.max(iconSize / 2, Math.min(GAME_WIDTH - iconSize / 2, target.x));
        const cy = Math.max(iconSize / 2, Math.min(GAME_HEIGHT - iconSize / 2, target.y - 40));
        const thunder = this.add.text(cx, cy, '⚡', { fontSize: `${iconSize}px`, padding: { x: 8, y: 8 } });
        thunder.setOrigin(0.5).setDepth(20);

        this.tweens.add({
          targets: thunder,
          y: target.y,
          duration: 300,
          onComplete: () => {
            const enemyId = target.getData('uniqueId') as string;
            if (enemyId) {
              target.hp -= damage;
              this.showDamageNumber(target.x, target.y - 20, damage, false);
              this.damageStats.thunder += damage;
              buffManager.addBuff(enemyId, 'paralyze');
              if (target.hp <= 0) this.killEnemy(target);
            }
            thunder.destroy();
          },
        });
      });
    });
  }

  // 冰冻爆炸（水进阶1）
  private createFreezeExplosion(x: number, y: number, damage: number): void {
    const explosion = this.add.text(x, y, '💥', { fontSize: '64px' });
    explosion.setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: explosion,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 400,
      onComplete: () => explosion.destroy(),
    });

    const range = 80;
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist <= range) {
        enemy.hp -= damage;
        this.showDamageNumber(enemy.x, enemy.y - 20, damage, false);
        this.damageStats.water += damage;
        if (enemy.hp <= 0) this.killEnemy(enemy);
      }
    });
  }

  // 枪械爆炸伤害
  private createExplosion(x: number, y: number, damage: number): void {
    const explosion = this.add.text(x, y, '💥', { fontSize: '48px' });
    explosion.setOrigin(0.5).setDepth(20);

    this.tweens.add({
      targets: explosion,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => explosion.destroy(),
    });

    const range = 50;
    let explosionDamage = 0;
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as EnemySprite;
      if (!enemy.active) return;
      const dist = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
      if (dist <= range && dist > 0) {
        const dmg = Math.round(damage * 0.5);
        enemy.hp -= dmg;
        explosionDamage += dmg;
        this.showDamageNumber(enemy.x, enemy.y - 20, dmg, false, '#f97316');
        if (enemy.hp <= 0) this.killEnemy(enemy);
      }
    });
    this.damageStats.explosion += explosionDamage;
  }

  private createWindSkill(skillEffect: Phaser.GameObjects.Text, target: EnemySprite, baseDamage: number): void {
    const skillLevel = this.skillLevels['wind'] || 1;
    const duration = 5000;
    const damageInterval = 500;
    const startTime = this.time.now;
    let lastDamageTime = 0;
    let hitCount = 0;
    let splitTornadoCount = 0;
    const maxSplitTornados = 3;

    this.tweens.add({
      targets: skillEffect,
      y: target.y,
      duration: 500,
      onComplete: () => {
        const windTimer = this.time.addEvent({
          delay: damageInterval,
          callback: () => {
            const currentTime = this.time.now;

            if (currentTime - startTime >= duration) {
              skillEffect.destroy();
              windTimer.destroy();
              return;
            }

            skillEffect.x += Phaser.Math.Between(-20, 20);
            skillEffect.y += Phaser.Math.Between(-10, 10);

            this.enemies.getChildren().forEach((child) => {
              const enemy = child as EnemySprite;
              if (!enemy.active) return;

              const distance = Phaser.Math.Distance.Between(
                skillEffect.x, skillEffect.y,
                enemy.x, enemy.y
              );

              if (distance < 60 && currentTime - lastDamageTime >= damageInterval) {
                lastDamageTime = currentTime;
                hitCount++;

                const enemyId = `enemy_${enemy.x}_${enemy.y}`;
                const buffResult = buffManager.update(enemyId, 0, currentTime);
                const actualDamage = Math.round(baseDamage * buffResult.damageMultiplier);
                enemy.hp -= actualDamage;
                this.showDamageNumber(enemy.x, enemy.y - 20, actualDamage, false);
                this.damageStats.wind += actualDamage;
                buffManager.addBuff(enemyId, 'slow');

                // 风进阶1: 命中分裂2个风刃
                if (skillLevel >= 2) {
                  this.createWindBlades(enemy.x, enemy.y, baseDamage * 0.5, 2);
                }

                // 风进阶2: 每5次命中分裂新旋风
                if (skillLevel >= 3 && hitCount % 5 === 0 && splitTornadoCount < maxSplitTornados) {
                  splitTornadoCount++;
                  this.createMiniTornado(enemy.x, enemy.y, baseDamage * 0.5, damageInterval);
                }

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

  // 风刃（分裂弹）
  private createWindBlades(x: number, y: number, damage: number, count: number): void {
    const angles = [-30, 30];
    for (let i = 0; i < count; i++) {
      const angle = angles[i] || 0;
      const rad = Phaser.Math.DegToRad(angle - 90);
      const blade = this.add.text(x, y, '💨', { fontSize: '48px' });
      blade.setOrigin(0.5).setDepth(20);
      const speed = 200;
      const vx = Math.cos(rad) * speed;
      const vy = Math.sin(rad) * speed;

      this.tweens.add({
        targets: blade,
        x: x + vx * 0.8,
        y: y + vy * 0.8,
        duration: 800,
        onUpdate: () => {
          this.enemies.getChildren().forEach((child) => {
            const enemy = child as EnemySprite;
            if (!enemy.active) return;
            const dist = Phaser.Math.Distance.Between(blade.x, blade.y, enemy.x, enemy.y);
            if (dist < 50) {
              const enemyId = `enemy_${enemy.x}_${enemy.y}`;
              enemy.hp -= damage;
              this.showDamageNumber(enemy.x, enemy.y - 20, damage, false);
              this.damageStats.wind += damage;
              if (enemy.hp <= 0) this.killEnemy(enemy);
            }
          });
        },
        onComplete: () => blade.destroy(),
      });
    }
  }

  // 迷你旋风（进阶2分裂）
  private createMiniTornado(x: number, y: number, damage: number, interval: number): void {
    const tornado = this.add.text(x, y, '🌪️', { fontSize: '80px' });
    tornado.setOrigin(0.5).setDepth(20);
    const startTime = this.time.now;
    const duration = 3000;

    const timer = this.time.addEvent({
      delay: interval,
      loop: true,
      callback: () => {
        if (this.time.now - startTime >= duration) {
          tornado.destroy();
          timer.destroy();
          return;
        }
        // 迷你旋风不移动，只在原地检测碰撞

        this.enemies.getChildren().forEach((child) => {
          const enemy = child as EnemySprite;
          if (!enemy.active) return;
          const dist = Phaser.Math.Distance.Between(tornado.x, tornado.y, enemy.x, enemy.y);
          if (dist < 55) {
            const enemyId = `enemy_${enemy.x}_${enemy.y}`;
            enemy.hp -= damage;
            this.showDamageNumber(enemy.x, enemy.y - 20, damage, false);
            this.damageStats.wind += damage;
            buffManager.addBuff(enemyId, 'slow');
            if (enemy.hp <= 0) this.killEnemy(enemy);
          }
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
      enemy.setScale(0.08);
    } else if (enemyTypeKey === 'runner' && this.textures.exists('runner-walk-1')) {
      enemy.setTexture('runner-walk-1');
      enemy.setScale(0.06);
    } else if (enemyTypeKey === 'tank' && this.textures.exists('zombie-walk-1')) {
      enemy.setTexture('zombie-walk-1');
      enemy.setScale(0.1);
    } else if (enemyTypeKey === 'splitter' && this.textures.exists('zombie-walk-1')) {
      enemy.setTexture('zombie-walk-1');
      enemy.setScale(0.08);
    } else if (enemyTypeKey === 'boss' && this.textures.exists('boss')) {
      enemy.setTexture('boss');
      enemy.setScale(0.12);
    } else {
      enemy.setTexture(enemyType.texture);
      enemy.setScale(enemyType.scale);
    }

    // 纵向压缩为0.8
    enemy.scaleY = enemy.scaleY * 0.8;

    enemy.setCollideWorldBounds(true);
    enemy.setDepth(3); // 敌人在城墙层级下面
    enemy.body!.reset(spawnX, spawnY);

    // 设置碰撞体大小（基于缩放后的纹理，横向加宽）
    const textureWidth = enemy.width * enemy.scaleX;
    const textureHeight = enemy.height * enemy.scaleY;
    enemy.body!.setSize(textureWidth * 1.0, textureHeight * 0.8);

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

    // 30关以后，部分敌人随机获得元素属性
    enemy.setData('element', null);
    if (this.currentStage >= 30 && enemyTypeKey !== 'boss') {
      const elementChance = Math.min(0.5, (this.currentStage - 30) * 0.02); // 每关+2%，最高50%
      if (Math.random() < elementChance) {
        const elements = ['fire', 'thunder', 'water', 'wind', 'earth'];
        const randomElement = elements[Math.floor(Math.random() * elements.length)];
        enemy.setData('element', randomElement);
      }
    }

    // 添加血条
    const hpBar = this.add.graphics();
    hpBar.setDepth(15);
    enemy.setData('hpBar', hpBar);
    this.updateEnemyHpBar(enemy);

    // 精英和首领添加名称显示
    if (enemyType.type === 'elite' || enemyType.type === 'boss') {
      const nameText = this.add.text(enemy.x, enemy.y - enemy.height * enemy.scaleY / 2 - 16, enemyType.name, {
        fontSize: enemyType.type === 'boss' ? '16px' : '14px',
        fontFamily: 'Arial',
        fontStyle: 'bold',
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
          fontSize: '14px',
          fontFamily: 'Arial',
          fontStyle: 'bold',
          color: '#ef4444',
          stroke: '#000000',
          strokeThickness: 2,
        });
        hpText.setOrigin(0.5);
        hpText.setDepth(16);
        enemy.setData('hpText', hpText);
      }
    }

    // 有元素属性的敌人显示元素图标
    const enemyElement = enemy.getData('element') as string | null;
    if (enemyElement) {
      const elementIcons: Record<string, string> = { fire: '🔥', thunder: '⚡', water: '💧', wind: '🌪️', earth: '🪨' };
      const elementIcon = this.add.text(enemy.x, enemy.y - enemy.height * enemy.scaleY / 2 - 8, elementIcons[enemyElement] || '✨', {
        fontSize: '12px',
      });
      elementIcon.setOrigin(0.5);
      elementIcon.setDepth(17);
      enemy.setData('elementIcon', elementIcon);
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
    // 用城墙血量百分比来决定是否显示回血卡牌
    const wallHpPercent = (this.wall.hp / this.wall.maxHp) * 100;
    const options = getRandomUpgradeOptions(this.upgradeLevels, wallHpPercent, this.activeSkillElements, 3);

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
        const healAmount = this.wall.maxHp * 0.3;
        this.wall.hp = Math.min(this.wall.hp + healAmount, this.wall.maxHp);
        gameBridge.emit('wall:hp-changed', { hp: this.wall.hp, maxHp: this.wall.maxHp });
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

    // === 疾尸闪避（20关以后，随关卡递增）===
    const enemyType = enemy.getData('enemyType') as string;
    if (enemyType === 'runner' && this.currentStage > 20) {
      const dodgeRate = Math.min(0.3, (this.currentStage - 20) * 0.01); // 每关+1%，最高30%
      if (Math.random() < dodgeRate) {
        this.showDamageNumber(enemy.x, enemy.y - 20, 0, false, '#9ca3af', 'MISS');
        return;
      }
    }

    // === 敌人元素免疫（30关以后，部分敌人有属性）===
    const enemyElement = enemy.getData('element') as string | null;
    if (enemyElement) {
      // 子弹无法造成伤害，只有克制系技能可以
      this.showDamageNumber(enemy.x, enemy.y - 20, 0, false, '#9ca3af', '免疫');
      return;
    }

    // 计算实际伤害（考虑流血增伤）
    let actualDamage = Math.round(bullet.damage * damageMultiplier);

    // === 攻击随机增幅词条 ===
    // common: -20%~+30%, excellent: -20%~+40%, elite: -20%~+50%, perfect: -20%~+60%, legendary/mythic: -20%~+70%
    const randomBonus = this.getAttackRandomBonus();
    if (randomBonus !== 0) {
      actualDamage = Math.round(actualDamage * (1 + randomBonus / 100));
    }

    // === 对燃烧/冰冻/麻痹敌人额外伤害词条 ===
    if (this.affixEffects['burn_extra_damage'] && buffManager.hasBuff(enemyId, 'burn')) {
      const extraDmg = Math.round(enemy.maxHp * (this.affixEffects['burn_extra_damage'] / 100));
      actualDamage += extraDmg;
    }
    if (this.affixEffects['freeze_extra_damage'] && buffManager.hasBuff(enemyId, 'freeze')) {
      const extraDmg = Math.round(enemy.maxHp * (this.affixEffects['freeze_extra_damage'] / 100));
      actualDamage += extraDmg;
    }
    if (this.affixEffects['paralyze_extra_damage'] && buffManager.hasBuff(enemyId, 'paralyze')) {
      const extraDmg = Math.round(enemy.maxHp * (this.affixEffects['paralyze_extra_damage'] / 100));
      actualDamage += extraDmg;
    }

    // === 秒杀词条 ===
    const instantKillChance = (this.affixEffects['instant_kill_1'] || 0) + (this.affixEffects['instant_kill_2'] || 0);
    if (instantKillChance > 0 && Math.random() * 100 < instantKillChance) {
      actualDamage = enemy.hp; // 直接秒杀
      this.showDamageNumber(enemy.x, enemy.y - 20, actualDamage, false, '#ff0000');
    }

    enemy.hp -= actualDamage;
    this.showDamageNumber(enemy.x, enemy.y - 20, actualDamage, bullet.isCrit);

    // 记录枪械伤害
    this.damageStats.gun += actualDamage;

    // === 流血词条 ===
    const bleedChance = this.getAffixTotal('bleed');
    if (bleedChance > 0 && Math.random() * 100 < bleedChance) {
      buffManager.addBuff(enemyId, 'bleed');
    }

    // === 眩晕词条（暴击时触发）===
    const stunChance = this.getAffixTotal('stun');
    if (bullet.isCrit && stunChance > 0 && Math.random() * 100 < stunChance) {
      buffManager.addBuff(enemyId, 'stun');
    }

    // === 减速词条 ===
    const slowChance = this.getAffixTotal('slow');
    if (slowChance > 0 && Math.random() * 100 < slowChance) {
      buffManager.addBuff(enemyId, 'slow');
    }

    // === 传送词条 ===
    const teleportChance = this.getAffixTotal('teleport');
    if (teleportChance > 0 && Math.random() * 100 < teleportChance) {
      // 传送敌人回起点
      enemy.y = -30;
      enemy.body!.reset(enemy.x, enemy.y);
      enemy.setVelocityY(enemy.speed);
    }

    // === 吸血恢复城墙词条 ===
    if (this.affixEffects['lifesteal_wall'] && Math.random() * 100 < 2) {
      const healAmount = Math.round(actualDamage * (this.affixEffects['lifesteal_wall'] / 100));
      this.wall.hp = Math.min(this.wall.hp + healAmount, this.wall.maxHp);
      gameBridge.emit('wall:hp-changed', { hp: this.wall.hp, maxHp: this.wall.maxHp });
      this.showDamageNumber(this.wall.x, this.wall.y - 30, healAmount, false, '#22c55e');
    }

    // === 爆炸子弹（升级卡牌） ===
    const explosiveLevel = this.upgradeLevels['gun_explosive'] || 0;
    if (explosiveLevel > 0) {
      this.createExplosion(enemy.x, enemy.y, actualDamage);
    }

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

  // 获取攻击随机增幅
  private getAttackRandomBonus(): number {
    if (this.affixEffects['attack_random']) return Phaser.Math.Between(-20, 30);
    if (this.affixEffects['attack_random_40']) return Phaser.Math.Between(-20, 40);
    if (this.affixEffects['attack_random_50']) return Phaser.Math.Between(-20, 50);
    if (this.affixEffects['attack_random_60']) return Phaser.Math.Between(-20, 60);
    if (this.affixEffects['attack_random_70']) return Phaser.Math.Between(-20, 70);
    return 0;
  }

  // 获取同类词条的总值（如 bleed_1 + bleed_2 = 3%）
  private getAffixTotal(prefix: string): number {
    let total = 0;
    for (const [key, value] of Object.entries(this.affixEffects)) {
      if (key.startsWith(prefix + '_')) {
        total += value;
      }
    }
    return total;
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

    // 击杀精英立即奖励升级选择
    if (enemy.enemyType === 'tank' || enemy.enemyType === 'armored') {
      this.generateUpgradeOptions();
    }

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

  private showDamageNumber(x: number, y: number, damage: number, isCrit: boolean, color?: string, text?: string): void {
    // 伤害颜色逻辑：1000以下白色，1000-10000黄色，10000以上红色
    let damageColor = color;
    if (!damageColor) {
      if (isCrit) {
        damageColor = '#ff6b6b'; // 暴击用亮红色
      } else if (damage >= 10000) {
        damageColor = '#ef4444'; // 高伤害红色
      } else if (damage >= 1000) {
        damageColor = '#fbbf24'; // 中等伤害黄色
      } else {
        damageColor = '#ffffff'; // 低伤害白色
      }
    }

    const displayText = text || this.formatNumber(damage);
    const txt = this.add.text(x, y, displayText, {
      fontSize: isCrit ? '18px' : '14px',
      fontFamily: 'PixelFont, Arial',
      color: damageColor,
      stroke: '#000000',
      strokeThickness: 2,
    });
    txt.setOrigin(0.5);
    txt.setDepth(100);

    this.tweens.add({
      targets: txt,
      y: y - 40,
      alpha: 0,
      duration: 800,
      onComplete: () => txt.destroy(),
    });
  }

  private gameOver(): void {
    gameBridge.emit('player:died', {
      waveNumber: this.waveNumber,
      killCount: this.killCount,
      totalEnemies: this.totalEnemies,
      cleared: false,
      wallHp: this.wall.hp,
      wallMaxHp: this.wall.maxHp,
    });

    this.scene.pause();
  }
}
