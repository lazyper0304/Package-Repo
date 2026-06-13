import { useState } from 'react'
import { Card, Text, Progress, IconButton, Badge } from '@radix-ui/themes'
import { MdPause, MdBarChart } from 'react-icons/md'
import { formatNumber } from '@/utils/format'
import { DamageChart } from '../DamageChart'
import { useMobile } from '@/hooks/useMobile'
import styles from './index.module.less'

interface HUDProps {
  waveNumber: number
  maxWave: number
  score: number
  level: number
  killCount: number
  wallHp: number
  wallMaxHp: number
  wallShield: number
  wallMaxShield: number
  ammo: number
  maxAmmo: number
  isReloading: boolean
  xp: number
  xpToNextLevel: number
  stageName: string
  currentStage: number
  timer: number
  gunLevel: number
  skills: {
    name: string
    element: string
    level: number
    icon: string
    cooldown: number
    remaining: number
    progress: number
    elementDamage: number
    baseDamage: number
    totalDamage: number
    elementUpgradeLevel: number
    effects: string[]
  }[]
  damageStats: { source: string; icon: string; damage: number; percentage: number }[]
  gunStats: {
    damage: number
    baseDamage: number
    equipDamage: number
    damageBonus: number
    randomBoostMin: number
    randomBoostMax: number
    burstCount: number
    rapidCount: number
    splitCount: number
    splitDamage: number
    critChance: number
    critMultiplier: number
    hasExplosive: boolean
    explosiveDamage: number
    hitRate: number
  }
  activeAffixes: { name: string; description: string; source: string }[]
  autoShoot: boolean
  onPause: () => void
  onShowDamageStats: () => void
  onToggleAutoShoot: () => void
}

export function HUD({
  waveNumber,
  maxWave,
  score,
  level,
  killCount,
  wallHp,
  wallMaxHp,
  wallShield,
  wallMaxShield,
  ammo,
  maxAmmo,
  isReloading,
  xp,
  xpToNextLevel,
  stageName,
  currentStage,
  timer,
  gunLevel,
  skills,
  damageStats,
  gunStats,
  activeAffixes,
  autoShoot,
  onPause,
  onShowDamageStats,
  onToggleAutoShoot,
}: HUDProps) {
  const isMobile = useMobile()
  const [showDamageStats, setShowDamageStats] = useState(false)
  const [showGunStats, setShowGunStats] = useState(false)
  const [showAffixes, setShowAffixes] = useState(false)
  const [showSkillDetail, setShowSkillDetail] = useState<string | null>(null)
  const wallHpPercent = Math.max(0, Math.min(100, (wallHp / wallMaxHp) * 100))
  const wallShieldPercent = wallMaxShield > 0 ? Math.max(0, Math.min(100, (wallShield / wallMaxShield) * 100)) : 0
  const xpPercent = Math.max(0, Math.min(100, (xp / xpToNextLevel) * 100))

  // 格式化时间
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.hud}>
      {/* 顶部栏 */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <IconButton variant='soft' size='2' radius='full' onClick={onPause} className={styles.pauseBtn}>
            <MdPause size={16} />
          </IconButton>
        </div>

        <div className={styles.topCenter}>
          <Text size='3' weight='bold'>
            {currentStage}. {stageName}
          </Text>
          <Text size='1' color='gray' style={{ marginTop: 2 }}>
            {formatTime(timer)}
          </Text>
        </div>

        <div className={styles.topRight}>
          <Text size='2' style={{
            fontFamily: 'PixelFont',
            color: killCount >= 300 ? '#ef4444' : killCount >= 100 ? '#fbbf24' : '#ffffff'
          }}>{killCount}人斩</Text>
        </div>
      </div>

      {/* 城墙血量显示 - 右侧 */}
      <div className={styles.wallHpSection}>
        <Text size='2' weight='bold' color='red' style={{ fontFamily: 'PixelFont' }}>
          ❤️ {Math.round(wallHp)}
        </Text>
        <Text size='2' weight='bold' color='blue' style={{ fontFamily: 'PixelFont' }}>
          🛡️ {Math.round(wallShield)}
        </Text>
      </div>

      {/* 经验条和波次信息 */}
      <div className={styles.xpBarSection}>
        <div className={styles.xpBar}>
          <Text size='1'>Lv.{level}</Text>
          <Progress value={Math.min(100, Math.max(0, (xp / xpToNextLevel) * 100))} size='2' />
        </div>
        <div className={styles.waveInfo}>
          <Text size='1' color='gray'>
            波次: {waveNumber}/{maxWave}
          </Text>
        </div>
      </div>

      {/* 左侧 - 技能和伤害统计 */}
      <div className={styles.leftSide}>
        <div className={styles.damageStatsWrapper}>
          <IconButton variant='soft' size='2' onClick={() => setShowDamageStats(!showDamageStats)}>
            <MdBarChart size={18} />
          </IconButton>
          {showDamageStats && (
            <div className={styles.damageStatsPanel}>
              <Text size='2' weight='bold' style={{ marginBottom: 8 }}>
                伤害统计
              </Text>
              <DamageChart stats={damageStats} />
            </div>
          )}
        </div>
        {/* 词条属性 */}
        {activeAffixes.length > 0 && (
          <div className={styles.affixesWrapper}>
            <IconButton variant='soft' size='2' onClick={() => setShowAffixes(!showAffixes)}>
              <Text size='1'>📜</Text>
            </IconButton>
            {showAffixes && (
              <div className={styles.affixesPanel}>
                <Text size='2' weight='bold' style={{ marginBottom: 8 }}>
                  生效词条 ({activeAffixes.length})
                </Text>
                {activeAffixes.map((affix, i) => (
                  <div key={i} className={styles.affixItem}>
                    <Text size='1' weight='bold'>{affix.name}</Text>
                    <Text size='1' color='gray'>{affix.description}</Text>
                    <Text size='1' color='gray' style={{ fontSize: 10 }}>[{affix.source}]</Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 技能显示 */}
        {skills.map((skill, index) => {
          const progress = Math.max(0, Math.min(100, skill.progress || 0))
          const circumference = 2 * Math.PI * 16
          const dashLength = (progress / 100) * circumference
          const gapLength = circumference - dashLength
          const isShowing = showSkillDetail === skill.element
          return (
            <div
              key={`${skill.name}-${index}`}
              className={styles.skillSlot}
              onClick={() => setShowSkillDetail(isShowing ? null : skill.element)}
            >
              <div className={styles.skillCircle}>
                <svg className={styles.cooldownRing} viewBox='0 0 36 36'>
                  <circle cx='18' cy='18' r='16' fill='none' stroke='rgba(255,255,255,0.2)' strokeWidth='2' />
                  <circle
                    cx='18'
                    cy='18'
                    r='16'
                    fill='none'
                    stroke={progress <= 0 ? '#22c55e' : '#f59e0b'}
                    strokeWidth='2'
                    strokeDasharray={`${dashLength} ${gapLength}`}
                    strokeDashoffset='0'
                    strokeLinecap='round'
                    transform='rotate(-90 18 18)'
                  />
                </svg>
                <Text size='1'>{skill.icon}</Text>
                <div className={styles.skillLevel}>
                  <Text size='1'>{skill.level}</Text>
                </div>
              </div>
              {isShowing && (
                <div className={styles.skillDetailPanel}>
                  <Text size='2' weight='bold'>{skill.name}</Text>
                  <Text size='1' color='gray'>等级: {skill.level}</Text>
                  <Text size='1'>基础伤害: {Math.round(skill.baseDamage)}</Text>
                  <Text size='1' color={skill.elementUpgradeLevel > 0 ? 'orange' : 'gray'}>
                    元素增幅: +{skill.elementUpgradeLevel * 60}%
                  </Text>
                  {skill.elementDamage > 0 && (
                    <Text size='1' color='green'>元素加成: +{Math.round(skill.elementDamage)}</Text>
                  )}
                  <Text size='1' weight='bold'>最终伤害: {Math.round(skill.totalDamage)}</Text>
                  <Text size='1' color='gray'>冷却: {skill.cooldown / 1000}s</Text>
                  {skill.effects && skill.effects.length > 0 && (
                    <>
                      <Text size='1' weight='bold' style={{ marginTop: 4 }}>技能效果:</Text>
                      {skill.effects.map((effect: string, i: number) => (
                        <Text key={i} size='1'>· {effect}</Text>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 右侧 - 枪械卡片 */}
      <div className={styles.rightSide}>
        <div
          className={styles.gunCardWrapper}
          onMouseEnter={() => !isMobile && setShowGunStats(true)}
          onMouseLeave={() => !isMobile && setShowGunStats(false)}
        >
          {isMobile && (
            <div
              className={styles.gunStatsBtn}
              onClick={() => setShowGunStats(!showGunStats)}
            >
              <Text size='1'>属性</Text>
            </div>
          )}
          {showGunStats && (
            <div className={styles.gunStatsPanel}>
              <Text size='2' weight='bold' style={{ marginBottom: 4 }}>
                枪械属性
              </Text>
              <Text size='1'>
                伤害: {Math.round(gunStats.baseDamage)}
                {gunStats.equipDamage > 0 && <Text size='1' color='green'> (+{Math.round(gunStats.equipDamage)})</Text>}
              </Text>
              {gunStats.damageBonus > 0 && <Text size='1'>增幅: +{gunStats.damageBonus}%</Text>}
              {gunStats.randomBoostMax > 0 && (
                <Text size='1' color='orange'>随机增幅: {gunStats.randomBoostMin}%~+{gunStats.randomBoostMax}%</Text>
              )}
              {gunStats.randomBoostMax > 0 ? (
                <Text size='1'>最终伤害: {Math.round(gunStats.damage * (1 + gunStats.randomBoostMin / 100))}~{Math.round(gunStats.damage * (1 + gunStats.randomBoostMax / 100))}</Text>
              ) : (
                <Text size='1'>最终伤害: {Math.round(gunStats.damage)}</Text>
              )}
              <Text size='1'>齐射: {gunStats.burstCount}发</Text>
              <Text size='1'>连射: {gunStats.rapidCount}排</Text>
              <Text size='1'>分裂: {gunStats.splitCount}个</Text>
              {gunStats.splitCount > 0 && <Text size='1'>次级伤害: {gunStats.splitDamage}</Text>}
              <Text size='1'>命中率: {100 + gunStats.hitRate}%{gunStats.hitRate > 0 && <Text size='1' color='green'> (+{gunStats.hitRate}%)</Text>}</Text>
              <Text size='1'>暴击率: {Math.round(gunStats.critChance * 100)}%</Text>
              <Text size='1'>暴击增幅: {Math.round(gunStats.critMultiplier * 100)}%</Text>
              {gunStats.hasExplosive && (
                <Text size='1' color='orange'>爆炸伤害: {gunStats.explosiveDamage}</Text>
              )}
            </div>
          )}
          <div
            className={`${styles.gunCard} ${!autoShoot ? styles.gunCardDisabled : ''}`}
            onClick={onToggleAutoShoot}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.gunIcon}>🔫</div>
            <Text size='2' weight='bold'>
              Lv.{gunLevel}
            </Text>
            <div className={styles.ammoInfo}>
              {isReloading ? (
                <Text size='1' color='orange'>
                  换弹中
                </Text>
              ) : (
                <Text size='1'>
                  {ammo}/{maxAmmo}
                </Text>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
