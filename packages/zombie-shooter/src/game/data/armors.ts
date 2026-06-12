// 装甲系统 - 强化技能效果

import { type Element } from './skills';
import { type Quality } from './gems';

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

// 装甲名称
export const ARMOR_NAMES: Record<Element, Record<ArmorTier, string>> = {
  wind: {
    basic: '风灵甲',
    light: '玄风战甲',
    dark: '狂风之铠',
  },
  thunder: {
    basic: '雷灵甲',
    light: '神罚战甲',
    dark: '诡雷之铠',
  },
  water: {
    basic: '冰灵甲',
    light: '圣水战甲',
    dark: '洪荒之铠',
  },
  fire: {
    basic: '火灵甲',
    light: '神炎战甲',
    dark: '灭世之铠',
  },
  earth: {
    basic: '土灵甲',
    light: '大地战甲',
    dark: '地裂之铠',
  },
};

// 装甲效果
export const ARMOR_EFFECTS: Record<Element, Record<ArmorTier, ArmorEffect>> = {
  wind: {
    basic: {
      type: 'skill_duration',
      description: '风系技能持续时间增加1s',
      duration: 1000,
    },
    light: {
      type: 'skill_spawn',
      description: '风系技能释放结束后，在结束的位置再次产生一个原地不动的旋风，持续3s',
      duration: 3000,
    },
    dark: {
      type: 'element_combo',
      description: '风系技能对燃烧的敌人，额外造成其最大生命值1%的伤害',
      value: 1,
    },
  },
  thunder: {
    basic: {
      type: 'skill_effect',
      description: '雷系技能造成伤害的同时麻痹敌人1s',
      duration: 1000,
    },
    light: {
      type: 'damage_boost',
      description: '雷系技能造成伤害的时候，50%几率降下神罚，将1s内的雷系伤害提升1000%',
      chance: 50,
      value: 1000,
      duration: 1000,
    },
    dark: {
      type: 'chain_damage',
      description: '雷系技能造成伤害的时候，同时释放出一个闪电球，闪电球会沿着敌人10个单位距离内的所有敌人都造成伤害',
      value: 10,
    },
  },
  water: {
    basic: {
      type: 'skill_duration',
      description: '水系技能冰冻时间增加1s',
      duration: 1000,
    },
    light: {
      type: 'lifesteal',
      description: '水系技能造成伤害的同时，有50%概率回血1%',
      chance: 50,
      value: 1,
    },
    dark: {
      type: 'knockback',
      description: '水系技能造成伤害的同时，有50%概率击退敌人10个单位距离',
      chance: 50,
      value: 10,
    },
  },
  fire: {
    basic: {
      type: 'skill_duration',
      description: '火系技能燃烧时间增加1s',
      duration: 1000,
    },
    light: {
      type: 'aoe_damage',
      description: '火系技能造成伤害的同时，场上随机三个位置发生爆炸，造成同等伤害',
      value: 3,
    },
    dark: {
      type: 'instant_kill',
      description: '火系技能造成伤害的同时，50%概率积攒一个灭世值，当灭世值达到3个的时候，随机秒杀一个正在燃烧的敌人（对精英和首领无效）',
      chance: 50,
      value: 3,
    },
  },
  earth: {
    basic: {
      type: 'knockback',
      description: '土系技能击退增加2个单位距离',
      value: 2,
    },
    light: {
      type: 'wall_restore',
      description: '土系技能造成伤害的同时，有50%概率给城墙恢复10%最大护盾值的护盾',
      chance: 50,
      value: 10,
    },
    dark: {
      type: 'teleport',
      description: '土系技能造成伤害的同时，有50%概率将敌人传送至任意位置',
      chance: 50,
    },
  },
};

// 装甲品质对应阶级
export const ARMOR_QUALITY_TIER: Record<Quality, ArmorTier> = {
  common: 'basic',
  excellent: 'basic',
  elite: 'basic',
  perfect: 'light',
  legendary: 'light',
  mythic: 'dark',
};

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
