// 奖励系统 - 整合所有掉落物

import { type Quality, QUALITY_CONFIG } from './gems';
import { generateRandomGem, type GemDefinition } from './gems';
import { generateRandomEquipment, type EquipmentDefinition, type EquipmentSlot } from './equipment';
import { generateRandomCore, type CoreDefinition } from './cores';
import { generateRandomArmor, type ArmorDefinition } from './armors';
import { type Element } from './skills';
import stagesConfig from '@/config/stages.json';

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

// 获取关卡掉落概率
export function getStageDropRates(stageNumber: number, difficulty: 'normal' | 'elite'): Record<Quality, number> {
  const stageKey = String(stageNumber);
  const stage = (stagesConfig.stages as any)[stageKey];
  if (stage?.dropRates?.[difficulty]) {
    return stage.dropRates[difficulty];
  }
  // 默认概率
  return stagesConfig.stages['1'].dropRates[difficulty];
}

// 随机选择品质
function rollQuality(difficulty: 'normal' | 'elite', stageNumber: number): Quality {
  const weights = getStageDropRates(stageNumber, difficulty);
  let random = Math.random() * 100;

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
  difficulty: 'normal' | 'elite',
  progressPercent: number,
  stageNumber: number
): RewardItem[] {
  const rewards: RewardItem[] = [];

  // 进度为0不给奖励
  if (progressPercent <= 0) return rewards;

  // 关卡基础奖励数量
  const baseRewardCount = difficulty === 'elite' ? 3 : 2;
  // 实际奖励 = 基础奖励数 * 进度百分比，向下取整
  const totalRewards = Math.floor(baseRewardCount * progressPercent / 100);

  for (let i = 0; i < totalRewards; i++) {
    const item = generateRandomReward(difficulty, stageNumber);
    rewards.push(item);
  }

  return rewards;
}

function generateRandomReward(difficulty: 'normal' | 'elite', stageNumber: number): RewardItem {
  const quality = rollQuality(difficulty, stageNumber);

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

  const qualityConfig = QUALITY_CONFIG[quality];
  const typeNames: Record<string, string> = {
    gem: '宝石',
    equipment: '装备',
  };

  return {
    id: `reward_${type}_${quality}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    quality,
    name: `${qualityConfig.name}${typeNames[type]}`,
    identified: true,
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
