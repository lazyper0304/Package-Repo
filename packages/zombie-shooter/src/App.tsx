import { useState, useCallback, useEffect, useRef } from 'react'
import { Theme, Text } from '@radix-ui/themes'
import { useLocalStorageState } from 'ahooks'
import { useMobile } from './hooks/useMobile'
import { gameBridge, type UpgradeOption } from './game/bridge'
import { setPendingGameData } from './game/PhaserGame'
import { generateRewards, identifyReward, type RewardItem } from './game/data/rewards'
import { refineAffix, ELEMENT_DAMAGE_RANGE } from './game/data/equipment'
import { type Currency } from './game/data/currency'
import { QUALITY_CONFIG, generateRandomGem, type Quality, type GemSlot } from './game/data/gems'
import { stageNames, gunUpgradeIds } from './utils/constants'
import { GradientBackground } from './components/website/GradientBackground'
import { Header } from './components/website/Header'
import { Footer } from './components/website/Footer'
import { GameContainer } from './components/game/GameContainer'
import { HUD } from './components/game/HUD'
import { UpgradePanel } from './components/game/UpgradePanel'
import { GameOverPanel } from './components/game/GameOverPanel'
import { PauseMenu } from './components/game/PauseMenu'
import { Lobby } from './components/game/Lobby'
import { ConfirmDialog } from './components/game/ConfirmDialog'
import { RefineDialog } from './components/game/RefineDialog'
import styles from './App.module.less'

type GamePhase = 'lobby' | 'loading' | 'playing' | 'upgrade' | 'gameover' | 'paused'

function App() {
  const isMobile = useMobile()

  // 固定深色主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
  }, [])

  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby')
  const [waveNumber, setWaveNumber] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [killCount, setKillCount] = useState(0)
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([])
  const [wallHp, setWallHp] = useState(200)
  const [wallMaxHp, setWallMaxHp] = useState(200)
  const [wallShield, setWallShield] = useState(0)
  const [wallMaxShield, setWallMaxShield] = useState(0)
  const [ammo, setAmmo] = useState(30)
  const [maxAmmo, setMaxAmmo] = useState(30)
  const [isReloading, setIsReloading] = useState(false)
  const [xp, setXp] = useState(0)
  const [xpToNextLevel, setXpToNextLevel] = useState(16)
  const [gameTime, setGameTime] = useState(0)
  const [currentStage, setCurrentStage] = useState(1) // 当前挑战的关卡
  const [activeSkills, setActiveSkills] = useState<
    {
      name: string
      element: string
      level: number
      icon: string
      cooldown: number
      remaining: number
      progress: number
      elementDamage: number
    }[]
  >([])
  const [gunLevel, setGunLevel] = useState(1) // 枪械等级，初始1级
  const [autoShoot, setAutoShoot] = useState(true) // 自动射击开关
  const [difficulty, setDifficulty] = useState<'normal' | 'elite'>('normal') // 难度
  const [damageStats, setDamageStats] = useState<
    { source: string; icon: string; damage: number; percentage: number }[]
  >([])
  const [gunStats, setGunStats] = useState({
    damage: 0,
    damageBonus: 0,
    burstCount: 1,
    rapidCount: 1,
    splitCount: 0,
    splitDamage: 0,
    critChance: 0,
    critMultiplier: 3,
  })
  const [lastSelectedStage, setLastSelectedStage] = useLocalStorageState<number>('zombie-shooter-last-stage', {
    defaultValue: 1,
  })

  // 持久化数据
  const [bestScore, setBestScore] = useLocalStorageState<number>('zombie-shooter-best', {
    defaultValue: 0,
  })

  const [maxWave, setMaxWave] = useLocalStorageState<number>('zombie-shooter-max-wave', {
    defaultValue: 0,
  })

  const [currency, setCurrency] = useLocalStorageState<Currency>('zombie-shooter-currency', {
    defaultValue: { copper: 0, silver: 0, gold: 0 },
  })

  const [inventory, setInventory] = useLocalStorageState<RewardItem[]>('zombie-shooter-inventory', {
    defaultValue: [],
  })

  const [cores, setCores] = useLocalStorageState<RewardItem[]>('zombie-shooter-cores', {
    defaultValue: [],
  })

  const [armors, setArmors] = useLocalStorageState<RewardItem[]>('zombie-shooter-armors', {
    defaultValue: [],
  })

  // 关卡通关记录 { stageNumber: hpPercent }
  const [stageRecords, setStageRecords] = useLocalStorageState<Record<number, number>>('zombie-shooter-stage-records', {
    defaultValue: {},
  })

  // 装备槽位
  const [equippedItems, setEquippedItems] = useLocalStorageState<Record<string, RewardItem | null>>('zombie-shooter-equipped', {
    defaultValue: {
      helmet: null,
      armor: null,
      shoulder: null,
      legs: null,
      boots: null,
    },
  })

  // 合成相关状态
  const [pendingMerge, setPendingMerge] = useState<{ gems: RewardItem[]; targetQuality: Quality; successRate: number } | null>(null)
  const [mergeResult, setMergeResult] = useState<{ success: boolean; gem?: RewardItem } | null>(null)

  // 生效词条列表
  const [activeAffixes, setActiveAffixes] = useState<{ name: string; description: string; source: string }[]>([])

  // 游戏场景就绪回调
  const handleGameReady = useCallback(() => {
    setGamePhase('playing');
  }, []);

  // 当前游戏奖励
  const [currentRewards, setCurrentRewards] = useState<RewardItem[]>([])
  const [clearCondition, setClearCondition] = useState<string>('cleared')
  const [gameCleared, setGameCleared] = useState(false)
  const [pendingEnchant, setPendingEnchant] = useState<{ gem: RewardItem; equipSlot: string; existingIndex: number } | null>(null)
  const [pendingEquip, setPendingEquip] = useState<{ item: RewardItem; slot: string } | null>(null)
  const [refiningState, setRefiningState] = useState<{
    item: RewardItem;
    affixIndex: number;
    refining: boolean;
    result?: { elementType: string; damage: number };
  } | null>(null)

  // Listen to game events
  useEffect(() => {
    const unsubs = [
      gameBridge.on('wave:started', (data: { waveNumber: number }) => {
        setWaveNumber(data.waveNumber)
      }),
      gameBridge.on('player:died', (data: { waveNumber: number; killCount: number; totalEnemies?: number; cleared: boolean; wallHp?: number; wallMaxHp?: number }) => {
        setWaveNumber(data.waveNumber)
        setKillCount(data.killCount)
        setGamePhase('gameover')
        if (score > bestScore) {
          setBestScore(score)
        }
        // 使用函数式更新确保获取最新值
        setMaxWave(prev => {
          const newMax = Math.max(prev || 0, data.waveNumber)
          return newMax
        })
        // 铜钱奖励：每个击杀10铜钱（无论是否通关）
        const copperReward = data.killCount * 10;
        setCurrency(prev => ({ ...prev, copper: (prev?.copper || 0) + copperReward }));
        // 根据击杀数/总敌人数计算进度
        const totalEnemies = data.totalEnemies || 400;
        const progress = data.cleared ? 100 : Math.min(100, Math.round((data.killCount / totalEnemies) * 100));
        const rewards = generateRewards('normal', progress, data.waveNumber)
        setCurrentRewards(rewards)
        setClearCondition(data.cleared ? 'cleared' : 'failed')
        // 通关时记录血量百分比（取最高记录）
        if (data.cleared) {
          const currentWallHp = data.wallHp ?? wallHp;
          const currentWallMaxHp = data.wallMaxHp ?? wallMaxHp;
          const hpPercent = Math.round((currentWallHp / currentWallMaxHp) * 100)
          setStageRecords(prev => {
            const prevRecord = prev[currentStage] || 0
            if (hpPercent > prevRecord) {
              return { ...prev, [currentStage]: hpPercent }
            }
            return prev
          })
        }
      }),
      gameBridge.on('score:changed', (data: { score: number }) => {
        setScore(data.score)
      }),
      gameBridge.on('xp:changed', (data: { xp: number; level: number }) => {
        setXp(data.xp)
        setLevel(data.level)
      }),
      gameBridge.on('game:time', (data: { time: number }) => {
        setGameTime(data.time)
      }),
      gameBridge.on('enemy:killed', () => {
        setKillCount((prev) => prev + 1)
      }),
      gameBridge.on('upgrade:options', (data: { options: UpgradeOption[] }) => {
        setUpgradeOptions(data.options)
        setGamePhase('upgrade')
      }),
      gameBridge.on('wall:hp-changed', (data: { hp: number; maxHp: number }) => {
        setWallHp(data.hp)
        setWallMaxHp(data.maxHp)
      }),
      gameBridge.on('wall:shield-changed', (data: { shield: number; maxShield: number }) => {
        setWallShield(data.shield)
        setWallMaxShield(data.maxShield)
      }),
      gameBridge.on('ammo:changed', (data: { ammo: number; maxAmmo: number; isReloading: boolean }) => {
        setAmmo(data.ammo)
        setMaxAmmo(data.maxAmmo)
        setIsReloading(data.isReloading)
      }),
      gameBridge.on(
        'skills:updated',
        (data: {
          skills: {
            name: string
            element: string
            level: number
            cooldown: number
            remaining: number
            progress: number
            elementDamage: number
            baseDamage: number
            elementUpgradeLevel: number
            effects: string[]
          }[]
        }) => {
          const skillIcons: Record<string, string> = {
            wind: '🌪️',
            thunder: '⚡',
            water: '💧',
            fire: '🔥',
            earth: '🪨',
          }
          const newSkills = data.skills.map((s) => ({
            name: s.name,
            element: s.element,
            level: s.level,
            icon: skillIcons[s.element] || '✨',
            cooldown: s.cooldown,
            remaining: s.remaining,
            progress: s.progress,
            elementDamage: s.elementDamage,
            baseDamage: s.baseDamage,
            totalDamage: s.totalDamage || s.baseDamage,
            elementUpgradeLevel: s.elementUpgradeLevel || 0,
            effects: s.effects || [],
          }))
          setActiveSkills((prev) => {
            if (prev.length !== newSkills.length) return newSkills
            for (let i = 0; i < prev.length; i++) {
              if (
                prev[i].progress !== newSkills[i].progress ||
                prev[i].level !== newSkills[i].level ||
                prev[i].name !== newSkills[i].name
              ) {
                return newSkills
              }
            }
            return prev
          })
        },
      ),
      gameBridge.on(
        'damage:stats',
        (data: { stats: { source: string; icon: string; damage: number; percentage: number }[] }) => {
          setDamageStats(data.stats)
        },
      ),
      gameBridge.on(
        'gun:stats',
        (data: {
          damage: number
          damageBonus: number
          burstCount: number
          rapidCount: number
          splitCount: number
          splitDamage: number
          critChance: number
          critMultiplier: number
        }) => {
          setGunStats(data)
        },
      ),
      gameBridge.on('affixes:updated', (data: { affixes: { name: string; description: string; source: string }[] }) => {
        setActiveAffixes(data.affixes)
      }),
    ]

    return () => unsubs.forEach((unsub) => unsub())
  }, [bestScore, score, setBestScore, maxWave, currentStage])

  const handleStartGame = useCallback(
    (startWave: number, difficulty: 'normal' | 'elite' = 'normal') => {
      setGamePhase('loading')
      setScore(0)
      setLevel(1)
      setKillCount(0)
      setWaveNumber(0)
      setWallHp(2000)
      setWallMaxHp(2000)
      setWallShield(0)
      setWallMaxShield(0)
      setAmmo(30)
      setMaxAmmo(30)
      setIsReloading(false)
      setXp(0)
      setXpToNextLevel(16)
      setGameTime(0)
      setCurrentStage(startWave)
      setLastSelectedStage(startWave)
      setActiveSkills([])
      setGunLevel(1)
      setDamageStats([])
      setDifficulty(difficulty)
      setGunStats({
        damage: 0,
        damageBonus: 0,
        burstCount: 1,
        rapidCount: 1,
        splitCount: 0,
        splitDamage: 0,
        critChance: 0,
        critMultiplier: 3,
      })

      // 计算装备属性加成和词条效果
      // 词条来源：宝石附魔、核心（预留）、装甲（预留）
      let bonusHp = 0;
      let bonusAttack = 0;
      const elementDamageByType: Record<string, number> = {};
      const affixEffects: Record<string, number> = {};

      // 装备基础属性
      Object.values(equippedItems || {}).forEach(item => {
        if (item?.data) {
          const data = item.data as any;
          bonusHp += data.hp || 0;
          bonusAttack += data.attack || 0;
          // 按元素类型累加元素伤害
          if (data.affixes) {
            data.affixes.forEach((affix: any) => {
              if (affix.elementType && affix.damage > 0) {
                elementDamageByType[affix.elementType] = (elementDamageByType[affix.elementType] || 0) + affix.damage;
              }
            });
          }
        }
        // 收集宝石词条效果
        const gems = (item?.data as any)?.enchantedGems || [];
        gems.forEach((gem: any) => {
          if (gem.data?.affixes) {
            gem.data.affixes.forEach((affix: any) => {
              affixEffects[affix.id] = (affixEffects[affix.id] || 0) + affix.value;
            });
          }
        });
        // TODO: 核心词条收集
        // TODO: 装甲词条收集
      });

      // 预计算词条效果
      // 城墙血量 = 基础2000 + 装备血量 + 城墙血量词条
      const wallHpBonus = (affixEffects['wall_hp_200'] || 0) + (affixEffects['wall_hp_400'] || 0) +
        (affixEffects['wall_hp_600'] || 0) + (affixEffects['wall_hp_800'] || 0) +
        (affixEffects['wall_hp_1000'] || 0) + (affixEffects['wall_hp_1200'] || 0);
      const wallMaxHp = 2000 + bonusHp + wallHpBonus;

      // 城墙护盾
      const wallShieldBonus = (affixEffects['wall_shield_100'] || 0) + (affixEffects['wall_shield_200'] || 0) +
        (affixEffects['wall_shield_300'] || 0) + (affixEffects['wall_shield_400'] || 0) +
        (affixEffects['wall_shield_500'] || 0) + (affixEffects['wall_shield_600'] || 0);

      // 命中率→暴击率
      const hitRateBonus = (affixEffects['hit_rate_5'] || 0) + (affixEffects['hit_rate_10'] || 0) +
        (affixEffects['hit_rate_15'] || 0) + (affixEffects['hit_rate_20'] || 0) +
        (affixEffects['hit_rate_25'] || 0) + (affixEffects['hit_rate_30'] || 0);

      // 攻击词条
      const attackBonus = (affixEffects['attack_20'] || 0) + (affixEffects['attack_40'] || 0) +
        (affixEffects['attack_60'] || 0) + (affixEffects['attack_80'] || 0) +
        (affixEffects['attack_100'] || 0) + (affixEffects['attack_120'] || 0);

      // 暴击伤害词条
      const critDamageBonus = (affixEffects['crit_damage_10'] || 0) + (affixEffects['crit_damage_20'] || 0) +
        (affixEffects['crit_damage_30'] || 0) + (affixEffects['crit_damage_40'] || 0) +
        (affixEffects['crit_damage_50'] || 0) + (affixEffects['crit_damage_60'] || 0);

      // 闪避率词条
      const dodgeBonus = (affixEffects['dodge_5'] || 0) + (affixEffects['dodge_10'] || 0) +
        (affixEffects['dodge_15'] || 0) + (affixEffects['dodge_20'] || 0) +
        (affixEffects['dodge_30'] || 0) + (affixEffects['dodge_40'] || 0);

      // 存储启动数据，GameScene 创建时会读取
      setPendingGameData({
        startWave, bonusHp, bonusAttack, affixEffects,
        wallMaxHp, wallShield: wallShieldBonus,
        playerCritChanceBonus: hitRateBonus / 100,
        playerCritDamageBonus: critDamageBonus / 100,
        playerDodgeRate: dodgeBonus / 100,
        playerAttackBonus: attackBonus,
        elementDamageByType,
        hitRateBonus: hitRateBonus,
      });
    },
    [setLastSelectedStage, equippedItems],
  )

  const handleRestart = useCallback(() => {
    setGamePhase('loading')
    setScore(0)
    setLevel(1)
    setKillCount(0)
    setWaveNumber(0)
    setWallHp(2000)
    setWallMaxHp(2000)
    setWallShield(0)
    setWallMaxShield(0)
    setAmmo(30)
    setMaxAmmo(30)
    setIsReloading(false)
    setXp(0)
    setXpToNextLevel(16)
    setGameTime(0)
    setCurrentRewards([])
    setActiveSkills([])
    setGunLevel(1)
    setDamageStats([])
    setGunStats({
      damage: 0,
      damageBonus: 0,
      burstCount: 1,
      rapidCount: 1,
      splitCount: 0,
      splitDamage: 0,
      critChance: 0,
      critMultiplier: 3,
    })

    // 重新收集装备数据
    let bonusHp = 0;
    let bonusAttack = 0;
    const affixEffects: Record<string, number> = {};
    Object.values(equippedItems || {}).forEach(item => {
      if (item?.data) {
        const data = item.data as any;
        bonusHp += data.hp || 0;
        bonusAttack += data.attack || 0;
      }
      const gems = (item?.data as any)?.enchantedGems || [];
      gems.forEach((gem: any) => {
        if (gem.data?.affixes) {
          gem.data.affixes.forEach((affix: any) => {
            affixEffects[affix.id] = (affixEffects[affix.id] || 0) + affix.value;
          });
        }
      });
    });

    const wallHpBonus = (affixEffects['wall_hp_200'] || 0) + (affixEffects['wall_hp_400'] || 0) +
      (affixEffects['wall_hp_600'] || 0) + (affixEffects['wall_hp_800'] || 0) +
      (affixEffects['wall_hp_1000'] || 0) + (affixEffects['wall_hp_1200'] || 0);
    const wallShieldBonus = (affixEffects['wall_shield_100'] || 0) + (affixEffects['wall_shield_200'] || 0) +
      (affixEffects['wall_shield_300'] || 0) + (affixEffects['wall_shield_400'] || 0) +
      (affixEffects['wall_shield_500'] || 0) + (affixEffects['wall_shield_600'] || 0);
    const hitRateBonus = (affixEffects['hit_rate_5'] || 0) + (affixEffects['hit_rate_10'] || 0) +
      (affixEffects['hit_rate_15'] || 0) + (affixEffects['hit_rate_20'] || 0) +
      (affixEffects['hit_rate_25'] || 0) + (affixEffects['hit_rate_30'] || 0);
    const attackBonus = (affixEffects['attack_20'] || 0) + (affixEffects['attack_40'] || 0) +
      (affixEffects['attack_60'] || 0) + (affixEffects['attack_80'] || 0) +
      (affixEffects['attack_100'] || 0) + (affixEffects['attack_120'] || 0);
    const critDamageBonus = (affixEffects['crit_damage_10'] || 0) + (affixEffects['crit_damage_20'] || 0) +
      (affixEffects['crit_damage_30'] || 0) + (affixEffects['crit_damage_40'] || 0) +
      (affixEffects['crit_damage_50'] || 0) + (affixEffects['crit_damage_60'] || 0);
    const dodgeBonus = (affixEffects['dodge_5'] || 0) + (affixEffects['dodge_10'] || 0) +
      (affixEffects['dodge_15'] || 0) + (affixEffects['dodge_20'] || 0) +
      (affixEffects['dodge_30'] || 0) + (affixEffects['dodge_40'] || 0);
    const wallMaxHp = 2000 + bonusHp + wallHpBonus;

    setPendingGameData({
      startWave: currentStage, bonusHp, bonusAttack, affixEffects,
      wallMaxHp, wallShield: wallShieldBonus,
      playerCritChanceBonus: hitRateBonus / 100,
      playerCritDamageBonus: critDamageBonus / 100,
      playerDodgeRate: dodgeBonus / 100,
      playerAttackBonus: attackBonus,
      elementDamageByType,
      hitRateBonus: hitRateBonus,
    });
    gameBridge.emit('game:restart')
  }, [equippedItems, currentStage])

  const [pendingBackToLobby, setPendingBackToLobby] = useState(false)

  const handleBackToLobby = useCallback(() => {
    // 如果已经结束（成功或失败），直接返回大厅
    if (gamePhase === 'gameover') {
      setGamePhase('lobby')
      gameBridge.emit('game:restart')
      setCurrentRewards([])
      return;
    }
    // 还在挑战中，弹出二次确认
    setPendingBackToLobby(true);
  }, [gamePhase])

  const handleConfirmBackToLobby = useCallback(() => {
    setPendingBackToLobby(false)
    // 根据击杀数计算进度
    const progress = Math.min(100, Math.round((killCount / 400) * 100))
    const rewards = generateRewards('normal', progress, waveNumber)
    setCurrentRewards(rewards)
    // 判断是否通关（击杀数足够多或波次到达20）
    const isCleared = waveNumber >= 20 && progress >= 90
    setClearCondition(isCleared ? 'cleared' : 'failed')
    setGamePhase('gameover')
    gameBridge.emit('game:pause')
  }, [waveNumber, killCount])

  // 装备/宝石操作回调
  const handleRefine = useCallback((item: RewardItem, affixIndex: number) => {
    if (item.type !== 'equipment' || !item.data) return;
    // 只打开洗练窗口，不立即洗练
    setRefiningState({ item, affixIndex, refining: false });
  }, []);

  const handleDoRefine = useCallback(() => {
    if (!refiningState) return;
    const { item, affixIndex } = refiningState;
    const equipData = item.data as any;
    const cost = equipData.refineCost || 100;
    const currentCopper = currency?.copper || 0;
    if (currentCopper < cost) return; // 铜钱不足

    // 扣除铜钱
    setCurrency(prev => ({ ...prev, copper: (prev?.copper || 0) - cost }));

    // 开始洗练动画
    setRefiningState(prev => prev ? { ...prev, refining: true, result: undefined } : null);

    // 动画结束后显示结果
    setTimeout(() => {
      const updatedData = refineAffix(equipData, affixIndex);
      const newAffix = updatedData.affixes[affixIndex];
      const updatedItem = { ...item, data: updatedData };

      setInventory(prev => {
        const found = prev.find(i => i.id === item.id);
        if (found) return prev.map(i => i.id === item.id ? updatedItem : i);
        return prev;
      });
      setEquippedItems(prev => {
        const updated = { ...prev };
        for (const slot of Object.keys(updated)) {
          if (updated[slot]?.id === item.id) {
            updated[slot] = updatedItem;
          }
        }
        return updated;
      });

      setRefiningState({ item: updatedItem, affixIndex, refining: false, result: { elementType: newAffix.elementType, damage: newAffix.damage } });
    }, 1500);
  }, [refiningState, currency, setCurrency, setInventory, setEquippedItems]);

  const handleCloseRefine = useCallback(() => {
    setRefiningState(null);
  }, []);

  const handleEnchant = useCallback((gem: RewardItem, equipSlot: string) => {
    const equipped = equippedItems?.[equipSlot];
    if (!equipped) return;

    const quality = (equipped.data as any)?.quality || 'common';
    const maxSlots = QUALITY_CONFIG[quality]?.gemSlots || 1;
    const currentGems = (equipped.data as any)?.enchantedGems || [];

    // 检查是否已有同类型宝石（同部位同类型替换）
    const gemAffixId = (gem.data as any)?.affixes?.[0]?.id;
    const existingIndex = currentGems.findIndex((g: any) =>
      g.data?.affixes?.[0]?.id === gemAffixId
    );

    if (existingIndex >= 0) {
      // 同类型宝石，设置待替换状态
      setPendingEnchant({ gem, equipSlot, existingIndex });
    } else {
      // 新类型宝石
      if (currentGems.length >= maxSlots) return;
      doEnchant(gem, equipSlot, -1);
    }
  }, [equippedItems]);

  const doEnchant = useCallback((gem: RewardItem, equipSlot: string, replaceIndex: number) => {
    const equipped = equippedItems?.[equipSlot];
    if (!equipped) return;

    const currentGems = (equipped.data as any)?.enchantedGems || [];
    let updatedGems;

    if (replaceIndex >= 0) {
      // 替换已有宝石
      updatedGems = [...currentGems];
      const replacedGem = currentGems[replaceIndex];
      updatedGems[replaceIndex] = gem;
      setInventory(prev => [...prev.filter(i => i.id !== gem.id), replacedGem]);
    } else {
      // 新增宝石
      updatedGems = [...currentGems, gem];
      setInventory(prev => prev.filter(i => i.id !== gem.id));
    }

    const updatedEquipment = {
      ...equipped,
      data: {
        ...equipped.data,
        enchantedGems: updatedGems,
      },
    };

    setEquippedItems(prev => ({
      ...prev,
      [equipSlot]: updatedEquipment,
    }));
  }, [equippedItems, setEquippedItems, setInventory]);

  const handleUnenchant = useCallback((equipSlot: string, gemIndex: number) => {
    const equipped = equippedItems?.[equipSlot];
    if (!equipped) return;

    const currentGems = (equipped.data as any)?.enchantedGems || [];
    if (gemIndex >= currentGems.length) return;

    const removedGem = currentGems[gemIndex];
    const updatedGems = currentGems.filter((_: any, i: number) => i !== gemIndex);

    const updatedEquipment = {
      ...equipped,
      data: {
        ...equipped.data,
        enchantedGems: updatedGems,
      },
    };

    setEquippedItems(prev => ({
      ...prev,
      [equipSlot]: updatedEquipment,
    }));

    setInventory(prev => [...prev, removedGem]);
  }, [equippedItems, setEquippedItems, setInventory]);

  const handleEquip = useCallback((item: RewardItem, slot: string) => {
    const currentEquipped = equippedItems?.[slot];
    if (currentEquipped) {
      // 已有装备，弹出替换确认
      setPendingEquip({ item, slot });
    } else {
      // 空槽位，直接装备
      setEquippedItems(prev => ({ ...prev, [slot]: item }));
      setInventory(prev => prev.filter(i => i.id !== item.id));
    }
  }, [equippedItems, setEquippedItems, setInventory]);

  const handleConfirmEquip = useCallback(() => {
    if (!pendingEquip) return;
    const { item, slot } = pendingEquip;
    const oldItem = equippedItems?.[slot];

    setEquippedItems(prev => ({ ...prev, [slot]: item }));
    setInventory(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      return oldItem ? [...filtered, oldItem] : filtered;
    });
    setPendingEquip(null);
  }, [pendingEquip, equippedItems, setEquippedItems, setInventory]);

  const handleCancelEquip = useCallback(() => {
    setPendingEquip(null);
  }, []);

  const handleUnequip = useCallback((slot: string) => {
    const item = equippedItems?.[slot];
    if (item) {
      // 将装备放回背包
      setInventory(prev => [...prev, item]);
      setEquippedItems(prev => ({
        ...prev,
        [slot]: null,
      }));
    }
  }, [equippedItems, setEquippedItems, setInventory]);

  // 品质进阶映射
  const QUALITY_NEXT: Record<Quality, Quality | null> = {
    common: 'excellent',
    excellent: 'elite',
    elite: 'perfect',
    perfect: 'legendary',
    legendary: 'mythic',
    mythic: null,
  };

  // 合成成功率
  const MERGE_SUCCESS_RATE: Record<Quality, number> = {
    common: 90,
    excellent: 80,
    elite: 70,
    perfect: 50,
    legendary: 30,
    mythic: 0,
  };

  const handleMergeGems = useCallback(() => {
    const gems = (inventory || []).filter(i => i.type === 'gem');
    // 按品质分组
    const groups: Record<string, RewardItem[]> = {};
    gems.forEach(gem => {
      if (!groups[gem.quality]) groups[gem.quality] = [];
      groups[gem.quality].push(gem);
    });

    // 找到第一个有5个以上宝石的品质组
    const qualityOrder: Quality[] = ['common', 'excellent', 'elite', 'perfect', 'legendary'];
    for (const quality of qualityOrder) {
      const group = groups[quality];
      if (group && group.length >= 5) {
        const targetQuality = QUALITY_NEXT[quality];
        if (!targetQuality) continue;
        const successRate = MERGE_SUCCESS_RATE[quality];
        setPendingMerge({
          gems: group.slice(0, 5),
          targetQuality,
          successRate,
        });
        return;
      }
    }
    // 没有可合成的宝石
  }, [inventory]);

  const handleConfirmMerge = useCallback(() => {
    if (!pendingMerge) return;

    const { gems, targetQuality, successRate } = pendingMerge;
    const isSuccess = Math.random() * 100 < successRate;

    // 移除参与合成的5个宝石
    const gemIds = new Set(gems.map(g => g.id));
    setInventory(prev => prev.filter(i => !gemIds.has(i.id)));

    if (isSuccess) {
      // 合成成功：生成一个目标品质的随机宝石
      const slots: GemSlot[] = ['helmet', 'armor', 'shoulder', 'legs', 'boots'];
      const randomSlot = slots[Math.floor(Math.random() * slots.length)];
      const newGemData = generateRandomGem(randomSlot, targetQuality);
      const newGem: RewardItem = {
        id: `gem_${targetQuality}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'gem',
        quality: targetQuality,
        name: newGemData.name,
        identified: true,
        data: newGemData,
      };
      setInventory(prev => [...prev, newGem]);
      setMergeResult({ success: true, gem: newGem });
    } else {
      setMergeResult({ success: false });
    }

    setPendingMerge(null);
  }, [pendingMerge, setInventory]);

  const handleCancelMerge = useCallback(() => {
    setPendingMerge(null);
  }, []);

  const handleCloseMergeResult = useCallback(() => {
    setMergeResult(null);
  }, []);

  const handleUpgradeSelect = useCallback((upgradeId: string) => {
    setGamePhase('playing')
    gameBridge.emit('upgrade:selected', { upgradeId })

    // 枪械相关卡牌 - 升级枪械
    if (gunUpgradeIds.includes(upgradeId)) {
      setGunLevel((prev) => prev + 1)
    }
  }, [])

  const handlePause = useCallback(() => {
    setGamePhase('paused')
    gameBridge.emit('game:pause')
  }, [])

  const handleResume = useCallback(() => {
    setGamePhase('playing')
    gameBridge.emit('game:resume')
  }, [])

  const handleRestartFromPause = useCallback(() => {
    setGamePhase('loading')
    setScore(0)
    setLevel(1)
    setKillCount(0)
    setWaveNumber(0)
    setWallHp(2000)
    setWallMaxHp(2000)
    setWallShield(0)
    setWallMaxShield(0)
    setCurrentRewards([])
    setActiveSkills([])
    setGunLevel(1)
    setDamageStats([])
    setGunStats({
      damage: 0,
      damageBonus: 0,
      burstCount: 1,
      rapidCount: 1,
      splitCount: 0,
      splitDamage: 0,
      critChance: 0,
      critMultiplier: 3,
    })

    // 重新收集装备数据
    let bonusHp = 0;
    let bonusAttack = 0;
    const elementDamageByType: Record<string, number> = {};
    const affixEffects: Record<string, number> = {};
    Object.values(equippedItems || {}).forEach(item => {
      if (item?.data) {
        const data = item.data as any;
        bonusHp += data.hp || 0;
        bonusAttack += data.attack || 0;
        if (data.affixes) {
          data.affixes.forEach((affix: any) => {
            if (affix.elementType && affix.damage > 0) {
              elementDamageByType[affix.elementType] = (elementDamageByType[affix.elementType] || 0) + affix.damage;
            }
          });
        }
      }
      const gems = (item?.data as any)?.enchantedGems || [];
      gems.forEach((gem: any) => {
        if (gem.data?.affixes) {
          gem.data.affixes.forEach((affix: any) => {
            affixEffects[affix.id] = (affixEffects[affix.id] || 0) + affix.value;
          });
        }
      });
    });

    const wallHpBonus = (affixEffects['wall_hp_200'] || 0) + (affixEffects['wall_hp_400'] || 0) +
      (affixEffects['wall_hp_600'] || 0) + (affixEffects['wall_hp_800'] || 0) +
      (affixEffects['wall_hp_1000'] || 0) + (affixEffects['wall_hp_1200'] || 0);
    const wallShieldBonus = (affixEffects['wall_shield_100'] || 0) + (affixEffects['wall_shield_200'] || 0) +
      (affixEffects['wall_shield_300'] || 0) + (affixEffects['wall_shield_400'] || 0) +
      (affixEffects['wall_shield_500'] || 0) + (affixEffects['wall_shield_600'] || 0);
    const hitRateBonus = (affixEffects['hit_rate_5'] || 0) + (affixEffects['hit_rate_10'] || 0) +
      (affixEffects['hit_rate_15'] || 0) + (affixEffects['hit_rate_20'] || 0) +
      (affixEffects['hit_rate_25'] || 0) + (affixEffects['hit_rate_30'] || 0);
    const attackBonus = (affixEffects['attack_20'] || 0) + (affixEffects['attack_40'] || 0) +
      (affixEffects['attack_60'] || 0) + (affixEffects['attack_80'] || 0) +
      (affixEffects['attack_100'] || 0) + (affixEffects['attack_120'] || 0);
    const critDamageBonus = (affixEffects['crit_damage_10'] || 0) + (affixEffects['crit_damage_20'] || 0) +
      (affixEffects['crit_damage_30'] || 0) + (affixEffects['crit_damage_40'] || 0) +
      (affixEffects['crit_damage_50'] || 0) + (affixEffects['crit_damage_60'] || 0);
    const dodgeBonus = (affixEffects['dodge_5'] || 0) + (affixEffects['dodge_10'] || 0) +
      (affixEffects['dodge_15'] || 0) + (affixEffects['dodge_20'] || 0) +
      (affixEffects['dodge_30'] || 0) + (affixEffects['dodge_40'] || 0);
    const wallMaxHp = 2000 + bonusHp + wallHpBonus;

    setPendingGameData({
      startWave: currentStage, bonusHp, bonusAttack, affixEffects,
      wallMaxHp, wallShield: wallShieldBonus,
      playerCritChanceBonus: hitRateBonus / 100,
      playerCritDamageBonus: critDamageBonus / 100,
      playerDodgeRate: dodgeBonus / 100,
      playerAttackBonus: attackBonus,
      elementDamageByType,
      hitRateBonus: hitRateBonus,
    });
    gameBridge.emit('game:restart')
  }, [equippedItems, currentStage])

  const handleToggleAutoShoot = useCallback(() => {
    setAutoShoot((prev) => {
      const newValue = !prev
      gameBridge.emit('game:toggle-shoot', { enabled: newValue })
      return newValue
    })
  }, [])

  return (
    <Theme appearance="dark" accentColor='red' grayColor='gray' panelBackground='translucent'>
      <GradientBackground />
      {!isMobile && <Header />}

      <div className={isMobile ? styles.appWrapperMobile : styles.appWrapper}>
        <div className={styles.gameContainer}>
          {gamePhase !== 'lobby' && <GameContainer onReady={handleGameReady} />}

          {/* 加载过场 */}
          {gamePhase === 'loading' && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingContent}>
                <Text size="6" weight="bold">加载中...</Text>
                <div className={styles.loadingBar}>
                  <div className={styles.loadingBarInner} />
                </div>
                <Text size="2" color="gray">正在准备战场</Text>
              </div>
            </div>
          )}

          {gamePhase === 'lobby' && (
            <Lobby
              bestScore={bestScore || 0}
              maxWave={maxWave || 0}
              inventory={inventory || []}
              cores={cores || []}
              armors={armors || []}
              currency={currency || { copper: 0, silver: 0, gold: 0 }}
              initialStage={lastSelectedStage || 1}
              equippedItems={equippedItems || { helmet: null, armor: null, shoulder: null, legs: null, boots: null }}
              stageRecords={stageRecords || {}}
              onStartGame={handleStartGame}
              onRefine={handleRefine}
              onEnchant={handleEnchant}
              onUnenchant={handleUnenchant}
              onEquip={handleEquip}
              onUnequip={handleUnequip}
              onMergeGems={handleMergeGems}
            />
          )}

          {gamePhase !== 'lobby' && gamePhase !== 'loading' && (
            <HUD
              waveNumber={waveNumber}
              maxWave={20} // 每关固定20波
              score={score}
              level={level}
              killCount={killCount}
              wallHp={wallHp}
              wallMaxHp={wallMaxHp}
              wallShield={wallShield}
              wallMaxShield={wallMaxShield}
              ammo={ammo}
              maxAmmo={maxAmmo}
              isReloading={isReloading}
              xp={xp}
              xpToNextLevel={xpToNextLevel}
              stageName={(stageNames[currentStage] || `关卡 ${currentStage}`) + (difficulty === 'elite' ? '·精英' : '')}
              currentStage={currentStage}
              timer={gameTime}
              gunLevel={gunLevel}
              skills={activeSkills}
              damageStats={damageStats}
              gunStats={gunStats}
              activeAffixes={activeAffixes}
              autoShoot={autoShoot}
              onPause={handlePause}
              onShowDamageStats={() => {}}
              onToggleAutoShoot={handleToggleAutoShoot}
            />
          )}

          {gamePhase === 'paused' && (
            <PauseMenu onResume={handleResume} onRestart={handleRestartFromPause} onBackToLobby={handleBackToLobby} />
          )}

          {gamePhase === 'upgrade' && <UpgradePanel options={upgradeOptions} onSelect={handleUpgradeSelect} />}

          {gamePhase === 'gameover' && (
            <GameOverPanel
              waveNumber={waveNumber}
              score={score}
              killCount={killCount}
              bestScore={bestScore || 0}
              rewards={currentRewards}
              clearCondition={clearCondition}
              damageStats={damageStats}
              onRestart={handleRestart}
              onBackToLobby={handleBackToLobby}
              onClaimRewards={() => {
                // 将奖励鉴定后放入背包
                const identifiedRewards = currentRewards.map((r) => identifyReward(r));
                setInventory((prev) => [...prev, ...identifiedRewards]);
              }}
            />
          )}
        </div>
      </div>

      {!isMobile && (
        <div className={styles.footer}>
          <Footer name='向僵尸开炮' />
        </div>
      )}

      {/* 装备替换确认弹窗 */}
      {pendingEquip && (
        <ConfirmDialog
          title="替换装备"
          message={`当前槽位已有装备：\n${(equippedItems?.[pendingEquip.slot]?.data as any)?.name || '未知'}（${QUALITY_CONFIG[equippedItems?.[pendingEquip.slot]?.quality || 'common']?.name}）\n\n替换为：\n${(pendingEquip.item.data as any)?.name || '未知'}（${QUALITY_CONFIG[pendingEquip.item.quality]?.name}）\n\n原装备将放回背包。`}
          confirmText="确认替换"
          cancelText="取消"
          onConfirm={handleConfirmEquip}
          onCancel={handleCancelEquip}
        />
      )}

      {/* 宝石替换确认弹窗 */}
      {pendingEnchant && (
        <ConfirmDialog
          title="替换宝石"
          message={`已有同类型宝石！\n\n当前：${(equippedItems?.[pendingEnchant.equipSlot]?.data as any)?.enchantedGems?.[pendingEnchant.existingIndex]?.data?.affixes?.[0]?.name || '未知'}\n替换为：${pendingEnchant.gem.data?.affixes?.[0]?.name || '未知'}`}
          confirmText="确认替换"
          cancelText="取消"
          onConfirm={() => {
            doEnchant(pendingEnchant.gem, pendingEnchant.equipSlot, pendingEnchant.existingIndex);
            setPendingEnchant(null);
          }}
          onCancel={() => setPendingEnchant(null)}
        />
      )}

      {/* 合成确认弹窗 */}
      {pendingMerge && (
        <ConfirmDialog
          title="宝石合成"
          message={`参与合成的宝石：\n${pendingMerge.gems.map(g => {
            const affixes = (g.data as any)?.affixes || [];
            const affixText = affixes.map((a: any) => a.name || a.description).join('、');
            return `· ${g.name}（${QUALITY_CONFIG[g.quality]?.name}）${affixText ? '\n  词条：' + affixText : ''}`;
          }).join('\n')}\n\n合成目标：${QUALITY_CONFIG[pendingMerge.targetQuality]?.name}宝石\n成功率：${pendingMerge.successRate}%\n\n失败则所有参与合成的宝石消失！`}
          confirmText="确认合成"
          cancelText="取消"
          onConfirm={handleConfirmMerge}
          onCancel={handleCancelMerge}
        />
      )}

      {/* 合成结果弹窗 */}
      {mergeResult && (
        <ConfirmDialog
          title={mergeResult.success ? '合成成功' : '合成失败'}
          message={mergeResult.success && mergeResult.gem
            ? `恭喜获得新宝石！\n\n${mergeResult.gem.name}\n品质：${QUALITY_CONFIG[mergeResult.gem.quality]?.name}\n词条：${(mergeResult.gem.data as any)?.affixes?.[0]?.name || '未知'}`
            : '合成失败，参与合成的宝石已消失。'
          }
          confirmText="确定"
          onConfirm={handleCloseMergeResult}
          onCancel={handleCloseMergeResult}
        />
      )}

      {/* 洗练弹窗 */}
      {refiningState && (() => {
        const affix = (refiningState.item.data as any)?.affixes?.[refiningState.affixIndex];
        const currentAffix = affix && affix.damage > 0 ? { elementType: affix.elementType, damage: affix.damage } : undefined;
        return (
          <RefineDialog
            quality={(refiningState.item.data as any)?.quality || 'common'}
            cost={(refiningState.item.data as any)?.refineCost || 100}
            damageRange={ELEMENT_DAMAGE_RANGE[(refiningState.item.data as any)?.quality || 'common']}
            currentAffix={currentAffix}
            refining={refiningState.refining}
            result={refiningState.result}
            onRefine={handleDoRefine}
            onClose={handleCloseRefine}
          />
        );
      })()}

      {/* 返回大厅确认弹窗 */}
      {pendingBackToLobby && (
        <ConfirmDialog
          title="确认返回大厅"
          message={currentRewards.length > 0
            ? `当前有未领取的通关奖励：\n${currentRewards.map(r => `· ${QUALITY_CONFIG[r.quality]?.name || '未知'}${r.type === 'gem' ? '宝石' : '装备'}`).join('\n')}\n\n如果现在退出，将无法获得任何奖励。\n确定要返回大厅吗？`
            : '确定要返回大厅吗？'}
          confirmText="确认退出"
          cancelText="继续游戏"
          onConfirm={handleConfirmBackToLobby}
          onCancel={() => setPendingBackToLobby(false)}
        />
      )}
    </Theme>
  )
}

export default App
