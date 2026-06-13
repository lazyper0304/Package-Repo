import { useState } from 'react'
import { Text } from '@radix-ui/themes'
import type { RewardItem } from '@/game/data/rewards'
import type { Element, SkillLevel } from '@/game/data/skills'
import type { Quality } from '@/game/data/gems'
import type { ArmorTier } from '@/game/data/armors'
import { ELEMENT_NAMES, ELEMENT_COLORS, SKILLS } from '@/game/data/skills'
import { CORE_NAMES } from '@/game/data/cores'
import { ARMOR_NAMES, ARMOR_EFFECTS, ARMOR_QUALITY_TIER } from '@/game/data/armors'
import { QUALITY_CONFIG } from '@/game/data/gems'
import { SectionCard } from '../SectionCard'
import { HoverPopup } from '../HoverPopup'
import styles from './index.module.less'

interface CorePanelProps {
  cores: RewardItem[]
  armors: RewardItem[]
}

type TabType = 'cores' | 'armors'
const ELEMENTS: Element[] = ['wind', 'thunder', 'water', 'fire', 'earth']
const SKILL_LEVELS: SkillLevel[] = ['basic', 'advanced1', 'advanced2']
const ARMOR_TIERS: ArmorTier[] = ['basic', 'light', 'dark']
const QUALITIES: Quality[] = ['common', 'excellent', 'elite', 'perfect', 'legendary', 'mythic']

const SKILL_LEVEL_NAMES: Record<SkillLevel, string> = {
  basic: '初始',
  advanced1: '进阶1',
  advanced2: '进阶2',
}

const ARMOR_TIER_NAMES: Record<ArmorTier, string> = {
  basic: '基础',
  light: '圣光',
  dark: '暗黑',
}

export function CorePanel({ cores, armors }: CorePanelProps) {
  const [tab, setTab] = useState<TabType>('cores')
  const [elementFilter, setElementFilter] = useState<Element | 'all'>('all')

  const ownedCoreKeys = new Set(cores.map(c => {
    const d = c.data as any
    return `${d.element}_${d.skillLevel}`
  }))
  const ownedArmorKeys = new Set(armors.map(a => {
    const d = a.data as any
    return `${d.element}_${d.tier}`
  }))

  const filteredElements = elementFilter === 'all' ? ELEMENTS : [elementFilter]

  return (
    <div className={styles.corePanel}>
      <div className={styles.tabs}>
        <div
          className={`${styles.tab} ${tab === 'cores' ? styles.tabActive : ''}`}
          onClick={() => setTab('cores')}
        >
          💎 核心
        </div>
        <div
          className={`${styles.tab} ${tab === 'armors' ? styles.tabActive : ''}`}
          onClick={() => setTab('armors')}
        >
          🛡️ 装甲
        </div>
      </div>

      <div className={styles.elementFilter}>
        <div
          className={`${styles.elementTab} ${elementFilter === 'all' ? styles.elementTabActive : ''}`}
          onClick={() => setElementFilter('all')}
        >
          全部
        </div>
        {ELEMENTS.map(el => (
          <div
            key={el}
            className={`${styles.elementTab} ${elementFilter === el ? styles.elementTabActive : ''}`}
            style={elementFilter === el ? { background: ELEMENT_COLORS[el] } : undefined}
            onClick={() => setElementFilter(el)}
          >
            {ELEMENT_NAMES[el]}
          </div>
        ))}
      </div>

      {tab === 'cores' ? (
        <CoreList elements={filteredElements} ownedCoreKeys={ownedCoreKeys} />
      ) : (
        <ArmorList elements={filteredElements} ownedArmorKeys={ownedArmorKeys} />
      )}
    </div>
  )
}

function CoreList({ elements, ownedCoreKeys }: {
  elements: Element[]
  ownedCoreKeys: Set<string>
}) {
  return (
    <div className={styles.sectionList}>
      {elements.map(element => (
        <SectionCard
          key={element}
          title={`${ELEMENT_NAMES[element]}系核心`}
          extra={<Text size='1' style={{ color: ELEMENT_COLORS[element] }}>{ELEMENT_NAMES[element]}</Text>}
        >
          <div className={styles.itemGrid}>
            {SKILL_LEVELS.map(skillLevel => {
              const key = `${element}_${skillLevel}`
              const owned = ownedCoreKeys.has(key)
              const name = CORE_NAMES[element][skillLevel]
              const skillId = `${element}_${skillLevel}`
              const skill = SKILLS[skillId]

              return (
                <HoverPopup
                  key={key}
                  trigger={
                    <div className={`${styles.itemCard} ${owned ? styles.itemOwned : styles.itemLocked}`}>
                      <div className={styles.itemIcon}>💎</div>
                      <Text size='1' weight='bold' className={styles.itemName}>{name}</Text>
                      <Text size='1' color='gray' className={styles.itemSub}>
                        {skill ? skill.name : SKILL_LEVEL_NAMES[skillLevel]}
                      </Text>
                      {!owned && <div className={styles.lockOverlay}>未拥有</div>}
                    </div>
                  }
                >
                  <div className={styles.tooltip}>
                    <Text size='2' weight='bold' style={{ color: ELEMENT_COLORS[element] }}>{name}</Text>
                    <Text size='1' color='gray'>阶级: {SKILL_LEVEL_NAMES[skillLevel]}</Text>
                    {skill && (
                      <>
                        <div className={styles.tooltipDivider} />
                        <Text size='1' weight='bold'>提供技能: {skill.name}</Text>
                        <Text size='1'>{skill.description}</Text>
                        <Text size='1' color='gray'>冷却: {skill.cooldown / 1000}s</Text>
                      </>
                    )}
                    <div className={styles.tooltipDivider} />
                    <Text size='1' style={{ color: owned ? '#22c55e' : '#9ca3af' }}>
                      {owned ? '✓ 已拥有' : '未拥有'}
                    </Text>
                  </div>
                </HoverPopup>
              )
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}

function ArmorList({ elements, ownedArmorKeys }: {
  elements: Element[]
  ownedArmorKeys: Set<string>
}) {
  return (
    <div className={styles.sectionList}>
      {elements.map(element => (
        <SectionCard
          key={element}
          title={`${ELEMENT_NAMES[element]}系装甲`}
          extra={<Text size='1' style={{ color: ELEMENT_COLORS[element] }}>{ELEMENT_NAMES[element]}</Text>}
        >
          <div className={styles.itemGrid}>
            {ARMOR_TIERS.map(tier => {
              const key = `${element}_${tier}`
              const owned = ownedArmorKeys.has(key)
              const name = ARMOR_NAMES[element][tier]
              const effect = ARMOR_EFFECTS[element][tier]

              const matchingQualities = QUALITIES.filter(q => ARMOR_QUALITY_TIER[q] === tier)
              const qualityNames = matchingQualities.map(q => QUALITY_CONFIG[q].name).join('/')

              return (
                <HoverPopup
                  key={key}
                  trigger={
                    <div className={`${styles.itemCard} ${owned ? styles.itemOwned : styles.itemLocked}`}>
                      <div className={styles.itemIcon}>🛡️</div>
                      <Text size='1' weight='bold' className={styles.itemName}>{name}</Text>
                      <Text size='1' color='gray' className={styles.itemSub}>
                        {ARMOR_TIER_NAMES[tier]}
                      </Text>
                      {!owned && <div className={styles.lockOverlay}>未拥有</div>}
                    </div>
                  }
                >
                  <div className={styles.tooltip}>
                    <Text size='2' weight='bold' style={{ color: ELEMENT_COLORS[element] }}>{name}</Text>
                    <Text size='1' color='gray'>阶级: {ARMOR_TIER_NAMES[tier]}</Text>
                    <Text size='1' color='gray'>品质: {qualityNames}</Text>
                    <div className={styles.tooltipDivider} />
                    <Text size='1' weight='bold'>装甲效果:</Text>
                    <Text size='1'>{effect.description}</Text>
                    {effect.value !== undefined && <Text size='1' color='gray'>数值: {effect.value}{effect.type.includes('duration') || effect.type === 'skill_duration' ? 's' : '%'}</Text>}
                    {effect.duration !== undefined && <Text size='1' color='gray'>持续: {effect.duration / 1000}s</Text>}
                    {effect.chance !== undefined && <Text size='1' color='gray'>概率: {effect.chance}%</Text>}
                    <div className={styles.tooltipDivider} />
                    <Text size='1' style={{ color: owned ? '#22c55e' : '#9ca3af' }}>
                      {owned ? '✓ 已拥有' : '未拥有'}
                    </Text>
                  </div>
                </HoverPopup>
              )
            })}
          </div>
        </SectionCard>
      ))}
    </div>
  )
}
