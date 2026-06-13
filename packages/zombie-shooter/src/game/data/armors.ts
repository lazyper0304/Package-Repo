// 装甲系统 - 强化技能效果

import { type Element } from './skills';
import { type Quality } from './gems';
import armorsConfig from '@/config/armors.json';

export type ArmorTier = 'basic' | 'light' | 'dark';

export interface ArmorDefinition {
  id: string;
  name: string;
  quality: Quality;
  element: Element;
  tier: ArmorTier;
  description: string;
  effect: ArmorEffect;
}

export interface ArmorEffect {
  type: string;
  description: string;
  value?: number;
  duration?: number;
  chance?: number;
}

// 从 JSON 配置导出
export const ARMOR_NAMES = armorsConfig.names as Record<Element, Record<ArmorTier, string>>;
export const ARMOR_EFFECTS = armorsConfig.effects as Record<Element, Record<ArmorTier, ArmorEffect>>;
export const ARMOR_QUALITY_TIER = armorsConfig.qualityTier as Record<Quality, ArmorTier>;

// 生成随机装甲
export function generateRandomArmor(element: Element, quality: Quality): ArmorDefinition {
  const tier = ARMOR_QUALITY_TIER[quality];
  const name = ARMOR_NAMES[element][tier];
  const effect = ARMOR_EFFECTS[element][tier];

  return {
    id: `armor_${element}_${quality}_${Date.now()}`,
    name: `${name}`,
    quality,
    element,
    tier,
    description: effect.description,
    effect,
  };
}

// 获取装甲效果
export function getArmorEffect(armor: ArmorDefinition): ArmorEffect {
  return armor.effect;
}

// 检查装甲是否对指定元素有效
export function isArmorEffectiveForElement(armor: ArmorDefinition, element: Element): boolean {
  return armor.element === element;
}
