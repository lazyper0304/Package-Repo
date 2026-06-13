// 宝石系统 - 按部位区分

import gemsConfig from '@/config/gems.json';

export type Quality = 'common' | 'excellent' | 'elite' | 'perfect' | 'legendary' | 'mythic';
export type GemSlot = 'helmet' | 'armor' | 'shoulder' | 'legs' | 'boots';

export interface GemAffix {
  id: string;
  name: string;
  description: string;
  value: number;
  type: 'stat' | 'trigger' | 'special';
}

export interface GemDefinition {
  id: string;
  name: string;
  slot: GemSlot;
  quality: Quality;
  affixes: GemAffix[];
}

// 从 JSON 配置导出
export const QUALITY_CONFIG = gemsConfig.qualityConfig as Record<Quality, {
  name: string;
  color: string;
  dropRate: Record<string, number>;
  gemSlots: number;
}>;

export const GEM_AFFIXES = gemsConfig.affixes as Record<GemSlot, Record<Quality, GemAffix[]>>;

const SLOT_NAMES = gemsConfig.slotNames as Record<GemSlot, string>;

// 生成随机宝石
export function generateRandomGem(slot: GemSlot, quality: Quality): GemDefinition {
  const affixes = GEM_AFFIXES[slot][quality];
  const selectedAffix = affixes[Math.floor(Math.random() * affixes.length)];

  return {
    id: `gem_${slot}_${quality}_${Date.now()}`,
    name: `${QUALITY_CONFIG[quality].name}${SLOT_NAMES[slot]}`,
    slot,
    quality,
    affixes: [selectedAffix],
  };
}
