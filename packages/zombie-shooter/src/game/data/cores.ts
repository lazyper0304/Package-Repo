// 核心系统 - 提供初始技能或强化技能

import { type Element, type SkillLevel, SKILLS, getSkillChain } from './skills';
import { type Quality } from './gems';
import coresConfig from '@/config/cores.json';

export interface CoreDefinition {
  id: string;
  name: string;
  quality: Quality;
  element: Element;
  skillLevel: SkillLevel;
  description: string;
}

// 从 JSON 配置导出
export const CORE_NAMES = coresConfig.names as Record<Element, Record<SkillLevel, string>>;
export const CORE_QUALITY_SKILL_LEVEL = coresConfig.qualitySkillLevel as Record<Quality, SkillLevel>;

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
