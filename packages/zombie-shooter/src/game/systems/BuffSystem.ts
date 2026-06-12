// Buff 系统

export type BuffType = 'burn' | 'freeze' | 'paralyze' | 'slow' | 'stun' | 'bleed';

export interface Buff {
  type: BuffType;
  duration: number; // 持续时间（毫秒）
  remaining: number; // 剩余时间
  value: number; // 效果值（如伤害百分比、减速比例）
  interval?: number; // 触发间隔（用于DOT）
  lastTick?: number; // 上次触发时间
}

export interface BuffConfig {
  name: string;
  icon: string;
  color: string;
  defaultDuration: number;
  defaultValue: number;
  interval?: number; // DOT间隔
}

export const BUFF_CONFIGS: Record<BuffType, BuffConfig> = {
  burn: {
    name: '燃烧',
    icon: '🔥',
    color: '#ef4444',
    defaultDuration: 3000,
    defaultValue: 0.3, // 攻击的30%
    interval: 1000, // 每秒触发
  },
  freeze: {
    name: '冰冻',
    icon: '❄️',
    color: '#3b82f6',
    defaultDuration: 1000,
    defaultValue: 1, // 完全停止
  },
  paralyze: {
    name: '麻痹',
    icon: '⚡',
    color: '#f59e0b',
    defaultDuration: 1000,
    defaultValue: 0.5, // 减速50%
  },
  slow: {
    name: '减速',
    icon: '🐌',
    color: '#8b5cf6',
    defaultDuration: 2000,
    defaultValue: 0.5, // 减速50%
  },
  stun: {
    name: '眩晕',
    icon: '💫',
    color: '#f97316',
    defaultDuration: 1000,
    defaultValue: 1, // 完全停止
  },
  bleed: {
    name: '流血',
    icon: '🩸',
    color: '#dc2626',
    defaultDuration: 5000,
    defaultValue: 0.3, // 受到的所有伤害增加30%
  },
};

export class BuffManager {
  private buffs: Map<string, Buff[]> = new Map();

  // 添加buff
  addBuff(entityId: string, type: BuffType, duration?: number, value?: number): void {
    const config = BUFF_CONFIGS[type];
    const existing = this.buffs.get(entityId) || [];

    // 检查是否已有同类型buff
    const existingIndex = existing.findIndex(b => b.type === type);
    if (existingIndex >= 0) {
      // 刷新持续时间
      existing[existingIndex].remaining = duration || config.defaultDuration;
      existing[existingIndex].value = value || config.defaultValue;
    } else {
      // 添加新buff
      existing.push({
        type,
        duration: duration || config.defaultDuration,
        remaining: duration || config.defaultDuration,
        value: value || config.defaultValue,
        interval: config.interval,
        lastTick: 0,
      });
    }

    this.buffs.set(entityId, existing);
  }

  // 更新buff
  update(entityId: string, delta: number, currentTime: number): {
    shouldMove: boolean;
    moveMultiplier: number;
    dotDamage: number;
    shouldAttack: boolean;
    damageMultiplier: number; // 受到的伤害倍率
  } {
    const buffs = this.buffs.get(entityId);
    if (!buffs || buffs.length === 0) {
      return { shouldMove: true, moveMultiplier: 1, dotDamage: 0, shouldAttack: true, damageMultiplier: 1 };
    }

    let shouldMove = true;
    let moveMultiplier = 1;
    let dotDamage = 0;
    let shouldAttack = true;
    let damageMultiplier = 1;

    // 更新每个buff
    for (let i = buffs.length - 1; i >= 0; i--) {
      const buff = buffs[i];
      buff.remaining -= delta;

      // buff过期
      if (buff.remaining <= 0) {
        buffs.splice(i, 1);
        continue;
      }

      // 处理buff效果
      switch (buff.type) {
        case 'burn':
          // DOT伤害
          if (buff.interval && currentTime - (buff.lastTick || 0) >= buff.interval) {
            buff.lastTick = currentTime;
            dotDamage += buff.value;
          }
          break;

        case 'freeze':
        case 'stun':
          // 完全停止
          shouldMove = false;
          shouldAttack = false;
          break;

        case 'paralyze':
          // 减速 + 无法攻击
          moveMultiplier = Math.min(moveMultiplier, buff.value);
          shouldAttack = false;
          break;

        case 'slow':
          // 减速
          moveMultiplier = Math.min(moveMultiplier, buff.value);
          break;

        case 'bleed':
          // 受到的所有伤害增加30%
          damageMultiplier += buff.value;
          break;
      }
    }

    // 如果没有buff了，删除map
    if (buffs.length === 0) {
      this.buffs.delete(entityId);
    }

    return { shouldMove, moveMultiplier, dotDamage, shouldAttack, damageMultiplier };
  }

  // 获取实体的所有buff
  getBuffs(entityId: string): Buff[] {
    return this.buffs.get(entityId) || [];
  }

  // 检查是否有某个buff
  hasBuff(entityId: string, type: BuffType): boolean {
    const buffs = this.buffs.get(entityId);
    return buffs ? buffs.some(b => b.type === type) : false;
  }

  // 移除实体的所有buff
  clearBuffs(entityId: string): void {
    this.buffs.delete(entityId);
  }

  // 移除实体的特定buff
  removeBuff(entityId: string, type: BuffType): void {
    const buffs = this.buffs.get(entityId);
    if (buffs) {
      const index = buffs.findIndex(b => b.type === type);
      if (index >= 0) {
        buffs.splice(index, 1);
      }
      if (buffs.length === 0) {
        this.buffs.delete(entityId);
      }
    }
  }
}

// 全局buff管理器实例
export const buffManager = new BuffManager();
