// 奖励系统 - 整合所有掉落物

import { type Quality, QUALITY_CONFIG } from './gems';
import { generateRandomGem, type GemDefinition } from './gems';
import { generateRandomEquipment, type EquipmentDefinition, type EquipmentSlot } from './equipment';
import { generateRandomCore, type CoreDefinition } from './cores';
import { generateRandomArmor, type ArmorDefinition } from './armors';
import { type Element } from './skills';

export type RewardType = 'gem' | 'equipment' | 'core' | 'armor';

export interface RewardItem {
  id: string;
  type: RewardType;
  quality: Quality;
  name: string;
  identified: boolean;
  data: GemDefinition | EquipmentDefinition | CoreDefinition | ArmorDefinition;
}

// 品质辅助函数
export function getQualityColor(quality: Quality): string {
  return QUALITY_CONFIG[quality]?.color || '#9ca3af';
}

export function getQualityName(quality: Quality): string {
  return QUALITY_CONFIG[quality]?.name || '未知';
}

// 品质掉落权重
const QUALITY_WEIGHTS: Record<string, Record<Quality, number>> = {
  normal: {
    common: 50,
    excellent: 30,
    elite: 15,
    perfect: 4,
    legendary: 0.9,
    mythic: 0.1,
  },
  elite: {
    common: 35,
    excellent: 30,
    elite: 25,
    perfect: 8,
    legendary: 1.8,
    mythic: 0.2,
  },
  hell: {
    common: 20,
    excellent: 25,
    elite: 30,
    perfect: 18,
    legendary: 5,
    mythic: 2,
  },
};

// 随机选择品质
function rollQuality(difficulty: 'normal' | 'elite' | 'hell'): Quality {
  const weights = QUALITY_WEIGHTS[difficulty];
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [quality, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return quality as Quality;
    }
  }

  return 'common';
}

// 生成随机奖励
export function generateRewards(
  difficulty: 'normal' | 'elite' | 'hell',
  progressPercent: number,
  stageNumber: number
): RewardItem[] {
  const rewards: RewardItem[] = [];

  // 基础奖励数量
  const baseCount = difficulty === 'normal' ? 1 : difficulty === 'elite' ? 2 : 3;
  const bonusCount = Math.floor(progressPercent / 30);
  const totalRewards = baseCount + bonusCount;

  for (let i = 0; i < totalRewards; i++) {
    const item = generateRandomReward(difficulty, stageNumber);
    rewards.push(item);
  }

  return rewards;
}

function generateRandomReward(difficulty: 'normal' | 'elite' | 'hell', stageNumber: number): RewardItem {
  const quality = rollQuality(difficulty);

  // 随机选择奖励类型（局内只掉落宝石和装备）
  const types: RewardType[] = ['gem', 'equipment'];
  const type = types[Math.floor(Math.random() * types.length)];

  let data: GemDefinition | EquipmentDefinition;

  switch (type) {
    case 'gem': {
      const slots: EquipmentSlot[] = ['helmet', 'armor', 'shoulder', 'legs', 'boots'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      data = generateRandomGem(slot, quality);
      break;
    }
    case 'equipment': {
      const slots: EquipmentSlot[] = ['helmet', 'armor', 'shoulder', 'legs', 'boots'];
      const slot = slots[Math.floor(Math.random() * slots.length)];
      data = generateRandomEquipment(slot, quality);
      break;
    }
    default:
      data = generateRandomGem('helmet', quality);
  }

  return {
    id: `reward_${type}_${quality}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    quality,
    name: `未知${type === 'gem' ? '宝石' : '装备'}`,
    identified: false,
    data,
  };
}

// 鉴定奖励
export function identifyReward(reward: RewardItem): RewardItem {
  if (reward.identified) return reward;

  let identifiedData = reward.data;

  switch (reward.type) {
    case 'equipment': {
      const equip = reward.data as EquipmentDefinition;
      identifiedData = {
        ...equip,
        identified: true,
      };
      break;
    }
    default:
      break;
  }

  const qualityConfig = QUALITY_CONFIG[reward.quality];
  const typeNames: Record<RewardType, string> = {
    gem: '宝石',
    equipment: '装备',
    core: '核心',
    armor: '装甲',
  };

  return {
    ...reward,
    identified: true,
    name: `${qualityConfig.name}${typeNames[reward.type]}`,
    data: identifiedData,
  };
}

// 生成局外奖励（核心、装甲）
export function generateExternalReward(
  type: 'core' | 'armor',
  quality: Quality
): RewardItem {
  let data: CoreDefinition | ArmorDefinition;

  if (type === 'core') {
    const elements: Element[] = ['wind', 'thunder', 'water', 'fire', 'earth'];
    const element = elements[Math.floor(Math.random() * elements.length)];
    data = generateRandomCore(element, quality);
  } else {
    const elements: Element[] = ['wind', 'thunder', 'water', 'fire', 'earth'];
    const element = elements[Math.floor(Math.random() * elements.length)];
    data = generateRandomArmor(element, quality);
  }

  return {
    id: `reward_${type}_${quality}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    quality,
    name: data.name,
    identified: true,
    data,
  };
}
