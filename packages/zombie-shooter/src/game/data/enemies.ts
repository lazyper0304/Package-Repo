export type EnemyType = 'normal' | 'elite' | 'boss';

export interface EnemyDefinition {
  name: string;
  texture: string;
  type: EnemyType;
  baseHp: number; // 基础血量（关卡基础血量的倍数）
  speed: number;
  damage: number;
  xpValue: number;
  scale: number;
  attackCooldown: number;
  defense: number; // 防御力
  dodgeRate: number; // 闪避率 0-1
  isBoss?: boolean;
  zigzag?: boolean;
}

// 敌人定义
export const ENEMY_TYPES: Record<string, EnemyDefinition> = {
  // 普通敌人
  walker: {
    name: '行尸',
    texture: 'enemy-walker',
    type: 'normal',
    baseHp: 1, // 1倍基础血量 = 1条血
    speed: 36, // 原60，降低40%
    damage: 10,
    xpValue: 1,
    scale: 1,
    attackCooldown: 3000, // 3秒
    defense: 0,
    dodgeRate: 0,
  },
  runner: {
    name: '疾尸',
    texture: 'enemy-runner',
    type: 'normal',
    baseHp: 0.5,
    speed: 48, // 调整为48
    damage: 5,
    xpValue: 1,
    scale: 0.8,
    attackCooldown: 3000, // 3秒
    defense: 0,
    dodgeRate: 0.1,
    zigzag: true,
  },
  splitter: {
    name: '分裂尸',
    texture: 'enemy-splitter',
    type: 'normal',
    baseHp: 1.5,
    speed: 30, // 原50，降低40%
    damage: 8,
    xpValue: 2,
    scale: 1,
    attackCooldown: 3000, // 3秒
    defense: 0,
    dodgeRate: 0,
  },

  // 精英敌人
  tank: {
    name: '坦克尸',
    texture: 'enemy-tank',
    type: 'elite',
    baseHp: 5,
    speed: 18, // 原30，降低40%
    damage: 20,
    xpValue: 5,
    scale: 1.2,
    attackCooldown: 3000, // 3秒
    defense: 5,
    dodgeRate: 0.05,
  },
  armored: {
    name: '装甲尸',
    texture: 'enemy-armored',
    type: 'elite',
    baseHp: 8,
    speed: 15, // 原25，降低40%
    damage: 15,
    xpValue: 8,
    scale: 1.3,
    attackCooldown: 3000, // 3秒
    defense: 10,
    dodgeRate: 0.1,
  },

  // 首领敌人
  boss: {
    name: '僵尸王',
    texture: 'boss',
    type: 'boss',
    baseHp: 50,
    speed: 12, // 原20，降低40%
    damage: 30,
    xpValue: 20,
    scale: 1.5,
    attackCooldown: 3000, // 3秒
    defense: 10,
    dodgeRate: 0.15,
    isBoss: true,
  },
};

// 获取敌人实际血量
export function getEnemyHp(enemyType: string, stageBaseHp: number): number {
  const enemy = ENEMY_TYPES[enemyType];
  if (!enemy) return 100;
  return Math.floor(enemy.baseHp * stageBaseHp);
}

// 获取敌人血量条数
export function getEnemyHpBars(enemyType: string, stageBaseHp: number): number {
  const enemy = ENEMY_TYPES[enemyType];
  if (!enemy) return 1;
  return Math.ceil(enemy.baseHp); // 每1倍基础血量 = 1条血
}

// 检查是否可以被秒杀
export function canBeInstantKilled(enemyType: string): boolean {
  const enemy = ENEMY_TYPES[enemyType];
  if (!enemy) return true;
  return enemy.type === 'normal'; // 只有普通敌人才能被秒杀
}

// 波次配置
export interface WaveConfig {
  totalEnemies: number;
  spawnInterval: number;
  enemyTypes: { type: string; weight: number }[];
  hasElite: boolean;
  hasBoss: boolean;
  eliteCount: number;
  bossCount: number;
}

// 获取波次配置
export function getWaveConfig(waveNumber: number): WaveConfig {
  const baseEnemyCount = 5;
  const enemyCountIncrease = Math.floor(waveNumber * 0.5);
  const totalEnemies = baseEnemyCount + enemyCountIncrease;

  const baseSpawnInterval = 2000;
  const spawnIntervalDecrease = Math.min(waveNumber * 50, 1000);
  const spawnInterval = Math.max(500, baseSpawnInterval - spawnIntervalDecrease);

  // 根据波次决定敌人类型
  const enemyTypes: { type: string; weight: number }[] = [
    { type: 'walker', weight: 60 },
    { type: 'runner', weight: 30 },
  ];

  // 第3波开始出现分裂尸
  if (waveNumber >= 3) {
    enemyTypes.push({ type: 'splitter', weight: 10 });
  }

  // 固定精英波次：第5波和第10波（只有1个精英）
  const hasElite = waveNumber === 5 || waveNumber === 10;
  if (hasElite) {
    enemyTypes.push({ type: 'tank', weight: 15 });
  }

  // 固定首领波次：第14波（只有1个首领）
  const hasBoss = waveNumber === 14;
  if (hasBoss) {
    enemyTypes.push({ type: 'boss', weight: 10 });
  }

  return {
    totalEnemies: hasElite || hasBoss ? totalEnemies : totalEnemies,
    spawnInterval,
    enemyTypes,
    hasElite,
    hasBoss,
    eliteCount: hasElite ? 1 : 0,
    bossCount: hasBoss ? 1 : 0,
  };
}
