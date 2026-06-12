// 伤害系统

export type DamageType = 'physical' | 'elemental';
export type DamageModifier = 'normal' | 'critical' | 'explosive' | 'critical_explosive';

export interface DamageResult {
  baseDamage: number;
  elementDamage: number;
  finalDamage: number;
  isCritical: boolean;
  isExplosive: boolean;
  damageType: DamageType;
  hitRate: number;
  isHit: boolean;
}

// 计算伤害
export function calculateDamage(
  attack: number,
  elementDamage: number,
  critRate: number,
  critMultiplier: number,
  hitRate: number,
  enemyDodgeRate: number,
  enemyDefense: number,
  hasExplosive: boolean
): DamageResult {
  // 计算命中率
  const finalHitRate = Math.max(0, Math.min(1, hitRate - enemyDodgeRate));
  const isHit = Math.random() < finalHitRate;

  if (!isHit) {
    return {
      baseDamage: 0,
      elementDamage: 0,
      finalDamage: 0,
      isCritical: false,
      isExplosive: false,
      damageType: 'physical',
      hitRate: finalHitRate,
      isHit: false,
    };
  }

  // 计算暴击
  const isCritical = Math.random() < critRate;
  const critMultiplierValue = isCritical ? critMultiplier : 1;

  // 计算爆炸
  const isExplosive = hasExplosive && Math.random() < 0.3; // 爆炸触发概率
  const explosiveMultiplier = isExplosive ? 1.5 : 1;

  // 基础伤害 = 攻击力 - 防御力
  const baseDamage = Math.max(0, attack - enemyDefense);

  // 元素伤害（无视防御）
  const elementDmg = elementDamage;

  // 最终伤害 = (基础伤害 + 元素伤害) * 暴击倍率 * 爆炸倍率
  const finalDamage = Math.floor((baseDamage + elementDmg) * critMultiplierValue * explosiveMultiplier);

  return {
    baseDamage,
    elementDamage: elementDmg,
    finalDamage,
    isCritical,
    isExplosive,
    damageType: 'physical',
    hitRate: finalHitRate,
    isHit: true,
  };
}

// 计算爆炸范围伤害（波及临近3个单位）
export function getExplosiveTargets(
  primaryTarget: { x: number; y: number },
  allEnemies: { x: number; y: number; id: string }[],
  range: number = 50
): string[] {
  const targets: string[] = [];

  allEnemies.forEach(enemy => {
    const distance = Math.sqrt(
      Math.pow(enemy.x - primaryTarget.x, 2) +
      Math.pow(enemy.y - primaryTarget.y, 2)
    );

    if (distance <= range) {
      targets.push(enemy.id);
    }
  });

  return targets.slice(0, 3); // 最多波及3个
}

// 元素伤害来源
export interface ElementDamageSource {
  equipmentAffixes: number; // 装备词条提供的元素伤害
  skillLevelBonus: number; // 技能等级提供的元素伤害
  gemBonus: number; // 宝石提供的元素伤害
}

// 计算总元素伤害
export function calculateElementDamage(sources: ElementDamageSource): number {
  return sources.equipmentAffixes + sources.skillLevelBonus + sources.gemBonus;
}

// 伤害类型显示
export function getDamageTypeText(result: DamageResult): string {
  if (!result.isHit) return '闪避';
  if (result.isCritical && result.isExplosive) return '暴击爆炸';
  if (result.isCritical) return '暴击';
  if (result.isExplosive) return '爆炸';
  return '普通';
}

// 伤害颜色
export function getDamageColor(result: DamageResult): string {
  if (!result.isHit) return '#9ca3af';
  if (result.isCritical && result.isExplosive) return '#f59e0b';
  if (result.isCritical) return '#ef4444';
  if (result.isExplosive) return '#f97316';
  return '#ffffff';
}
