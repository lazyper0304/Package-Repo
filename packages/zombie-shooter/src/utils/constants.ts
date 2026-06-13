// 关卡名称 - 从 stages.json 读取
import stagesConfig from '@/config/stages.json';

export const stageNames: Record<number, string> = {};
for (const [key, stage] of Object.entries(stagesConfig.stages as Record<string, { name: string }>)) {
  stageNames[Number(key)] = stage.name;
}

// 枪械升级ID列表
export const gunUpgradeIds = [
  'gun_damage',
  'gun_burst',
  'gun_rapid',
  'gun_split_2',
  'gun_split_4',
  'gun_all_damage',
  'gun_fire',
  'gun_ice',
  'gun_thunder',
];
