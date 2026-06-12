import { useState, useCallback, useEffect, useMemo } from 'react';
import { Theme, Card, Flex, Text } from '@radix-ui/themes';
import { useLocalStorageState } from 'ahooks';
import { useMobile } from './hooks/useMobile';
import { GradientBackground } from './components/GradientBackground';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { PinballGame } from './components/PinballGame';
import styles from './App.module.less';

type PowerUpType = 'expand' | 'multi' | 'slow' | 'life' | 'pierce';

const POWERUP_COLORS: Record<PowerUpType, string> = {
  expand: '#22c55e',
  multi: '#3b82f6',
  slow: '#eab308',
  life: '#f43f5e',
  pierce: '#a855f7',
};
const POWERUP_NAMES: Record<PowerUpType, string> = {
  expand: '加宽挡板',
  multi: '分身球',
  slow: '减速',
  life: '加命',
  pierce: '穿透',
};

function App() {
  const isMobile = useMobile();
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useLocalStorageState<number>('pinball-best', {
    defaultValue: 0,
  });

  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);

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

  const handleScoreChange = useCallback(
    (s: number) => {
      setScore(s);
      if (s > bestScore) setBestScore(s);
    },
    [bestScore, setBestScore]
  );

  const handleStatusUpdate = useCallback(
    (status: { lives: number; level: number; activePowerUps: PowerUpType[] }) => {
      setLives(status.lives);
      setLevel(status.level);
      setActivePowerUps(status.activePowerUps);
    },
    []
  );

  return (
    <Theme
      appearance={appearance}
      accentColor={appearance === 'dark' ? 'teal' : 'blue'}
      grayColor="gray"
      panelBackground="translucent"
    >
      <GradientBackground />
      <Header themeMode={themeMode || 'system'} onCycleTheme={cycleTheme} />
      <div className={isMobile ? styles.appWrapperMobile : styles.appWrapper}>
        <div className={isMobile ? styles.containerMobile : styles.container}>
          <div className={styles.gameArea}>
            <Card className={styles.scoreCard}>
              <Flex justify="between" align="center">
                <div>
                  <Text size="2" color="gray">分数</Text>
                  <Text size="6" weight="bold" style={{ display: 'block' }}>{score}</Text>
                </div>
                <div>
                  <Text size="2" color="gray">最高分</Text>
                  <Text size="6" weight="bold" style={{ display: 'block' }}>{bestScore}</Text>
                </div>
              </Flex>
            </Card>

            <div className={styles.gameBoard}>
              <PinballGame onScoreChange={handleScoreChange} onStatusUpdate={handleStatusUpdate} />
            </div>

            <Text size="2" color="gray" style={{ textAlign: 'center', marginTop: 8 }}>
              移动鼠标 / 触摸 / 键盘 A D 控制挡板
            </Text>
          </div>

          <div className={styles.sidebar}>
            <Card className={styles.statusCard}>
              <Text size="2" weight="bold" style={{ marginBottom: 12, display: 'block' }}>
                状态
              </Text>

              <div className={styles.statusRow}>
                <Text size="2" color="gray">关卡</Text>
                <Text size="4" weight="bold">{level}</Text>
              </div>

              <div className={styles.statusRow}>
                <Text size="2" color="gray">生命</Text>
                <div className={styles.hearts}>
                  {Array.from({ length: lives }, (_, i) => (
                    <span key={i} className={styles.heart}>♥</span>
                  ))}
                  {lives <= 0 && <Text size="2" color="red" weight="bold">×</Text>}
                </div>
              </div>

              <div className={styles.powerUpSection}>
                <Text size="2" color="gray" style={{ marginBottom: 8, display: 'block' }}>
                  技能
                </Text>
                {activePowerUps.length === 0 ? (
                  <Text size="1" color="gray" style={{ opacity: 0.6 }}>
                    暂无
                  </Text>
                ) : (
                  <div className={styles.powerUpList}>
                    {activePowerUps.map((p) => (
                      <div key={p} className={styles.powerUpBadge}>
                        <span
                          className={styles.powerUpDot}
                          style={{ background: POWERUP_COLORS[p] }}
                        />
                        <Text size="1">{POWERUP_NAMES[p]}</Text>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        <div className={isMobile ? styles.footerMobile : styles.footer}>
          <Footer name="弹球" />
        </div>
      </div>
    </Theme>
  );
}

export default App;
