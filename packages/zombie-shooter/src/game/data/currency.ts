// 货币系统

export type CurrencyType = 'copper' | 'silver' | 'gold';

export interface Currency {
  copper: number;
  silver: number;
  gold: number;
}

export const CURRENCY_CONFIG: Record<CurrencyType, {
  name: string;
  icon: string;
  description: string;
}> = {
  copper: {
    name: '铜钱',
    icon: '🪙',
    description: '打关卡产出，用于装备和核心升级',
  },
  silver: {
    name: '银锭',
    icon: '🥈',
    description: '打副本产出（暂未开放）',
  },
  gold: {
    name: '金条',
    icon: '🥇',
    description: '通关宝箱产出，每关只能领一次',
  },
};

// 通关奖励配置
export const STAGE_REWARDS = {
  clear: {
    description: '通关奖励',
    rewards: ['gem', 'equipment'],
  },
  halfHp: {
    description: '50%血量通关',
    rewards: ['gem', 'equipment'],
    bonusGold: 50,
  },
  fullHp: {
    description: '100%血量通关',
    rewards: ['gem', 'equipment'],
    bonusGold: 200,
  },
};

// 抽奖配置
export const GACHA_CONFIG = {
  single: {
    cost: 200,
    currency: 'gold' as CurrencyType,
    description: '单抽',
  },
  multi: {
    cost: 1800,
    currency: 'gold' as CurrencyType,
    count: 10,
    description: '10连抽（9折）',
  },
  // 抽奖概率
  rates: {
    gem: 0.85, // 85% 宝石
    core: 0.10, // 10% 核心
    armor: 0.05, // 5% 装甲
  },
  // 宝石品质概率
  gemQualityRates: {
    common: 0.50,
    excellent: 0.30,
    elite: 0.15,
    perfect: 0.04,
    legendary: 0.009,
    mythic: 0.001,
  },
};

// 技能升级配置
export const SKILL_UPGRADE_CONFIG = {
  elementDamageBonus: 0.10, // 每次升级+10%元素伤害
  upgradeCurrency: 'copper' as CurrencyType,
  getUpgradeCost: (level: number) => Math.floor(100 * Math.pow(1.5, level - 1)),
};
