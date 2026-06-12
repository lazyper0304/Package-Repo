// 核心系统 - 提供初始技能或强化技能

import { type Element, type SkillLevel, SKILLS, getSkillChain } from './skills';
import { type Quality } from './gems';

export interface CoreDefinition {
  id: string;
  name: string;
  quality: Quality;
  element: Element;
  skillLevel: SkillLevel; // 提供的技能等级
  description: string;
}

// 核心名称
export const CORE_NAMES: Record<Element, Record<SkillLevel, string>> = {
  wind: {
    basic: '风之核心',
    advanced1: '旋风核心',
    advanced2: '风暴核心',
  },
  thunder: {
    basic: '雷之核心',
    advanced1: '惊雷核心',
    advanced2: '天雷核心',
  },
  water: {
    basic: '水之核心',
    advanced1: '寒冰核心',
    advanced2: '洪水核心',
  },
  fire: {
    basic: '火之核心',
    advanced1: '爆炎核心',
    advanced2: '真火核心',
  },
  earth: {
    basic: '土之核心',
    advanced1: '飞岩核心',
    advanced2: '泰山核心',
  },
};

// 核心品质对应技能等级
export const CORE_QUALITY_SKILL_LEVEL: Record<Quality, SkillLevel> = {
  common: 'basic',
  excellent: 'basic',
  elite: 'advanced1',
  perfect: 'advanced1',
  legendary: 'advanced2',
  mythic: 'advanced2',
};

// 生成随机核心
export function generateRandomCore(element: Element, quality: Quality): CoreDefinition {
  const skillLevel = CORE_QUALITY_SKILL_LEVEL[quality];
  const name = CORE_NAMES[element][skillLevel];
  const skill = SKILLS[`${element}_${skillLevel}`];

  return {
    id: `core_${element}_${quality}_${Date.now()}`,
    name: `${name}`,
    quality,
    element,
    skillLevel,
    description: `提供${skill.name}技能`,
  };
}

// 获取核心提供的技能
export function getCoreSkill(core: CoreDefinition): string {
  return `${core.element}_${core.skillLevel}`;
}

// 检查核心是否提供进阶技能
export function hasAdvancedSkill(core: CoreDefinition): boolean {
  return core.skillLevel === 'advanced1' || core.skillLevel === 'advanced2';
}

// 检查核心是否提供最高进阶技能
export function hasMaxAdvancedSkill(core: CoreDefinition): boolean {
  return core.skillLevel === 'advanced2';
}

// 获取核心提供的所有技能（包括前置）
export function getCoreSkills(core: CoreDefinition): string[] {
  const chain = getSkillChain(core.element);
  const skillIds: string[] = [];

  for (const skill of chain) {
    skillIds.push(skill.id);
    if (skill.level === core.skillLevel) {
      break;
    }
  }

  return skillIds;
}
