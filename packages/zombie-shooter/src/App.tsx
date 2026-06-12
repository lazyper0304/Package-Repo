import { useState, useCallback, useEffect, useMemo } from 'react';
import { Theme } from '@radix-ui/themes';
import { useLocalStorageState } from 'ahooks';
import { useMobile } from './hooks/useMobile';
import { gameBridge, type UpgradeOption } from './game/bridge';
import { generateRewards, identifyReward, type RewardItem } from './game/data/rewards';
import { type Currency } from './game/data/currency';
import { GradientBackground } from './components/website/GradientBackground';
import { Header } from './components/website/Header';
import { Footer } from './components/website/Footer';
import { GameContainer } from './components/game/GameContainer';
import { HUD } from './components/game/HUD';
import { UpgradePanel } from './components/game/UpgradePanel';
import { GameOverPanel } from './components/game/GameOverPanel';
import { PauseMenu } from './components/game/PauseMenu';
import { Lobby } from './components/game/Lobby';
import styles from './App.module.less';

type GamePhase = 'lobby' | 'playing' | 'upgrade' | 'gameover' | 'paused';

const stageNames: Record<number, string> = {
  1: '废弃工厂', 2: '城市街道', 3: '地下车库', 4: '购物中心', 5: '医院大厅',
  6: '学校操场', 7: '公园广场', 8: '地铁站', 9: '港口码头', 10: '军事基地',
};

function App() {
  const isMobile = useMobile();

  const [themeMode, setThemeMode] = useLocalStorageState<'light' | 'dark' | 'system'>('theme-mode', {
    defaultValue: 'system',
  });

  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const appearance = useMemo(() => {
    if (themeMode === 'system') {
      return systemDarkMode ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemDarkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appearance);
  }, [appearance]);

  const cycleTheme = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light');
  }, [themeMode, setThemeMode]);

  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [waveNumber, setWaveNumber] = useState(0);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [killCount, setKillCount] = useState(0);
  const [upgradeOptions, setUpgradeOptions] = useState<UpgradeOption[]>([]);
  const [wallHp, setWallHp] = useState(200);
  const [wallMaxHp, setWallMaxHp] = useState(200);
  const [wallShield, setWallShield] = useState(0);
  const [wallMaxShield, setWallMaxShield] = useState(0);
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo, setMaxAmmo] = useState(30);
  const [isReloading, setIsReloading] = useState(false);
  const [xp, setXp] = useState(0);
  const [xpToNextLevel, setXpToNextLevel] = useState(16);
  const [gameTime, setGameTime] = useState(0);
  const [currentStage, setCurrentStage] = useState(1); // 当前挑战的关卡
  const [activeSkills, setActiveSkills] = useState<{ name: string; element: string; level: number; icon: string; cooldown: number; remaining: number; progress: number; elementDamage: number }[]>([]);
  const [gunLevel, setGunLevel] = useState(1); // 枪械等级，初始1级
  const [autoShoot, setAutoShoot] = useState(true); // 自动射击开关
  const [damageStats, setDamageStats] = useState<{ source: string; icon: string; damage: number; percentage: number }[]>([]);
  const [gunStats, setGunStats] = useState({ damage: 0, damageBonus: 0, burstCount: 1, rapidCount: 1, splitCount: 0, splitDamage: 0, critChance: 0, critMultiplier: 3 });
  const [lastSelectedStage, setLastSelectedStage] = useLocalStorageState<number>('zombie-shooter-last-stage', {
    defaultValue: 1,
  });

  // 持久化数据
  const [bestScore, setBestScore] = useLocalStorageState<number>('zombie-shooter-best', {
    defaultValue: 0,
  });

  const [maxWave, setMaxWave] = useLocalStorageState<number>('zombie-shooter-max-wave', {
    defaultValue: 0,
  });

  const [currency, setCurrency] = useLocalStorageState<Currency>('zombie-shooter-currency', {
    defaultValue: { copper: 0, silver: 0, gold: 0 },
  });

  const [inventory, setInventory] = useLocalStorageState<RewardItem[]>('zombie-shooter-inventory', {
    defaultValue: [],
  });

  const [cores, setCores] = useLocalStorageState<RewardItem[]>('zombie-shooter-cores', {
    defaultValue: [],
  });

  const [armors, setArmors] = useLocalStorageState<RewardItem[]>('zombie-shooter-armors', {
    defaultValue: [],
  });

  // 当前游戏奖励
  const [currentRewards, setCurrentRewards] = useState<RewardItem[]>([]);
  const [clearCondition, setClearCondition] = useState<string>('cleared');

  // Listen to game events
  useEffect(() => {
    const unsubs = [
      gameBridge.on('wave:started', (data: { waveNumber: number }) => {
        setWaveNumber(data.waveNumber);
      }),
      gameBridge.on('player:died', (data: { waveNumber: number; killCount: number }) => {
        setWaveNumber(data.waveNumber);
        setKillCount(data.killCount);
        setGamePhase('gameover');
        if (score > bestScore) {
          setBestScore(score);
        }
        if (data.waveNumber > (maxWave || 0)) {
          setMaxWave(data.waveNumber);
        }
        // 生成奖励
        const progress = Math.min(100, (data.waveNumber / 20) * 100);
        const rewards = generateRewards('normal', progress, data.waveNumber);
        setCurrentRewards(rewards);
        setClearCondition('cleared');
      }),
      gameBridge.on('score:changed', (data: { score: number }) => {
        setScore(data.score);
      }),
      gameBridge.on('xp:changed', (data: { xp: number; level: number }) => {
        setXp(data.xp);
        setLevel(data.level);
      }),
      gameBridge.on('game:time', (data: { time: number }) => {
        setGameTime(data.time);
      }),
      gameBridge.on('enemy:killed', () => {
        setKillCount(prev => prev + 1);
      }),
      gameBridge.on('upgrade:options', (data: { options: UpgradeOption[] }) => {
        setUpgradeOptions(data.options);
        setGamePhase('upgrade');
      }),
      gameBridge.on('wall:hp-changed', (data: { hp: number; maxHp: number }) => {
        setWallHp(data.hp);
        setWallMaxHp(data.maxHp);
      }),
      gameBridge.on('wall:shield-changed', (data: { shield: number; maxShield: number }) => {
        setWallShield(data.shield);
        setWallMaxShield(data.maxShield);
      }),
      gameBridge.on('ammo:changed', (data: { ammo: number; maxAmmo: number; isReloading: boolean }) => {
        setAmmo(data.ammo);
        setMaxAmmo(data.maxAmmo);
        setIsReloading(data.isReloading);
      }),
      gameBridge.on('skills:updated', (data: { skills: { name: string; element: string; level: number; cooldown: number; remaining: number; progress: number; elementDamage: number }[] }) => {
        const skillIcons: Record<string, string> = {
          wind: '🌪️',
          thunder: '⚡',
          water: '💧',
          fire: '🔥',
          earth: '🪨',
        };
        const newSkills = data.skills.map(s => ({
          name: s.name,
          element: s.element,
          level: s.level,
          icon: skillIcons[s.element] || '✨',
          cooldown: s.cooldown,
          remaining: s.remaining,
          progress: s.progress,
          elementDamage: s.elementDamage,
        }));
        setActiveSkills(prev => {
          if (prev.length !== newSkills.length) return newSkills;
          for (let i = 0; i < prev.length; i++) {
            if (prev[i].progress !== newSkills[i].progress || prev[i].level !== newSkills[i].level || prev[i].name !== newSkills[i].name) {
              return newSkills;
            }
          }
          return prev;
        });
      }),
      gameBridge.on('damage:stats', (data: { stats: { source: string; icon: string; damage: number; percentage: number }[] }) => {
        setDamageStats(data.stats);
      }),
      gameBridge.on('gun:stats', (data: { damage: number; damageBonus: number; burstCount: number; rapidCount: number; splitCount: number; splitDamage: number; critChance: number; critMultiplier: number }) => {
        setGunStats(data);
      }),
    ];

    return () => unsubs.forEach(unsub => unsub());
  }, [bestScore, score, setBestScore, maxWave]);

  const handleStartGame = useCallback((startWave: number) => {
    setGamePhase('playing');
    setScore(0);
    setLevel(1);
    setKillCount(0);
    setWaveNumber(0);
    setWallHp(2000);
    setWallMaxHp(2000);
    setWallShield(0);
    setWallMaxShield(0);
    setAmmo(30);
    setMaxAmmo(30);
    setIsReloading(false);
    setXp(0);
    setXpToNextLevel(16); // 每级需要16经验
    setGameTime(0);
    setCurrentStage(startWave);
    setLastSelectedStage(startWave);
    setActiveSkills([]);
    setGunLevel(1);
    gameBridge.emit('game:start', { startWave });
  }, [setLastSelectedStage]);

  const handleRestart = useCallback(() => {
    setGamePhase('playing');
    setScore(0);
    setLevel(1);
    setKillCount(0);
    setWaveNumber(0);
    setWallHp(2000);
    setWallMaxHp(2000);
    setWallShield(0);
    setWallMaxShield(0);
    setAmmo(30);
    setMaxAmmo(30);
    setIsReloading(false);
    setXp(0);
    setXpToNextLevel(16); // 每级需要16经验
    setGameTime(0);
    setCurrentRewards([]);
    setActiveSkills([]);
    setGunLevel(1);
    gameBridge.emit('game:restart');
  }, []);

  const handleBackToLobby = useCallback(() => {
    setGamePhase('lobby');
    gameBridge.emit('game:restart');
    // 将奖励鉴定后放入背包
    const identifiedRewards = currentRewards.map(r => identifyReward(r));
    setInventory(prev => [...prev, ...identifiedRewards]);
    setCurrentRewards([]);
  }, [currentRewards, setInventory]);

  const handleUpgradeSelect = useCallback((upgradeId: string) => {
    setGamePhase('playing');
    gameBridge.emit('upgrade:selected', { upgradeId });

    // 枪械相关卡牌 - 升级枪械
    const gunUpgrades = ['gun_damage', 'gun_burst', 'gun_rapid', 'gun_split_2', 'gun_split_4', 'gun_all_damage', 'gun_fire', 'gun_ice', 'gun_thunder'];
    if (gunUpgrades.includes(upgradeId)) {
      setGunLevel(prev => prev + 1);
    }
  }, []);

  const handlePause = useCallback(() => {
    setGamePhase('paused');
    gameBridge.emit('game:pause');
  }, []);

  const handleResume = useCallback(() => {
    setGamePhase('playing');
    gameBridge.emit('game:resume');
  }, []);

  const handleRestartFromPause = useCallback(() => {
    setGamePhase('playing');
    setScore(0);
    setLevel(1);
    setKillCount(0);
    setWaveNumber(0);
    setWallHp(2000);
    setWallMaxHp(2000);
    setWallShield(0);
    setWallMaxShield(0);
    setCurrentRewards([]);
    gameBridge.emit('game:restart');
  }, []);

  const handleToggleAutoShoot = useCallback(() => {
    setAutoShoot(prev => {
      const newValue = !prev;
      gameBridge.emit('game:toggle-shoot', { enabled: newValue });
      return newValue;
    });
  }, []);

  return (
    <Theme
      appearance={appearance}
      accentColor="red"
      grayColor="gray"
      panelBackground="translucent"
    >
      <GradientBackground />
      <Header themeMode={themeMode || 'system'} onCycleTheme={cycleTheme} />

      <div className={isMobile ? styles.appWrapperMobile : styles.appWrapper}>
        <div className={styles.gameContainer}>
          {gamePhase !== 'lobby' && <GameContainer />}

          {gamePhase === 'lobby' && (
            <Lobby
              bestScore={bestScore || 0}
              maxWave={maxWave || 0}
              inventory={inventory || []}
              cores={cores || []}
              armors={armors || []}
              currency={currency || { copper: 0, silver: 0, gold: 0 }}
              initialStage={lastSelectedStage || 1}
              onStartGame={handleStartGame}
            />
          )}

          {gamePhase !== 'lobby' && (
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
              stageName={stageNames[currentStage] || `关卡 ${currentStage}`}
              currentStage={currentStage}
              timer={gameTime}
              gunLevel={gunLevel}
              skills={activeSkills}
              damageStats={damageStats}
              gunStats={gunStats}
              autoShoot={autoShoot}
              onPause={handlePause}
              onShowDamageStats={() => {}}
              onToggleAutoShoot={handleToggleAutoShoot}
            />
          )}

          {gamePhase === 'paused' && (
            <PauseMenu
              onResume={handleResume}
              onRestart={handleRestartFromPause}
              onBackToLobby={handleBackToLobby}
            />
          )}

          {gamePhase === 'upgrade' && (
            <UpgradePanel options={upgradeOptions} onSelect={handleUpgradeSelect} />
          )}

          {gamePhase === 'gameover' && (
            <GameOverPanel
              waveNumber={waveNumber}
              score={score}
              killCount={killCount}
              bestScore={bestScore || 0}
              rewards={currentRewards}
              damageStats={damageStats}
              onRestart={handleRestart}
              onBackToLobby={handleBackToLobby}
            />
          )}
        </div>
      </div>

      <div className={isMobile ? styles.footerMobile : styles.footer}>
        <Footer name="向僵尸开炮" />
      </div>
    </Theme>
  );
}

export default App;
