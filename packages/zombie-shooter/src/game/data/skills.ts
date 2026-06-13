// 技能系统 - 风雷水火土五系

import skillsConfig from '@/config/skills.json';

export type Element = 'wind' | 'thunder' | 'water' | 'fire' | 'earth';
export type SkillLevel = 'basic' | 'advanced1' | 'advanced2';

export interface SkillDefinition {
  id: string;
  name: string;
  element: Element;
  level: SkillLevel;
  description: string;
  cooldown: number;
  damage: (attack: number, elementDamage: number) => number;
  effect: SkillEffect;
}

export interface SkillEffect {
  type: 'damage' | 'dot' | 'freeze' | 'slow' | 'knockback' | 'stun';
  duration?: number;
  value?: number;
  range?: number;
  count?: number;
}

// 从 JSON 配置导出
export const ELEMENT_WEAKNESS = skillsConfig.elementWeakness as Record<Element, Element>;
export const ELEMENT_COLORS = skillsConfig.elementColors as Record<Element, string>;
export const ELEMENT_NAMES = skillsConfig.elementNames as Record<Element, string>;
export const ELEMENT_BASE_DAMAGE = skillsConfig.elementBaseDamage as Record<Element, number>;

const damageMultiplier = skillsConfig.damageFormulaMultiplier;

// 从 JSON 构建技能定义
const rawSkills = skillsConfig.skills as Record<string, {
  id: string;
  name: string;
  element: string;
  level: string;
  description: string;
  cooldown: number;
  effect: SkillEffect;
}>;

export const SKILLS: Record<string, SkillDefinition> = {};

for (const [key, raw] of Object.entries(rawSkills)) {
  SKILLS[key] = {
    id: raw.id,
    name: raw.name,
    element: raw.element as Element,
    level: raw.level as SkillLevel,
    description: raw.description,
    cooldown: raw.cooldown,
    damage: (attack: number, elementDamage: number) => attack * damageMultiplier + elementDamage,
    effect: raw.effect,
  };
}

// 获取技能链
export function getSkillChain(element: Element): SkillDefinition[] {
  return [
    SKILLS[`${element}_basic`],
    SKILLS[`${element}_advanced1`],
    SKILLS[`${element}_advanced2`],
  ];
}

// 获取当前可用的最高级技能
export function getHighestSkill(element: Element, hasCore: boolean, hasAdvanced1: boolean, hasAdvanced2: boolean): SkillDefinition | null {
  if (hasAdvanced2) return SKILLS[`${element}_advanced2`];
  if (hasAdvanced1) return SKILLS[`${element}_advanced1`];
  if (hasCore) return SKILLS[`${element}_basic`];
  return null;
}

// 获取技能显示名称
export function getSkillDisplayName(skillId: string): string {
  const skill = SKILLS[skillId];
  return skill ? skill.name : '未知技能';
}

// 获取元素显示名称
export function getElementDisplayName(element: Element): string {
  return ELEMENT_NAMES[element];
}

// 获取元素颜色
export function getElementColor(element: Element): string {
  return ELEMENT_COLORS[element];
}
