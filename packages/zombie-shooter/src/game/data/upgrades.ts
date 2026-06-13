// 升级词条系统 - 参考设计文档

import upgradesConfig from '@/config/upgrades.json';

export type UpgradeCategory = 'gun' | 'skill' | 'element' | 'heal';

// 枪相关词条
export type GunUpgradeId =
  | 'gun_damage'
  | 'gun_burst'
  | 'gun_rapid'
  | 'gun_split_2'
  | 'gun_split_4'
  | 'gun_all_damage'
  | 'gun_fire'
  | 'gun_ice'
  | 'gun_thunder'
  | 'gun_explosive';

// 技能相关词条
export type SkillUpgradeId =
  | 'skill_wind_1'
  | 'skill_wind_2'
  | 'skill_wind_3'
  | 'skill_thunder_1'
  | 'skill_thunder_2'
  | 'skill_thunder_3'
  | 'skill_water_1'
  | 'skill_water_2'
  | 'skill_water_3'
  | 'skill_fire_1'
  | 'skill_fire_2'
  | 'skill_fire_3'
  | 'skill_earth_1'
  | 'skill_earth_2'
  | 'skill_earth_3';

// 元素伤害词条
export type ElementDamageUpgradeId =
  | 'element_wind'
  | 'element_thunder'
  | 'element_water'
  | 'element_fire'
  | 'element_earth';

// 回血词条
export type HealUpgradeId = 'heal_30';

export type UpgradeId = GunUpgradeId | SkillUpgradeId | ElementDamageUpgradeId | HealUpgradeId;

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  category: UpgradeCategory;
  icon: string;
  maxLevel: number;
  requires?: UpgradeId[];
  levelEffect: (level: number) => string;
}

// 技能系别映射
export const ELEMENT_SKILLS = upgradesConfig.elementSkills as Record<string, {
  initial: SkillUpgradeId;
  advanced1: SkillUpgradeId;
  advanced2: SkillUpgradeId;
  element: ElementDamageUpgradeId;
}>;

// 模板解析器：将 "{level * 60}" 这样的表达式解析为实际值
function evalTemplate(template: string, level: number): string {
  return template.replace(/\{([^}]+)\}/g, (_, expr) => {
    try {
      const fn = new Function('level', `return ${expr}`);
      return String(fn(level));
    } catch {
      return expr;
    }
  });
}

// 从 JSON 配置构建升级定义
const rawUpgrades = upgradesConfig.upgrades as Record<string, {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  maxLevel: number;
  requires?: string[];
  levelEffectTemplate: string;
}>;

export const UPGRADES: Record<UpgradeId, UpgradeDefinition> = {} as Record<UpgradeId, UpgradeDefinition>;

for (const [key, raw] of Object.entries(rawUpgrades)) {
  UPGRADES[key as UpgradeId] = {
    id: raw.id as UpgradeId,
    name: raw.name,
    description: raw.description,
    category: raw.category as UpgradeCategory,
    icon: raw.icon,
    maxLevel: raw.maxLevel,
    requires: raw.requires as UpgradeId[] | undefined,
    levelEffect: (level: number) => evalTemplate(raw.levelEffectTemplate, level),
  };
}

// 获取玩家拥有的技能系别
export function getPlayerSkillElements(currentLevels: Record<UpgradeId, number>): string[] {
  const elements: string[] = [];
  for (const [element, skills] of Object.entries(ELEMENT_SKILLS)) {
    if ((currentLevels[skills.initial] || 0) > 0) {
      elements.push(element);
    }
  }
  return elements;
}

// 获取可用升级列表
export function getAvailableUpgrades(
  currentLevels: Record<UpgradeId, number>,
  playerHpPercent: number,
  hasSplit: boolean,
  activeSkills: string[]
): UpgradeDefinition[] {
  const available: UpgradeDefinition[] = [];

  for (const upgrade of Object.values(UPGRADES)) {
    const currentLevel = currentLevels[upgrade.id] || 0;

    if (currentLevel >= upgrade.maxLevel) continue;

    if (upgrade.requires) {
      const hasAllRequires = upgrade.requires.every(req => (currentLevels[req] || 0) > 0);
      if (!hasAllRequires) continue;
    }

    if (upgrade.category === 'heal' && playerHpPercent >= 100) continue;

    if (upgrade.id === 'gun_fire' || upgrade.id === 'gun_ice' || upgrade.id === 'gun_thunder') {
      const hasAnyElement = (currentLevels['gun_fire'] || 0) > 0 ||
        (currentLevels['gun_ice'] || 0) > 0 ||
        (currentLevels['gun_thunder'] || 0) > 0;
      if (hasAnyElement) continue;
    }

    if (upgrade.category === 'skill') {
      const skillElement = Object.entries(ELEMENT_SKILLS).find(([_, skills]) =>
        skills.initial === upgrade.id || skills.advanced1 === upgrade.id || skills.advanced2 === upgrade.id
      );

      if (skillElement) {
        const [element, skills] = skillElement;

        if (activeSkills.length >= 3 && !activeSkills.includes(element)) continue;

        if (upgrade.id === skills.initial) {
          if ((currentLevels[skills.initial] || 0) > 0) continue;
        }

        if (upgrade.id === skills.advanced1) {
          if ((currentLevels[skills.initial] || 0) === 0) continue;
          if ((currentLevels[skills.advanced1] || 0) > 0) continue;
        }

        if (upgrade.id === skills.advanced2) {
          if ((currentLevels[skills.advanced1] || 0) === 0) continue;
          if ((currentLevels[skills.advanced2] || 0) > 0) continue;
        }
      }
    }

    if (upgrade.category === 'element') {
      const element = upgrade.id.replace('element_', '');
      if (!activeSkills.includes(element)) continue;
    }

    available.push(upgrade);
  }

  return available;
}

// 随机选择升级选项
export function getRandomUpgradeOptions(
  currentLevels: Record<UpgradeId, number>,
  playerHpPercent: number,
  activeSkills: string[],
  count: number = 3
): UpgradeDefinition[] {
  const hasSplit = (currentLevels['gun_split_2'] || 0) > 0;
  const available = getAvailableUpgrades(currentLevels, playerHpPercent, hasSplit, activeSkills);

  if (available.length === 0) return [];

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
