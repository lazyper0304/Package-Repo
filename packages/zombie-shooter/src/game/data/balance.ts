export const BALANCE = {
  player: {
    baseHp: 100,
    baseFireRate: 500, // ms between shots - 调大间隔
    baseDamage: 100, // 基础攻击提高到100
    baseBulletCount: 1,
    baseBulletSpeed: 400,
    baseCritChance: 0.05,
    baseCritMultiplier: 3,
    baseSpeed: 200,
    basePickupRange: 80,
  },
  wave: {
    hpScalePerWave: 0.1,
    speedScalePerWave: 0.02,
    maxSpeedScale: 0.5,
    baseSpawnInterval: 1500, // ms
    minSpawnInterval: 300,
    spawnIntervalDecrease: 50, // ms per wave
  },
  xp: {
    baseXpToLevel: 10,
    xpScalePerLevel: 1.2,
  },
};
