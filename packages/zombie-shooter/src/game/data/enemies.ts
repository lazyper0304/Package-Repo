import enemiesConfig from '@/config/enemies.json';

export type EnemyType = 'normal' | 'elite' | 'boss';

export interface EnemyDefinition {
  name: string;
  texture: string;
  type: EnemyType;
  baseHp: number;
  speed: number;
  damage: number;
  xpValue: number;
  scale: number;
  attackCooldown: number;
  defense: number;
  dodgeRate: number;
  isBoss?: boolean;
  zigzag?: boolean;
}

// 从 JSON 配置导出
export const ENEMY_TYPES = enemiesConfig.enemies as Record<string, EnemyDefinition>;

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
  return Math.ceil(enemy.baseHp);
}

// 检查是否可以被秒杀
export function canBeInstantKilled(enemyType: string): boolean {
  const enemy = ENEMY_TYPES[enemyType];
  if (!enemy) return true;
  return enemy.type === 'normal';
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

  const enemyTypes: { type: string; weight: number }[] = [
    { type: 'walker', weight: 60 },
    { type: 'runner', weight: 30 },
  ];

  if (waveNumber >= 3) {
    enemyTypes.push({ type: 'splitter', weight: 10 });
  }

  const hasElite = waveNumber === 5 || waveNumber === 10;
  if (hasElite) {
    enemyTypes.push({ type: 'tank', weight: 15 });
  }

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
