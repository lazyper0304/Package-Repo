// 货币系统

import currencyConfig from '@/config/currency.json';

export type CurrencyType = 'copper' | 'silver' | 'gold';

export interface Currency {
  copper: number;
  silver: number;
  gold: number;
}

// 从 JSON 配置导出
export const CURRENCY_CONFIG = currencyConfig.currencyConfig as Record<CurrencyType, {
  name: string;
  icon: string;
  description: string;
}>;

export const STAGE_REWARDS = currencyConfig.stageRewards;

export const GACHA_CONFIG = {
  ...currencyConfig.gacha,
  currency: currencyConfig.gacha.single.currency as CurrencyType,
};

const skillUpgradeRaw = currencyConfig.skillUpgrade;
export const SKILL_UPGRADE_CONFIG = {
  elementDamageBonus: skillUpgradeRaw.elementDamageBonus,
  upgradeCurrency: skillUpgradeRaw.upgradeCurrency as CurrencyType,
  getUpgradeCost: (level: number) => Math.floor(skillUpgradeRaw.upgradeCostBase * Math.pow(skillUpgradeRaw.upgradeCostScale, level - 1)),
};
