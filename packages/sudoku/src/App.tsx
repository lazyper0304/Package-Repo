import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Theme, Card } from '@radix-ui/themes';
import { useLocalStorageState } from 'ahooks';
import { useMobile } from './hooks/useMobile';
import { GradientBackground } from './components/GradientBackground';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SudokuBoard } from './components/SudokuBoard';
import { NumberPad } from './components/NumberPad';
import { GameControls } from './components/GameControls';
import {
  generatePuzzle,
  isBoardComplete,
  getConflicts,
  getHint,
  getNumberCounts,
  type Difficulty,
  type Board,
} from './utils/sudokuLogic';
import styles from './App.module.less';

function cloneBoard(board: Board): Board {
  return board.map(row => [...row]);
}

function App() {
  const isMobile = useMobile();

  const [difficulty, setDifficulty] = useLocalStorageState<Difficulty>('sudoku-difficulty', {
    defaultValue: 'easy',
  });
  const [puzzle, setPuzzle] = useState<Board>(() => generatePuzzle('easy').puzzle);
  const [solution, setSolution] = useState<Board>(() => generatePuzzle('easy').solution);
  const [board, setBoard] = useState<Board>(() => cloneBoard(puzzle));
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [conflicts, setConflicts] = useState<Set<string>>(new Set());
  const [hintCell, setHintCell] = useState<[number, number] | null>(null);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [timer, setTimer] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Timer
  useEffect(() => {
    if (gameWon) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameWon]);

  const handleNewGame = useCallback(() => {
    const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(difficulty || 'easy');
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setBoard(cloneBoard(newPuzzle));
    setSelectedCell(null);
    setConflicts(new Set());
    setHintCell(null);
    setHintsLeft(3);
    setTimer(0);
    setMistakes(0);
    setGameWon(false);
  }, [difficulty]);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
    const { puzzle: newPuzzle, solution: newSolution } = generatePuzzle(d);
    setPuzzle(newPuzzle);
    setSolution(newSolution);
    setBoard(cloneBoard(newPuzzle));
    setSelectedCell(null);
    setConflicts(new Set());
    setHintCell(null);
    setHintsLeft(3);
    setTimer(0);
    setMistakes(0);
    setGameWon(false);
  }, [setDifficulty]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (gameWon) return;
    setHintCell(null);
    setSelectedCell([row, col]);
  }, [gameWon]);

  const handleNumberInput = useCallback((num: number) => {
    if (!selectedCell || gameWon) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== 0) return;

    const newBoard = cloneBoard(board);
    newBoard[r][c] = num;

    const newConflicts = new Set<string>();
    const cellConflicts = getConflicts(newBoard, r, c, num);
    if (cellConflicts.length > 0) {
      newConflicts.add(`${r}-${c}`);
      cellConflicts.forEach(([cr, cc]) => newConflicts.add(`${cr}-${cc}`));
      setMistakes(m => m + 1);
    }
    setConflicts(newConflicts);
    setBoard(newBoard);

    if (isBoardComplete(newBoard)) {
      setGameWon(true);
    }
  }, [selectedCell, puzzle, board, gameWon]);

  const handleErase = useCallback(() => {
    if (!selectedCell || gameWon) return;
    const [r, c] = selectedCell;
    if (puzzle[r][c] !== 0) return;

    const newBoard = cloneBoard(board);
    newBoard[r][c] = 0;
    setBoard(newBoard);
    setConflicts(new Set());
  }, [selectedCell, puzzle, board, gameWon]);

  const handleHint = useCallback(() => {
    if (hintsLeft <= 0 || gameWon) return;
    const hint = getHint(board, solution);
    if (!hint) return;
    const [r, c, num] = hint;
    const newBoard = cloneBoard(board);
    newBoard[r][c] = num;
    setBoard(newBoard);
    setHintCell([r, c]);
    setSelectedCell([r, c]);
    setHintsLeft(h => h - 1);
    setConflicts(new Set());

    if (isBoardComplete(newBoard)) {
      setGameWon(true);
    }
  }, [board, solution, hintsLeft, gameWon]);

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameWon) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        handleNumberInput(num);
        return;
      }
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleErase();
        return;
      }
      if (selectedCell) {
        const [r, c] = selectedCell;
        let nr = r, nc = c;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') nr = Math.max(0, r - 1);
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') nr = Math.min(8, r + 1);
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') nc = Math.max(0, c - 1);
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') nc = Math.min(8, c + 1);
        if (nr !== r || nc !== c) {
          e.preventDefault();
          setSelectedCell([nr, nc]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberInput, handleErase, selectedCell, gameWon]);

  const numberCounts = useMemo(() => getNumberCounts(board), [board]);

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
          <div className={isMobile ? styles.mainGridMobile : styles.mainGrid}>
            <Card className={styles.boardCard}>
              <SudokuBoard
                board={board}
                puzzle={puzzle}
                selectedCell={selectedCell}
                conflicts={conflicts}
                hintCell={hintCell}
                onCellClick={handleCellClick}
              />
            </Card>
            <div className={styles.sidePanel}>
              <Card className={styles.controlCard}>
                <GameControls
                  difficulty={difficulty || 'easy'}
                  onDifficultyChange={handleDifficultyChange}
                  onNewGame={handleNewGame}
                  onHint={handleHint}
                  hintsLeft={hintsLeft}
                  timer={timer}
                  mistakes={mistakes}
                />
              </Card>
              <Card className={styles.padCard}>
                <NumberPad
                  onNumberClick={handleNumberInput}
                  onErase={handleErase}
                  numberCounts={numberCounts}
                />
              </Card>
            </div>
          </div>

          {gameWon && (
            <Card className={styles.overlay}>
              <div className={styles.winContent}>
                <div className={styles.winIcon}>🎉</div>
                <div className={styles.winTitle}>恭喜完成！</div>
                <div className={styles.winStats}>
                  用时 {Math.floor(timer / 60)} 分 {timer % 60} 秒 · 错误 {mistakes} 次
                </div>
                <button className={styles.winButton} onClick={handleNewGame}>
                  再来一局
                </button>
              </div>
            </Card>
          )}
        </div>
        <div className={isMobile ? styles.footerMobile : styles.footer}>
          <Footer name="数独" />
        </div>
      </div>
    </Theme>
  );
}

export default App;
