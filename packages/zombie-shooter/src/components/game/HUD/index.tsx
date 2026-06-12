import { useState } from 'react'
import { Card, Text, Progress, IconButton, Badge } from '@radix-ui/themes'
import { MdPause, MdBarChart } from 'react-icons/md'
import styles from './index.module.less'

// 格式化数字：1.1k, 1.1M, 1.1B
function formatNumber(num: number): string {
  if (num < 1000) return num.toString()
  if (num < 1000000) return (num / 1000).toFixed(1) + 'k'
  if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M'
  return (num / 1000000000).toFixed(1) + 'B'
}

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
  }[]
  damageStats: { source: string; icon: string; damage: number; percentage: number }[]
  gunStats: {
    damage: number
    damageBonus: number
    burstCount: number
    rapidCount: number
    splitCount: number
    splitDamage: number
    critChance: number
    critMultiplier: number
  }
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
  autoShoot,
  onPause,
  onShowDamageStats,
  onToggleAutoShoot,
}: HUDProps) {
  const [showDamageStats, setShowDamageStats] = useState(false)
  const [showGunStats, setShowGunStats] = useState(false)
  const [hoveredSkill, setHoveredSkill] = useState<number | null>(null)
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
      {/* 顶部栏 - 中间显示关卡 */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <IconButton variant='soft' size='2' radius='full' onClick={onPause} className={styles.pauseBtn}>
            <MdPause size={16} />
          </IconButton>
          <Text size='2' weight='bold'>
            {formatTime(timer)}
          </Text>
        </div>

        <div className={styles.topCenter}>
          <Text size='3' weight='bold'>
            {currentStage}. {stageName}
          </Text>
        </div>

        <div className={styles.topRight}>
          <Text size='2'>{killCount}人斩</Text>
        </div>
      </div>

      {/* 城墙血量显示 - 右侧 */}
      <div className={styles.wallHpSection}>
        <Text size='2' weight='bold' color='red'>
          ❤️ {Math.round(wallHp)}
        </Text>
        <Text size='2' weight='bold' color='blue'>
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
        <div
          className={styles.damageStatsWrapper}
          onMouseEnter={() => setShowDamageStats(true)}
          onMouseLeave={() => setShowDamageStats(false)}
        >
          <IconButton variant='soft' size='2'>
            <MdBarChart size={18} />
          </IconButton>
          {/* 伤害统计面板 - 横向柱状图 */}
          {showDamageStats && (
            <div className={styles.damageStatsPanel}>
              <Text size='2' weight='bold' style={{ marginBottom: 8 }}>
                伤害统计
              </Text>
              {damageStats.length > 0 ? (
                <div className={styles.damageChart}>
                  {damageStats.map((stat, index) => (
                    <div key={index} className={styles.damageChartItem}>
                      <div className={styles.damageBarHeader}>
                        <Text size='1'>{stat.icon}</Text>
                        <Text size='1'>{formatNumber(stat.damage)}</Text>
                      </div>
                      <div className={styles.damageBarContainer}>
                        <div className={styles.damageBar} style={{ width: `${stat.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <Text size='1' color='gray'>
                    暂无伤害数据
                  </Text>
                </div>
              )}
            </div>
          )}
        </div>
        {/* 技能显示 - 圆形带等级和冷却 */}
        {skills.map((skill, index) => {
          const progress = Math.max(0, Math.min(100, skill.progress || 0))
          const circumference = 2 * Math.PI * 16
          const dashLength = (progress / 100) * circumference
          const gapLength = circumference - dashLength
          return (
            <div
              key={`${skill.name}-${index}`}
              className={styles.skillSlot}
              onMouseEnter={() => setHoveredSkill(index)}
              onMouseLeave={() => setHoveredSkill(null)}
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
              {/* 技能信息悬浮窗 */}
              {hoveredSkill === index && (
                <div className={styles.skillTooltip}>
                  <Text size='2' weight='bold'>
                    {skill.name}
                  </Text>
                  <Text size='1'>等级: {skill.level}</Text>
                  <Text size='1'>元素伤害: +{Math.round(skill.elementDamage || 0)}</Text>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 右侧 - 枪械卡片 */}
      <div className={styles.rightSide}>
        <div
          className={`${styles.gunCard} ${!autoShoot ? styles.gunCardDisabled : ''}`}
          onClick={onToggleAutoShoot}
          onMouseEnter={() => setShowGunStats(true)}
          onMouseLeave={() => setShowGunStats(false)}
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
          {/* 枪械属性悬浮窗 */}
          {showGunStats && (
            <div className={styles.gunStatsPanel}>
              <Text size='2' weight='bold' style={{ marginBottom: 4 }}>
                枪械属性
              </Text>
              <Text size='1'>伤害: {Math.round(gunStats.damage)}</Text>
              <Text size='1'>增幅: +{gunStats.damageBonus}%</Text>
              <Text size='1'>齐射: {gunStats.burstCount}发</Text>
              <Text size='1'>连射: {gunStats.rapidCount}排</Text>
              <Text size='1'>分裂: {gunStats.splitCount}个</Text>
              {gunStats.splitCount > 0 && <Text size='1'>次级伤害: {gunStats.splitDamage}</Text>}
              <Text size='1'>暴击: {Math.round(gunStats.critChance * 100)}%</Text>
              <Text size='1'>暴伤: {gunStats.critMultiplier}x</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
