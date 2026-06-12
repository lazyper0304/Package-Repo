// 城墙血量系统 - 血量 + 护盾

export interface WallHealth {
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
}

// 创建城墙血量
export function createWallHealth(maxHp: number, maxShield: number = 0): WallHealth {
  return {
    hp: maxHp,
    maxHp,
    shield: maxShield,
    maxShield,
  };
}

// 城墙受到伤害（优先扣护盾）
export function wallTakeDamage(wall: WallHealth, damage: number): WallHealth {
  let remainingDamage = damage;
  let newShield = wall.shield;
  let newHp = wall.hp;

  // 先扣护盾
  if (newShield > 0) {
    const shieldDamage = Math.min(remainingDamage, newShield);
    newShield -= shieldDamage;
    remainingDamage -= shieldDamage;
  }

  // 再扣血量
  if (remainingDamage > 0) {
    newHp = Math.max(0, newHp - remainingDamage);
  }

  return {
    ...wall,
    hp: newHp,
    shield: newShield,
  };
}

// 城墙回血
export function wallHeal(wall: WallHealth, amount: number): WallHealth {
  return {
    ...wall,
    hp: Math.min(wall.maxHp, wall.hp + amount),
  };
}

// 城墙增加护盾
export function wallAddShield(wall: WallHealth, amount: number): WallHealth {
  return {
    ...wall,
    shield: Math.min(wall.maxShield, wall.shield + amount),
  };
}

// 获取城墙血量百分比
export function getWallHpPercent(wall: WallHealth): number {
  return (wall.hp / wall.maxHp) * 100;
}

// 获取城墙护盾百分比
export function getWallShieldPercent(wall: WallHealth): number {
  return wall.maxShield > 0 ? (wall.shield / wall.maxShield) * 100 : 0;
}

// 判断通关条件
export function getClearCondition(wall: WallHealth): 'full_hp' | 'half_hp' | 'cleared' | 'failed' {
  if (wall.hp <= 0) return 'failed';
  if (wall.hp === wall.maxHp) return 'full_hp';
  if (wall.hp >= wall.maxHp * 0.5) return 'half_hp';
  return 'cleared';
}

// 获取通关奖励描述
export function getClearRewardText(condition: string): string {
  switch (condition) {
    case 'full_hp':
      return '100%血量通关 (+200金条)';
    case 'half_hp':
      return '50%血量通关 (+50金条)';
    case 'cleared':
      return '通关';
    case 'failed':
      return '挑战失败';
    default:
      return '';
  }
}
