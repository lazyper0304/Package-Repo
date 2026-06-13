// 装备系统

import { type Quality, type GemSlot, type GemDefinition, QUALITY_CONFIG } from './gems';
import equipmentConfig from '@/config/equipment.json';

export type EquipmentSlot = 'helmet' | 'armor' | 'shoulder' | 'legs' | 'boots';
export type ElementType = 'fire' | 'thunder' | 'water' | 'wind' | 'earth';

export interface EquipmentAffix {
  id: string;
  name: string;
  description: string;
  elementType: ElementType;
  damage: number;
}

export interface EquipmentDefinition {
  id: string;
  name: string;
  slot: EquipmentSlot;
  quality: Quality;
  attack: number;
  hp: number;
  gemSlots: number;
  equippedGems: GemDefinition[];
  affixes: EquipmentAffix[];
  identified: boolean;
  refineCost: number;
}

// 从 JSON 配置导出
export const ELEMENT_INFO = equipmentConfig.elementInfo as Record<ElementType, { name: string; icon: string; color: string }>;
export const EQUIPMENT_BASE_STATS = equipmentConfig.baseStats as Record<Quality, { attack: number; hp: number }>;
export const EQUIPMENT_NAMES = equipmentConfig.names as Record<EquipmentSlot, string[]>;
export const ELEMENT_DAMAGE_RANGE = equipmentConfig.elementDamageRange as Record<Quality, { min: number; max: number }>;
const REFINE_COST = equipmentConfig.refineCost as Record<Quality, number>;

// 随机元素类型
function randomElementType(): ElementType {
  const types: ElementType[] = ['fire', 'thunder', 'water', 'wind', 'earth'];
  return types[Math.floor(Math.random() * types.length)];
}

// 生成随机装备
export function generateRandomEquipment(slot: EquipmentSlot, quality: Quality): EquipmentDefinition {
  const baseStats = EQUIPMENT_BASE_STATS[quality];
  const gemSlots = QUALITY_CONFIG[quality].gemSlots;
  const names = EQUIPMENT_NAMES[slot];
  const name = names[Math.floor(Math.random() * names.length)];

  // 元素词条数量 = 宝石孔位数，初始为空（damage=0），需要洗练才有值
  const affixes: EquipmentAffix[] = [];
  for (let i = 0; i < gemSlots; i++) {
    affixes.push({
      id: `elem_empty_${i}_${Date.now()}`,
      name: '未洗练',
      description: '未洗练 - 点击洗练获取元素伤害',
      elementType: 'fire',
      damage: 0,
    });
  }

  return {
    id: `equip_${slot}_${quality}_${Date.now()}`,
    name: `${QUALITY_CONFIG[quality].name}${name}`,
    slot,
    quality,
    attack: baseStats.attack,
    hp: baseStats.hp,
    gemSlots,
    equippedGems: [],
    affixes,
    identified: true,
    refineCost: REFINE_COST[quality],
  };
}

// 鉴定装备
export function identifyEquipment(equipment: EquipmentDefinition): EquipmentDefinition {
  if (equipment.identified) return equipment;
  return {
    ...equipment,
    identified: true,
    name: equipment.name.replace('未知', ''),
  };
}

// 洗练单个词条
export function refineAffix(equipment: EquipmentDefinition, affixIndex: number): EquipmentDefinition {
  const range = ELEMENT_DAMAGE_RANGE[equipment.quality];
  const newElementType = randomElementType();

  // 分4个区间，越高的概率越低
  const totalRange = range.max - range.min;
  const segmentSize = totalRange / 4;
  // 概率权重：低区间50%，中低25%，中高15%，高10%
  const rand = Math.random() * 100;
  let segmentIndex: number;
  if (rand < 50) segmentIndex = 0;       // 低区间 50%
  else if (rand < 75) segmentIndex = 1;   // 中低 25%
  else if (rand < 90) segmentIndex = 2;   // 中高 15%
  else segmentIndex = 3;                   // 高 10%

  const segmentMin = range.min + segmentSize * segmentIndex;
  const segmentMax = range.min + segmentSize * (segmentIndex + 1);
  const newDamage = Math.floor(Math.random() * (segmentMax - segmentMin + 1)) + segmentMin;

  const newAffixes = equipment.affixes.map((affix, i) => {
    if (i !== affixIndex) return affix;
    return {
      id: `elem_${newElementType}_${i}_${Date.now()}`,
      name: `${ELEMENT_INFO[newElementType].name}系伤害`,
      description: `${ELEMENT_INFO[newElementType].name}系伤害+${newDamage}`,
      elementType: newElementType,
      damage: newDamage,
    };
  });

  return {
    ...equipment,
    affixes: newAffixes,
  };
}

// 镶嵌宝石
export function equipGem(equipment: EquipmentDefinition, gem: GemDefinition): EquipmentDefinition {
  if (equipment.equippedGems.length >= equipment.gemSlots) {
    return equipment;
  }

  if (equipment.slot !== gem.slot) {
    return equipment;
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

  equipment.affixes.forEach(affix => {
    elementDamage += affix.damage;
  });

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
