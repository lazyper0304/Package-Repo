// 装备系统

import { type Quality, type GemSlot, type GemDefinition, QUALITY_CONFIG } from './gems';

export type EquipmentSlot = 'helmet' | 'armor' | 'shoulder' | 'legs' | 'boots';

export interface EquipmentAffix {
  id: string;
  name: string;
  description: string;
  elementDamage: number; // 元素伤害
  elementPercent: number; // 元素伤害百分比（相对于上限）
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: Quality;
  attack: number; // 基础攻击
  hp: number; // 基础生命
  gemSlots: number; // 宝石孔位数
  equippedGems: GemDefinition[]; // 已镶嵌的宝石
  affixes: EquipmentAffix[]; // 词条（元素伤害）
  identified: boolean; // 是否已鉴定
  elementDamage: number; // 当前元素伤害
  maxElementDamage: number; // 元素伤害上限
  refineCost: number; // 洗练消耗铜钱
}

// 装备基础属性配置
export const EQUIPMENT_BASE_STATS: Record<Quality, { attack: number; hp: number }> = {
  common: { attack: 5, hp: 50 },
  excellent: { attack: 10, hp: 100 },
  elite: { attack: 20, hp: 200 },
  perfect: { attack: 35, hp: 350 },
  legendary: { attack: 50, hp: 500 },
  mythic: { attack: 80, hp: 800 },
};

// 装备名称
export const EQUIPMENT_NAMES: Record<EquipmentSlot, string[]> = {
  helmet: ['头盔', '战盔', '护目镜', '王冠'],
  armor: ['盔甲', '战甲', '护胸', '铠甲'],
  shoulder: ['肩甲', '护肩', '肩铠', '披肩'],
  legs: ['腿甲', '护腿', '胫甲', '战裙'],
  boots: ['战靴', '长靴', '护胫', '飞靴'],
};

// 元素伤害词条
export const ELEMENT_AFFIXES: EquipmentAffix[] = [
  { id: 'fire_damage_10', name: '火焰伤害+10', description: '火系技能伤害+10', elementDamage: 10 },
  { id: 'fire_damage_20', name: '火焰伤害+20', description: '火系技能伤害+20', elementDamage: 20 },
  { id: 'fire_damage_30', name: '火焰伤害+30', description: '火系技能伤害+30', elementDamage: 30 },
  { id: 'thunder_damage_10', name: '雷电伤害+10', description: '雷系技能伤害+10', elementDamage: 10 },
  { id: 'thunder_damage_20', name: '雷电伤害+20', description: '雷系技能伤害+20', elementDamage: 20 },
  { id: 'thunder_damage_30', name: '雷电伤害+30', description: '雷系技能伤害+30', elementDamage: 30 },
  { id: 'water_damage_10', name: '寒冰伤害+10', description: '水系技能伤害+10', elementDamage: 10 },
  { id: 'water_damage_20', name: '寒冰伤害+20', description: '水系技能伤害+20', elementDamage: 20 },
  { id: 'water_damage_30', name: '寒冰伤害+30', description: '水系技能伤害+30', elementDamage: 30 },
  { id: 'wind_damage_10', name: '狂风伤害+10', description: '风系技能伤害+10', elementDamage: 10 },
  { id: 'wind_damage_20', name: '狂风伤害+20', description: '风系技能伤害+20', elementDamage: 20 },
  { id: 'wind_damage_30', name: '狂风伤害+30', description: '风系技能伤害+30', elementDamage: 30 },
  { id: 'earth_damage_10', name: '大地伤害+10', description: '土系技能伤害+10', elementDamage: 10 },
  { id: 'earth_damage_20', name: '大地伤害+20', description: '土系技能伤害+20', elementDamage: 20 },
  { id: 'earth_damage_30', name: '大地伤害+30', description: '土系技能伤害+30', elementDamage: 30 },
];

// 元素伤害上限
const MAX_ELEMENT_DAMAGE: Record<Quality, number> = {
  common: 500,
  excellent: 800,
  elite: 1200,
  perfect: 1500,
  legendary: 1800,
  mythic: 2000,
};

// 洗练成本（铜钱）
const REFINE_COST: Record<Quality, number> = {
  common: 100,
  excellent: 200,
  elite: 400,
  perfect: 600,
  legendary: 1000,
  mythic: 2000,
};

// 生成随机装备
export function generateRandomEquipment(slot: EquipmentSlot, quality: Quality): EquipmentDefinition {
  const baseStats = EQUIPMENT_BASE_STATS[quality];
  const gemSlots = QUALITY_CONFIG[quality].gemSlots;
  const names = EQUIPMENT_NAMES[slot];
  const name = names[Math.floor(Math.random() * names.length)];

  // 随机词条（未鉴定时不知道具体词条）
  const affixCount = Math.min(quality === 'mythic' ? 3 : quality === 'legendary' ? 2 : 1, 3);
  const selectedAffixes: EquipmentAffix[] = [];
  const availableAffixes = [...ELEMENT_AFFIXES];

  for (let i = 0; i < affixCount && availableAffixes.length > 0; i++) {
    const index = Math.floor(Math.random() * availableAffixes.length);
    const affix = availableAffixes[index];
    selectedAffixes.push({
      ...affix,
      elementPercent: 0, // 未鉴定时不知道百分比
    });
    availableAffixes.splice(index, 1);
  }

  const maxElementDamage = MAX_ELEMENT_DAMAGE[quality];

  return {
    id: `equip_${slot}_${quality}_${Date.now()}`,
    name: `${QUALITY_CONFIG[quality].name}${name}`,
    slot,
    quality,
    attack: baseStats.attack,
    hp: baseStats.hp,
    gemSlots,
    equippedGems: [],
    affixes: selectedAffixes,
    identified: false,
    elementDamage: 0,
    maxElementDamage,
    refineCost: REFINE_COST[quality],
  };
}

// 鉴定装备
export function identifyEquipment(equipment: EquipmentDefinition): EquipmentDefinition {
  if (equipment.identified) return equipment;

  // 鉴定时随机生成元素伤害
  const randomPercent = Math.random() * 0.4 + 0.6; // 60%-100%
  const elementDamage = Math.floor(equipment.maxElementDamage * randomPercent);

  return {
    ...equipment,
    identified: true,
    name: equipment.name.replace('未知', ''),
    elementDamage,
    affixes: equipment.affixes.map(affix => ({
      ...affix,
      elementPercent: Math.round((elementDamage / equipment.maxElementDamage) * 100),
    })),
  };
}

// 洗练装备元素伤害
export function refineEquipment(equipment: EquipmentDefinition): EquipmentDefinition {
  // 随机生成新的元素伤害
  const randomPercent = Math.random() * 0.4 + 0.6; // 60%-100%
  const newElementDamage = Math.floor(equipment.maxElementDamage * randomPercent);

  // 只有比当前高才替换
  if (newElementDamage <= equipment.elementDamage) {
    return equipment;
  }

  return {
    ...equipment,
    elementDamage: newElementDamage,
    affixes: equipment.affixes.map(affix => ({
      ...affix,
      elementPercent: Math.round((newElementDamage / equipment.maxElementDamage) * 100),
    })),
  };
}

// 获取元素伤害百分比
export function getElementPercent(equipment: EquipmentDefinition): number {
  if (equipment.maxElementDamage === 0) return 0;
  return Math.round((equipment.elementDamage / equipment.maxElementDamage) * 100);
}

// 镶嵌宝石
export function equipGem(equipment: EquipmentDefinition, gem: GemDefinition): EquipmentDefinition {
  if (equipment.equippedGems.length >= equipment.gemSlots) {
    return equipment; // 孔位已满
  }

  if (equipment.slot !== gem.slot) {
    return equipment; // 部位不匹配
  }

  return {
    ...equipment,
    equippedGems: [...equipment.equippedGems, gem],
  };
}

// 卸下宝石
export function unequipGem(equipment: EquipmentDefinition, gemId: string): EquipmentDefinition {
  return {
    ...equipment,
    equippedGems: equipment.equippedGems.filter(g => g.id !== gemId),
  };
}

// 计算装备总属性
export function calculateEquipmentStats(equipment: EquipmentDefinition): {
  attack: number;
  hp: number;
  elementDamage: number;
} {
  let attack = equipment.attack;
  let hp = equipment.hp;
  let elementDamage = 0;

  // 词条提供的元素伤害
  equipment.affixes.forEach(affix => {
    elementDamage += affix.elementDamage;
  });

  // 宝石提供的属性
  equipment.equippedGems.forEach(gem => {
    gem.affixes.forEach(affix => {
      if (affix.id.startsWith('attack_')) {
        attack += affix.value;
      } else if (affix.id.startsWith('wall_hp_')) {
        hp += affix.value;
      }
    });
  });

  return { attack, hp, elementDamage };
}
