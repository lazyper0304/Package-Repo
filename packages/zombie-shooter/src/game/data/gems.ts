// 宝石系统 - 按部位区分

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

// 品质配置
export const QUALITY_CONFIG: Record<Quality, {
  name: string;
  color: string;
  dropRate: Record<string, number>;
  gemSlots: number; // 装备孔位数
}> = {
  common: {
    name: '普通',
    color: '#9ca3af',
    dropRate: { normal: 0.5, elite: 0.35, hell: 0.2 },
    gemSlots: 1,
  },
  excellent: {
    name: '优秀',
    color: '#22c55e',
    dropRate: { normal: 0.3, elite: 0.3, hell: 0.25 },
    gemSlots: 2,
  },
  elite: {
    name: '精英',
    color: '#8b5cf6',
    dropRate: { normal: 0.15, elite: 0.25, hell: 0.3 },
    gemSlots: 3,
  },
  perfect: {
    name: '完美',
    color: '#3b82f6',
    dropRate: { normal: 0.04, elite: 0.08, hell: 0.18 },
    gemSlots: 4,
  },
  legendary: {
    name: '传说',
    color: '#f59e0b',
    dropRate: { normal: 0.009, elite: 0.018, hell: 0.05 },
    gemSlots: 5,
  },
  mythic: {
    name: '神话',
    color: '#ef4444',
    dropRate: { normal: 0.001, elite: 0.002, hell: 0.02 },
    gemSlots: 6,
  },
};

// 宝石词条定义
export const GEM_AFFIXES: Record<GemSlot, Record<Quality, GemAffix[]>> = {
  // 头盔
  helmet: {
    common: [
      { id: 'hit_rate_5', name: '命中率增加5%', description: '命中率+5%', value: 5, type: 'stat' },
      { id: 'invincible_1s', name: '血量低于30%时无敌1s', description: '血量<30%时获得1s无敌', value: 1, type: 'trigger' },
      { id: 'no_ammo_5', name: '5%概率不消耗子弹', description: '攻击5%概率不消耗子弹', value: 5, type: 'special' },
    ],
    excellent: [
      { id: 'hit_rate_10', name: '命中率增加10%', description: '命中率+10%', value: 10, type: 'stat' },
      { id: 'invincible_1s_40', name: '血量低于40%时无敌1s', description: '血量<40%时获得1s无敌', value: 1, type: 'trigger' },
      { id: 'no_ammo_10', name: '10%概率不消耗子弹', description: '攻击10%概率不消耗子弹', value: 10, type: 'special' },
    ],
    elite: [
      { id: 'hit_rate_15', name: '命中率增加15%', description: '命中率+15%', value: 15, type: 'stat' },
      { id: 'invincible_2s', name: '血量低于40%时无敌2s', description: '血量<40%时获得2s无敌', value: 2, type: 'trigger' },
      { id: 'no_ammo_15', name: '15%概率不消耗子弹', description: '攻击15%概率不消耗子弹', value: 15, type: 'special' },
    ],
    perfect: [
      { id: 'hit_rate_20', name: '命中率增加20%', description: '命中率+20%', value: 20, type: 'stat' },
      { id: 'invincible_3s', name: '血量低于40%时无敌3s', description: '血量<40%时获得3s无敌', value: 3, type: 'trigger' },
      { id: 'no_ammo_20', name: '20%概率不消耗子弹', description: '攻击20%概率不消耗子弹', value: 20, type: 'special' },
    ],
    legendary: [
      { id: 'hit_rate_25', name: '命中率增加25%', description: '命中率+25%', value: 25, type: 'stat' },
      { id: 'invincible_4s', name: '血量低于40%时无敌4s', description: '血量<40%时获得4s无敌', value: 4, type: 'trigger' },
      { id: 'no_ammo_25', name: '25%概率不消耗子弹', description: '攻击25%概率不消耗子弹', value: 25, type: 'special' },
    ],
    mythic: [
      { id: 'hit_rate_30', name: '命中率增加30%', description: '命中率+30%', value: 30, type: 'stat' },
      { id: 'invincible_5s', name: '血量低于40%时无敌5s', description: '血量<40%时获得5s无敌', value: 5, type: 'trigger' },
      { id: 'no_ammo_30', name: '30%概率不消耗子弹', description: '攻击30%概率不消耗子弹', value: 30, type: 'special' },
      { id: 'burn_extra_damage', name: '对燃烧敌人额外伤害', description: '对燃烧敌人额外造成最大生命值0.01%伤害', value: 0.01, type: 'special' },
    ],
  },

  // 盔甲
  armor: {
    common: [
      { id: 'wall_hp_200', name: '城墙血量增加200', description: '城墙血量+200', value: 200, type: 'stat' },
      { id: 'wall_counter_10', name: '10%概率反击', description: '受击时10%概率以2倍攻击反击', value: 10, type: 'trigger' },
      { id: 'wall_shield_100', name: '城墙增加100护盾', description: '城墙护盾+100', value: 100, type: 'stat' },
    ],
    excellent: [
      { id: 'wall_hp_400', name: '城墙血量增加400', description: '城墙血量+400', value: 400, type: 'stat' },
      { id: 'wall_counter_20', name: '20%概率反击', description: '受击时20%概率以2倍攻击反击', value: 20, type: 'trigger' },
      { id: 'wall_shield_200', name: '城墙增加200护盾', description: '城墙护盾+200', value: 200, type: 'stat' },
    ],
    elite: [
      { id: 'wall_hp_600', name: '城墙血量增加600', description: '城墙血量+600', value: 600, type: 'stat' },
      { id: 'wall_counter_30', name: '30%概率反击', description: '受击时30%概率以2倍攻击反击', value: 30, type: 'trigger' },
      { id: 'wall_shield_300', name: '城墙增加300护盾', description: '城墙护盾+300', value: 300, type: 'stat' },
    ],
    perfect: [
      { id: 'wall_hp_800', name: '城墙血量增加800', description: '城墙血量+800', value: 800, type: 'stat' },
      { id: 'wall_counter_40', name: '40%概率反击', description: '受击时40%概率以2倍攻击反击', value: 40, type: 'trigger' },
      { id: 'wall_shield_400', name: '城墙增加400护盾', description: '城墙护盾+400', value: 400, type: 'stat' },
    ],
    legendary: [
      { id: 'wall_hp_1000', name: '城墙血量增加1000', description: '城墙血量+1000', value: 1000, type: 'stat' },
      { id: 'wall_counter_50', name: '50%概率反击', description: '受击时50%概率以3倍攻击反击', value: 50, type: 'trigger' },
      { id: 'wall_shield_500', name: '城墙增加500护盾', description: '城墙护盾+500', value: 500, type: 'stat' },
    ],
    mythic: [
      { id: 'wall_hp_1200', name: '城墙血量增加1200', description: '城墙血量+1200', value: 1200, type: 'stat' },
      { id: 'wall_counter_60', name: '60%概率反击', description: '受击时60%概率以4倍攻击反击', value: 60, type: 'trigger' },
      { id: 'wall_shield_600', name: '城墙增加600护盾', description: '城墙护盾+600', value: 600, type: 'stat' },
      { id: 'wall_regen_shield', name: '城墙修复护盾', description: '城墙每30s修复10%最大护盾', value: 10, type: 'special' },
    ],
  },

  // 肩甲
  shoulder: {
    common: [
      { id: 'attack_20', name: '攻击增加20', description: '攻击+20', value: 20, type: 'stat' },
      { id: 'attack_random', name: '攻击随机增幅', description: '攻击随机增幅-20%-30%', value: 30, type: 'special' },
      { id: 'bleed_1', name: '1%概率流血', description: '攻击1%概率造成流血', value: 1, type: 'trigger' },
    ],
    excellent: [
      { id: 'attack_40', name: '攻击增加40', description: '攻击+40', value: 40, type: 'stat' },
      { id: 'attack_random_40', name: '攻击随机增幅', description: '攻击随机增幅-20%-40%', value: 40, type: 'special' },
      { id: 'bleed_2', name: '2%概率流血', description: '攻击2%概率造成流血', value: 2, type: 'trigger' },
    ],
    elite: [
      { id: 'attack_60', name: '攻击增加60', description: '攻击+60', value: 60, type: 'stat' },
      { id: 'attack_random_50', name: '攻击随机增幅', description: '攻击随机增幅-20%-50%', value: 50, type: 'special' },
      { id: 'bleed_3', name: '3%概率流血', description: '攻击3%概率造成流血', value: 3, type: 'trigger' },
    ],
    perfect: [
      { id: 'attack_80', name: '攻击增加80', description: '攻击+80', value: 80, type: 'stat' },
      { id: 'attack_random_60', name: '攻击随机增幅', description: '攻击随机增幅-20%-60%', value: 60, type: 'special' },
      { id: 'bleed_4', name: '4%概率流血', description: '攻击4%概率造成流血', value: 4, type: 'trigger' },
    ],
    legendary: [
      { id: 'attack_100', name: '攻击增加100', description: '攻击+100', value: 100, type: 'stat' },
      { id: 'attack_random_70', name: '攻击随机增幅', description: '攻击随机增幅-20%-70%', value: 70, type: 'special' },
      { id: 'bleed_5', name: '5%概率流血', description: '攻击5%概率造成流血', value: 5, type: 'trigger' },
      { id: 'instant_kill_1', name: '1%概率秒杀', description: '攻击1%概率秒杀敌人', value: 1, type: 'trigger' },
    ],
    mythic: [
      { id: 'attack_120', name: '攻击增加120', description: '攻击+120', value: 120, type: 'stat' },
      { id: 'attack_random_70', name: '攻击随机增幅', description: '攻击随机增幅-20%-70%', value: 70, type: 'special' },
      { id: 'bleed_6', name: '6%概率流血', description: '攻击6%概率造成流血', value: 6, type: 'trigger' },
      { id: 'instant_kill_2', name: '2%概率秒杀', description: '攻击2%概率秒杀敌人', value: 2, type: 'trigger' },
      { id: 'lifesteal_wall', name: '吸血恢复城墙', description: '攻击2%概率吸取40%伤害恢复城墙', value: 40, type: 'special' },
    ],
  },

  // 腿甲
  legs: {
    common: [
      { id: 'crit_rate_5', name: '暴击率增加5%', description: '暴击率+5%', value: 5, type: 'stat' },
      { id: 'crit_damage_10', name: '暴击伤害增幅10%', description: '暴击伤害+10%', value: 10, type: 'stat' },
      { id: 'stun_1', name: '1%概率眩晕', description: '暴击时1%概率眩晕', value: 1, type: 'trigger' },
    ],
    excellent: [
      { id: 'crit_rate_10', name: '暴击率增加10%', description: '暴击率+10%', value: 10, type: 'stat' },
      { id: 'crit_damage_20', name: '暴击伤害增幅20%', description: '暴击伤害+20%', value: 20, type: 'stat' },
      { id: 'stun_2', name: '2%概率眩晕', description: '暴击时2%概率眩晕', value: 2, type: 'trigger' },
    ],
    elite: [
      { id: 'crit_rate_15', name: '暴击率增加15%', description: '暴击率+15%', value: 15, type: 'stat' },
      { id: 'crit_damage_30', name: '暴击伤害增幅30%', description: '暴击伤害+30%', value: 30, type: 'stat' },
      { id: 'stun_3', name: '3%概率眩晕', description: '暴击时3%概率眩晕', value: 3, type: 'trigger' },
    ],
    perfect: [
      { id: 'crit_rate_20', name: '暴击率增加20%', description: '暴击率+20%', value: 20, type: 'stat' },
      { id: 'crit_damage_40', name: '暴击伤害增幅40%', description: '暴击伤害+40%', value: 40, type: 'stat' },
      { id: 'stun_4', name: '4%概率眩晕', description: '暴击时4%概率眩晕', value: 4, type: 'trigger' },
    ],
    legendary: [
      { id: 'crit_rate_30', name: '暴击率增加30%', description: '暴击率+30%', value: 30, type: 'stat' },
      { id: 'crit_damage_50', name: '暴击伤害增幅50%', description: '暴击伤害+50%', value: 50, type: 'stat' },
      { id: 'stun_5', name: '5%概率眩晕', description: '暴击时5%概率眩晕', value: 5, type: 'trigger' },
    ],
    mythic: [
      { id: 'crit_rate_40', name: '暴击率增加40%', description: '暴击率+40%', value: 40, type: 'stat' },
      { id: 'crit_damage_60', name: '暴击伤害增幅60%', description: '暴击伤害+60%', value: 60, type: 'stat' },
      { id: 'stun_6', name: '6%概率眩晕', description: '暴击时6%概率眩晕', value: 6, type: 'trigger' },
      { id: 'freeze_extra_damage', name: '对冰冻敌人额外伤害', description: '对冰冻敌人额外造成最大生命值0.01%伤害', value: 0.01, type: 'special' },
    ],
  },

  // 战靴
  boots: {
    common: [
      { id: 'dodge_5', name: '闪避率增加5%', description: '闪避率+5%', value: 5, type: 'stat' },
      { id: 'teleport_1', name: '1%概率传送敌人', description: '伤害时1%概率传送敌人回起点', value: 1, type: 'trigger' },
      { id: 'slow_1', name: '1%概率减速', description: '攻击时1%概率减速50%', value: 1, type: 'trigger' },
    ],
    excellent: [
      { id: 'dodge_10', name: '闪避率增加10%', description: '闪避率+10%', value: 10, type: 'stat' },
      { id: 'teleport_2', name: '2%概率传送敌人', description: '伤害时2%概率传送敌人回起点', value: 2, type: 'trigger' },
      { id: 'slow_2', name: '2%概率减速', description: '攻击时2%概率减速50%', value: 2, type: 'trigger' },
    ],
    elite: [
      { id: 'dodge_15', name: '闪避率增加15%', description: '闪避率+15%', value: 15, type: 'stat' },
      { id: 'teleport_3', name: '3%概率传送敌人', description: '伤害时3%概率传送敌人回起点', value: 3, type: 'trigger' },
      { id: 'slow_3', name: '3%概率减速', description: '攻击时3%概率减速50%', value: 3, type: 'trigger' },
    ],
    perfect: [
      { id: 'dodge_20', name: '闪避率增加20%', description: '闪避率+20%', value: 20, type: 'stat' },
      { id: 'teleport_4', name: '4%概率传送敌人', description: '伤害时4%概率传送敌人回起点', value: 4, type: 'trigger' },
      { id: 'slow_4', name: '4%概率减速', description: '攻击时4%概率减速50%', value: 4, type: 'trigger' },
    ],
    legendary: [
      { id: 'dodge_30', name: '闪避率增加30%', description: '闪避率+30%', value: 30, type: 'stat' },
      { id: 'teleport_5', name: '5%概率传送敌人', description: '伤害时5%概率传送敌人回起点', value: 5, type: 'trigger' },
      { id: 'slow_5', name: '5%概率减速60%', description: '攻击时5%概率减速60%', value: 5, type: 'trigger' },
    ],
    mythic: [
      { id: 'dodge_40', name: '闪避率增加40%', description: '闪避率+40%', value: 40, type: 'stat' },
      { id: 'teleport_6', name: '6%概率传送敌人', description: '伤害时6%概率传送敌人回起点', value: 6, type: 'trigger' },
      { id: 'slow_6', name: '6%概率减速70%', description: '攻击时6%概率减速70%', value: 6, type: 'trigger' },
      { id: 'paralyze_extra_damage', name: '对麻痹敌人额外伤害', description: '对麻痹敌人额外造成最大生命值0.01%伤害', value: 0.01, type: 'special' },
    ],
  },
};

// 生成随机宝石
export function generateRandomGem(slot: GemSlot, quality: Quality): GemDefinition {
  const affixes = GEM_AFFIXES[slot][quality];
  const selectedAffix = affixes[Math.floor(Math.random() * affixes.length)];

  return {
    id: `gem_${slot}_${quality}_${Date.now()}`,
    name: `${QUALITY_CONFIG[quality].name}${getSlotName(slot)}`,
    slot,
    quality,
    affixes: [selectedAffix],
  };
}

function getSlotName(slot: GemSlot): string {
  const names: Record<GemSlot, string> = {
    helmet: '头盔宝石',
    armor: '盔甲宝石',
    shoulder: '肩甲宝石',
    legs: '腿甲宝石',
    boots: '战靴宝石',
  };
  return names[slot];
}
