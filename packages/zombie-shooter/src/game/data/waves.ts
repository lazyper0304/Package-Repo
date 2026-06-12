import { BALANCE } from './balance';

export interface WaveConfig {
  totalEnemies: number;
  spawnInterval: number;
  enemyTypes: { type: string; weight: number }[];
}

export function getWaveConfig(waveNumber: number): WaveConfig {
  const baseSpawnInterval = Math.max(BALANCE.wave.minSpawnInterval, BALANCE.wave.baseSpawnInterval - waveNumber * BALANCE.wave.spawnIntervalDecrease);

  // Boss wave: 第14波
  if (waveNumber === 14) {
    return {
      totalEnemies: 15 + waveNumber * 2,
      spawnInterval: baseSpawnInterval,
      enemyTypes: [
        { type: 'walker', weight: 30 },
        { type: 'runner', weight: 25 },
        { type: 'tank', weight: 20 },
        { type: 'splitter', weight: 15 },
        { type: 'boss', weight: 10 },
      ],
    };
  }

  // Elite wave: 第5波和第10波
  if (waveNumber === 5 || waveNumber === 10) {
    return {
      totalEnemies: 10 + waveNumber * 2,
      spawnInterval: baseSpawnInterval,
      enemyTypes: [
        { type: 'walker', weight: 40 },
        { type: 'runner', weight: 30 },
        { type: 'tank', weight: 20 },
        { type: 'splitter', weight: 10 },
      ],
    };
  }

  // Early waves (1-4)
  if (waveNumber <= 4) {
    return {
      totalEnemies: 8 + waveNumber * 2,
      spawnInterval: baseSpawnInterval,
      enemyTypes: [
        { type: 'walker', weight: 70 },
        { type: 'runner', weight: 30 },
      ],
    };
  }

  // Mid waves (6-9, 11-13, 15-20)
  if (waveNumber <= 13) {
    return {
      totalEnemies: 12 + waveNumber * 2,
      spawnInterval: baseSpawnInterval,
      enemyTypes: [
        { type: 'walker', weight: 40 },
        { type: 'runner', weight: 30 },
        { type: 'splitter', weight: 20 },
        { type: 'tank', weight: 10 },
      ],
    };
  }

  // Late waves (15-20)
  return {
    totalEnemies: 15 + waveNumber * 2,
    spawnInterval: baseSpawnInterval,
    enemyTypes: [
      { type: 'walker', weight: 35 },
      { type: 'runner', weight: 25 },
      { type: 'splitter', weight: 25 },
      { type: 'tank', weight: 15 },
    ],
  };
}

// 计算20波总敌人数
export function getTotalEnemiesFor20Waves(): number {
  let total = 0;
  for (let i = 1; i <= 20; i++) {
    total += getWaveConfig(i).totalEnemies;
  }
  return total;
}
