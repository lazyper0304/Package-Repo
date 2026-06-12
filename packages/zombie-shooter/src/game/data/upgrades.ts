// 升级词条系统 - 参考设计文档

export type UpgradeCategory = 'gun' | 'skill' | 'element' | 'heal';

// 枪相关词条
export type GunUpgradeId =
  | 'gun_damage'        // 子弹增伤60%，最多600%
  | 'gun_burst'         // 齐射（垂直方向多增加子弹），最多3个
  | 'gun_rapid'         // 连射（水平方向多增加子弹），最多3个
  | 'gun_split_2'       // 命中后分裂2个子弹
  | 'gun_split_4'       // 命中后分裂4个子弹
  | 'gun_all_damage'    // 全子弹增幅100%，最多300%
  | 'gun_fire'          // 火元素子弹 - 燃烧3s，每秒30%攻击伤害
  | 'gun_ice'           // 冰元素子弹 - 冰冻1s
  | 'gun_thunder';      // 电元素子弹 - 麻痹1s（减速50%且无法攻击）

// 技能相关词条 - 风雷水火土（每个系3个技能：初始、进阶1、进阶2）
export type SkillUpgradeId =
  | 'skill_wind_1'      // 风咒 - 初始技能
  | 'skill_wind_2'      // 旋风斩 - 进阶1
  | 'skill_wind_3'      // 风卷残云 - 进阶2
  | 'skill_thunder_1'   // 雷咒 - 初始技能
  | 'skill_thunder_2'   // 惊雷术 - 进阶1
  | 'skill_thunder_3'   // 天雷空破 - 进阶2
  | 'skill_water_1'     // 冰咒 - 初始技能
  | 'skill_water_2'     // 寒冰破 - 进阶1
  | 'skill_water_3'     // 水漫金山 - 进阶2
  | 'skill_fire_1'      // 炎咒 - 初始技能
  | 'skill_fire_2'      // 爆炎弹 - 进阶1
  | 'skill_fire_3'      // 三味真火 - 进阶2
  | 'skill_earth_1'     // 土咒 - 初始技能
  | 'skill_earth_2'     // 飞岩术 - 进阶1
  | 'skill_earth_3';    // 泰山压顶 - 进阶2

// 元素伤害词条（当有对应系技能后出现，最多600%）
export type ElementDamageUpgradeId =
  | 'element_wind'      // 风系伤害 +60%
  | 'element_thunder'   // 雷系伤害 +60%
  | 'element_water'     // 水系伤害 +60%
  | 'element_fire'      // 火系伤害 +60%
  | 'element_earth';    // 土系伤害 +60%

// 回血词条
export type HealUpgradeId = 'heal_30';

export type UpgradeId = GunUpgradeId | SkillUpgradeId | ElementDamageUpgradeId | HealUpgradeId;

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  category: UpgradeCategory;
  icon: string;
  maxLevel: number;
  requires?: UpgradeId[];
  levelEffect: (level: number) => string;
}

// 技能系别映射
export const ELEMENT_SKILLS: Record<string, { initial: SkillUpgradeId; advanced1: SkillUpgradeId; advanced2: SkillUpgradeId; element: ElementDamageUpgradeId }> = {
  wind: {
    initial: 'skill_wind_1',
    advanced1: 'skill_wind_2',
    advanced2: 'skill_wind_3',
    element: 'element_wind',
  },
  thunder: {
    initial: 'skill_thunder_1',
    advanced1: 'skill_thunder_2',
    advanced2: 'skill_thunder_3',
    element: 'element_thunder',
  },
  water: {
    initial: 'skill_water_1',
    advanced1: 'skill_water_2',
    advanced2: 'skill_water_3',
    element: 'element_water',
  },
  fire: {
    initial: 'skill_fire_1',
    advanced1: 'skill_fire_2',
    advanced2: 'skill_fire_3',
    element: 'element_fire',
  },
  earth: {
    initial: 'skill_earth_1',
    advanced1: 'skill_earth_2',
    advanced2: 'skill_earth_3',
    element: 'element_earth',
  },
};

// 升级定义
export const UPGRADES: Record<UpgradeId, UpgradeDefinition> = {
  // 枪相关 - 增伤
  gun_damage: {
    id: 'gun_damage',
    name: '子弹增伤',
    description: '主子弹伤害 +60%',
    category: 'gun',
    icon: '🔫',
    maxLevel: 10,
    levelEffect: (level) => `主子弹伤害 +${level * 60}%`,
  },

  // 枪相关 - 齐射
  gun_burst: {
    id: 'gun_burst',
    name: '齐射',
    description: '扇形射出子弹，角度15°',
    category: 'gun',
    icon: '🎯',
    maxLevel: 2,
    levelEffect: (level) => `扇形 ${level === 1 ? '15°' : '30°'}，射出 ${level + 1} 发子弹`,
  },

  // 枪相关 - 连射
  gun_rapid: {
    id: 'gun_rapid',
    name: '连射',
    description: '连续射出多排子弹',
    category: 'gun',
    icon: '⚡',
    maxLevel: 2,
    levelEffect: (level) => `连续射出 ${level + 1} 排子弹`,
  },

  // 枪相关 - 分裂
  gun_split_2: {
    id: 'gun_split_2',
    name: '分裂弹',
    description: '命中后分裂2个子弹，继承50%伤害',
    category: 'gun',
    icon: '💥',
    maxLevel: 1,
    levelEffect: () => '命中后分裂2个子弹',
  },

  gun_split_4: {
    id: 'gun_split_4',
    name: '高级分裂弹',
    description: '命中后分裂4个子弹，继承50%伤害',
    category: 'gun',
    icon: '💫',
    maxLevel: 1,
    requires: ['gun_split_2'],
    levelEffect: () => '命中后分裂4个子弹',
  },

  // 枪相关 - 全子弹增幅
  gun_all_damage: {
    id: 'gun_all_damage',
    name: '全子弹增幅',
    description: '主子弹和分裂子弹伤害 +100%',
    category: 'gun',
    icon: '🔥',
    maxLevel: 3,
    requires: ['gun_split_2'],
    levelEffect: (level) => `所有子弹伤害 +${level * 100}%`,
  },

  // 枪相关 - 元素子弹
  gun_fire: {
    id: 'gun_fire',
    name: '火焰弹',
    description: '子弹附带燃烧效果，3s内每秒造成攻击30%伤害',
    category: 'gun',
    icon: '🔥',
    maxLevel: 1,
    levelEffect: () => '命中后燃烧3秒',
  },

  gun_ice: {
    id: 'gun_ice',
    name: '冰冻弹',
    description: '子弹附带冰冻效果，完全不能行动1s',
    category: 'gun',
    icon: '❄️',
    maxLevel: 1,
    levelEffect: () => '命中后冰冻1秒',
  },

  gun_thunder: {
    id: 'gun_thunder',
    name: '电击弹',
    description: '子弹附带麻痹效果，减速50%且无法攻击1s',
    category: 'gun',
    icon: '⚡',
    maxLevel: 1,
    levelEffect: () => '命中后麻痹1秒',
  },

  // ============ 技能相关 - 风系 ============
  skill_wind_1: {
    id: 'skill_wind_1',
    name: '风咒',
    description: '持续5秒的旋风，碰到敌人造成伤害',
    category: 'skill',
    icon: '🌪️',
    maxLevel: 1,
    levelEffect: () => '旋风持续5秒，每0.5秒检测碰撞',
  },
  skill_wind_2: {
    id: 'skill_wind_2',
    name: '旋风斩',
    description: '旋风碰到敌人分裂2个风刃，继承50%伤害',
    category: 'skill',
    icon: '🌀',
    maxLevel: 1,
    requires: ['skill_wind_1'],
    levelEffect: () => '碰撞时分裂2个风刃',
  },
  skill_wind_3: {
    id: 'skill_wind_3',
    name: '风卷残云',
    description: '旋风每碰到5个敌人分裂1个旋风，最多3个',
    category: 'skill',
    icon: '🌬️',
    maxLevel: 1,
    requires: ['skill_wind_2'],
    levelEffect: () => '每5次碰撞分裂新旋风',
  },

  // ============ 技能相关 - 雷系 ============
  skill_thunder_1: {
    id: 'skill_thunder_1',
    name: '雷咒',
    description: '随机雷罚1名敌人',
    category: 'skill',
    icon: '⚡',
    maxLevel: 1,
    levelEffect: () => '雷罚单体敌人',
  },
  skill_thunder_2: {
    id: 'skill_thunder_2',
    name: '惊雷术',
    description: '雷罚命中后分裂2道雷罚',
    category: 'skill',
    icon: '🌩️',
    maxLevel: 1,
    requires: ['skill_thunder_1'],
    levelEffect: () => '命中后分裂2道雷罚',
  },
  skill_thunder_3: {
    id: 'skill_thunder_3',
    name: '天雷空破',
    description: '雷罚命中后连续3记雷罚',
    category: 'skill',
    icon: '⛈️',
    maxLevel: 1,
    requires: ['skill_thunder_2'],
    levelEffect: () => '命中后连续3记雷罚',
  },

  // ============ 技能相关 - 水系 ============
  skill_water_1: {
    id: 'skill_water_1',
    name: '冰咒',
    description: '随机冰冻1名敌人',
    category: 'skill',
    icon: '💧',
    maxLevel: 1,
    levelEffect: () => '冰冻单体敌人',
  },
  skill_water_2: {
    id: 'skill_water_2',
    name: '寒冰破',
    description: '冰冻解除后造成冰暴伤害，波及临近敌人',
    category: 'skill',
    icon: '🧊',
    maxLevel: 1,
    requires: ['skill_water_1'],
    levelEffect: () => '冰冻结束时冰暴伤害',
  },
  skill_water_3: {
    id: 'skill_water_3',
    name: '水漫金山',
    description: '敌人受伤同时后退3个单位',
    category: 'skill',
    icon: '🌊',
    maxLevel: 1,
    requires: ['skill_water_2'],
    levelEffect: () => '敌人受伤同时后退3个单位',
  },

  // ============ 技能相关 - 火系 ============
  skill_fire_1: {
    id: 'skill_fire_1',
    name: '炎咒',
    description: '随机点燃1名敌人',
    category: 'skill',
    icon: '🔥',
    maxLevel: 1,
    levelEffect: () => '点燃单体敌人',
  },
  skill_fire_2: {
    id: 'skill_fire_2',
    name: '爆炎弹',
    description: '点燃同时击退1个单位',
    category: 'skill',
    icon: '💥',
    maxLevel: 1,
    requires: ['skill_fire_1'],
    levelEffect: () => '点燃同时击退',
  },
  skill_fire_3: {
    id: 'skill_fire_3',
    name: '三味真火',
    description: '附加3秒燃烧',
    category: 'skill',
    icon: '🌋',
    maxLevel: 1,
    requires: ['skill_fire_2'],
    levelEffect: () => '附加3秒燃烧',
  },

  // ============ 技能相关 - 土系 ============
  skill_earth_1: {
    id: 'skill_earth_1',
    name: '土咒',
    description: '随机击退1名敌人1个单位',
    category: 'skill',
    icon: '🪨',
    maxLevel: 1,
    levelEffect: () => '击退单体敌人',
  },
  skill_earth_2: {
    id: 'skill_earth_2',
    name: '飞岩术',
    description: '击退同时造成1秒眩晕',
    category: 'skill',
    icon: '⛰️',
    maxLevel: 1,
    requires: ['skill_earth_1'],
    levelEffect: () => '击退同时眩晕1秒',
  },
  skill_earth_3: {
    id: 'skill_earth_3',
    name: '泰山压顶',
    description: '眩晕增加到3秒',
    category: 'skill',
    icon: '🏔️',
    maxLevel: 1,
    requires: ['skill_earth_2'],
    levelEffect: () => '眩晕时间增加到3秒',
  },

  // ============ 元素伤害 ============
  element_wind: {
    id: 'element_wind',
    name: '风系伤害',
    description: '风系技能伤害 +60%',
    category: 'element',
    icon: '🌪️',
    maxLevel: 10,
    levelEffect: (level) => `风系伤害 +${level * 60}%`,
  },
  element_thunder: {
    id: 'element_thunder',
    name: '雷系伤害',
    description: '雷系技能伤害 +60%',
    category: 'element',
    icon: '⚡',
    maxLevel: 10,
    levelEffect: (level) => `雷系伤害 +${level * 60}%`,
  },
  element_water: {
    id: 'element_water',
    name: '水系伤害',
    description: '水系技能伤害 +60%',
    category: 'element',
    icon: '💧',
    maxLevel: 10,
    levelEffect: (level) => `水系伤害 +${level * 60}%`,
  },
  element_fire: {
    id: 'element_fire',
    name: '火系伤害',
    description: '火系技能伤害 +60%',
    category: 'element',
    icon: '🔥',
    maxLevel: 10,
    levelEffect: (level) => `火系伤害 +${level * 60}%`,
  },
  element_earth: {
    id: 'element_earth',
    name: '土系伤害',
    description: '土系技能伤害 +60%',
    category: 'element',
    icon: '🪨',
    maxLevel: 10,
    levelEffect: (level) => `土系伤害 +${level * 60}%`,
  },

  // 回血
  heal_30: {
    id: 'heal_30',
    name: '生命恢复',
    description: '恢复30%最大血量',
    category: 'heal',
    icon: '❤️',
    maxLevel: 99,
    levelEffect: () => '恢复30%生命值',
  },
};

// 获取玩家拥有的技能系别
export function getPlayerSkillElements(currentLevels: Record<UpgradeId, number>): string[] {
  const elements: string[] = [];
  for (const [element, skills] of Object.entries(ELEMENT_SKILLS)) {
    if ((currentLevels[skills.initial] || 0) > 0) {
      elements.push(element);
    }
  }
  return elements;
}

// 获取可用升级列表
export function getAvailableUpgrades(
  currentLevels: Record<UpgradeId, number>,
  playerHpPercent: number,
  hasSplit: boolean,
  activeSkills: string[]
): UpgradeDefinition[] {
  const available: UpgradeDefinition[] = [];

  for (const upgrade of Object.values(UPGRADES)) {
    const currentLevel = currentLevels[upgrade.id] || 0;

    // 已满级
    if (currentLevel >= upgrade.maxLevel) continue;

    // 检查前置条件
    if (upgrade.requires) {
      const hasAllRequires = upgrade.requires.every(req => (currentLevels[req] || 0) > 0);
      if (!hasAllRequires) continue;
    }

    // 回血只在掉血时出现
    if (upgrade.category === 'heal' && playerHpPercent >= 100) continue;

    // 元素子弹 - 互斥，只能选择一种
    if (upgrade.id === 'gun_fire' || upgrade.id === 'gun_ice' || upgrade.id === 'gun_thunder') {
      const hasAnyElement = (currentLevels['gun_fire'] || 0) > 0 ||
        (currentLevels['gun_ice'] || 0) > 0 ||
        (currentLevels['gun_thunder'] || 0) > 0;
      if (hasAnyElement) continue;
    }

    // 技能卡片逻辑
    if (upgrade.category === 'skill') {
      // 找到这个技能属于哪个系
      const skillElement = Object.entries(ELEMENT_SKILLS).find(([_, skills]) =>
        skills.initial === upgrade.id || skills.advanced1 === upgrade.id || skills.advanced2 === upgrade.id
      );

      if (skillElement) {
        const [element, skills] = skillElement;

        // 如果已有3个系的技能，且当前技能不属于已有的系，跳过
        if (activeSkills.length >= 3 && !activeSkills.includes(element)) continue;

        // 初始技能：只有当该系没有初始技能时才出现
        if (upgrade.id === skills.initial) {
          if ((currentLevels[skills.initial] || 0) > 0) continue;
        }

        // 进阶技能1：需要有初始技能
        if (upgrade.id === skills.advanced1) {
          if ((currentLevels[skills.initial] || 0) === 0) continue;
          if ((currentLevels[skills.advanced1] || 0) > 0) continue;
        }

        // 进阶技能2：需要有进阶技能1
        if (upgrade.id === skills.advanced2) {
          if ((currentLevels[skills.advanced1] || 0) === 0) continue;
          if ((currentLevels[skills.advanced2] || 0) > 0) continue;
        }
      }
    }

    // 元素伤害卡片：只有当玩家拥有对应系的技能时才出现
    if (upgrade.category === 'element') {
      const element = upgrade.id.replace('element_', '');
      if (!activeSkills.includes(element)) continue;
    }

    available.push(upgrade);
  }

  return available;
}

// 随机选择升级选项
export function getRandomUpgradeOptions(
  currentLevels: Record<UpgradeId, number>,
  playerHpPercent: number,
  activeSkills: string[],
  count: number = 3
): UpgradeDefinition[] {
  const hasSplit = (currentLevels['gun_split_2'] || 0) > 0;
  const available = getAvailableUpgrades(currentLevels, playerHpPercent, hasSplit, activeSkills);

  if (available.length === 0) return [];

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
