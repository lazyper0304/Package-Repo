import { BALANCE } from './balance';
import enemiesConfig from '@/config/enemies.json';

export interface WaveConfig {
  totalEnemies: number;
  spawnInterval: number;
  enemyTypes: { type: string; weight: number }[];
}

// 从 JSON 配置读取波次层级
const waveTiers = enemiesConfig.waveTiers as Array<{
  condition: { type: string; wave?: number; waves?: number[]; min?: number; max?: number };
  totalEnemiesFormula: string;
  enemyTypes: { type: string; weight: number }[];
}>;

// 简单公式解析器
function evalFormula(formula: string, wave: number): number {
  const expr = formula.replace(/wave/g, String(wave));
  try {
    return new Function(`return ${expr}`)();
  } catch {
    return 0;
  }
}

export function getWaveConfig(waveNumber: number): WaveConfig {
  const baseSpawnInterval = Math.max(BALANCE.wave.minSpawnInterval, BALANCE.wave.baseSpawnInterval - waveNumber * BALANCE.wave.spawnIntervalDecrease);

  for (const tier of waveTiers) {
    const { condition } = tier;
    let matched = false;

    if (condition.type === 'exact') {
      if (condition.wave !== undefined) {
        matched = waveNumber === condition.wave;
      } else if (condition.waves !== undefined) {
        matched = condition.waves.includes(waveNumber);
      }
    } else if (condition.type === 'range') {
      const min = condition.min ?? 0;
      const max = condition.max ?? Infinity;
      matched = waveNumber >= min && waveNumber <= max;
    }

    if (matched) {
      return {
        totalEnemies: evalFormula(tier.totalEnemiesFormula, waveNumber),
        spawnInterval: baseSpawnInterval,
        enemyTypes: tier.enemyTypes,
      };
    }
  }

  // fallback
  return {
    totalEnemies: 8 + waveNumber * 2,
    spawnInterval: baseSpawnInterval,
    enemyTypes: [{ type: 'walker', weight: 70 }, { type: 'runner', weight: 30 }],
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
