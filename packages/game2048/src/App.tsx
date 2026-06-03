import { useState, useCallback, useEffect, useMemo } from 'react';
import { Theme, Card, Button, Flex, Text } from '@radix-ui/themes';
import { useLocalStorageState } from 'ahooks';
import { useMobile } from './hooks/useMobile';
import { GradientBackground } from './components/GradientBackground';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { GameScene } from './components/GameScene';
import {
  initializeGame,
  move,
  canMove,
  hasWon,
  type Direction,
  type Grid,
} from './utils/gameLogic';
import styles from './App.module.less';

function App() {
  const isMobile = useMobile();
  const [grid, setGrid] = useState<Grid>(initializeGame);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useLocalStorageState<number>('game2048-best', {
    defaultValue: 0,
  });
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

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

  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameOver || won) return;

      const result = move(grid, direction);
      if (!result.moved) return;

      const newGrid = result.grid.map(row => [...row]);
      const gridWithNewTile = (() => {
        const empty: [number, number][] = [];
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (newGrid[r][c] === 0) empty.push([r, c]);
          }
        }
        if (empty.length === 0) return newGrid;
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        newGrid[r][c] = Math.random() < 0.9 ? 2 : 4;
        return newGrid;
      })();

      setGrid(gridWithNewTile);
      const newScore = score + result.score;
      setScore(newScore);

      if (newScore > bestScore) {
        setBestScore(newScore);
      }

      if (hasWon(gridWithNewTile)) {
        setWon(true);
      } else if (!canMove(gridWithNewTile)) {
        setGameOver(true);
      }
    },
    [grid, score, bestScore, gameOver, won, setBestScore]
  );

  const handleNewGame = useCallback(() => {
    setGrid(initializeGame());
    setScore(0);
    setGameOver(false);
    setWon(false);
  }, []);

  // 键盘控制
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
        'w': 'up', 's': 'down', 'a': 'left', 'd': 'right',
        'W': 'up', 'S': 'down', 'A': 'left', 'D': 'right',
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

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
                <Button onClick={handleNewGame}>新游戏</Button>
              </Flex>
            </Card>

            <div className={styles.gameBoard}>
              <GameScene grid={grid} onMove={handleMove} />
            </div>

            {(gameOver || won) && (
              <Card className={styles.overlay}>
                <Text size="6" weight="bold">
                  {won ? '恭喜！你赢了！' : '游戏结束'}
                </Text>
                <Text size="3" style={{ marginTop: 8 }}>
                  最终分数: {score}
                </Text>
                <Button onClick={handleNewGame} style={{ marginTop: 16 }}>
                  再来一局
                </Button>
              </Card>
            )}

            <Text size="2" color="gray" style={{ textAlign: 'center', marginTop: 8 }}>
              使用方向键或滑动控制
            </Text>
          </div>
        </div>
        <div className={styles.footer}>
          <Footer name="2048" />
        </div>
      </div>
    </Theme>
  );
}

export default App;
