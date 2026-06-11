import { useRef, useEffect, useCallback, useState } from 'react';

const PADDLE_HEIGHT = 12;
const BRICK_COLS = 40;
const BRICK_PADDING = 4;
const BRICK_BASE_ROWS = 4;
const LIVES_PER_LEVEL = 3;
const POWERUP_DROP_CHANCE = 0.5;
const POWERUP_SIZE = 18;

type GameState = 'idle' | 'running' | 'paused' | 'over' | 'levelUp' | 'lifeLost';
type PowerUpType = 'expand' | 'multi' | 'slow' | 'life' | 'pierce';

interface Brick {
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  hp: number;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  dy: number;
}

const BRICK_COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const POWERUP_COLORS: Record<PowerUpType, string> = {
  expand: '#22c55e',
  multi: '#3b82f6',
  slow: '#eab308',
  life: '#f43f5e',
  pierce: '#a855f7',
};
const POWERUP_LABELS: Record<PowerUpType, string> = {
  expand: '＋',
  multi: '✦',
  slow: '◆',
  life: '♥',
  pierce: '⚡',
};

export function PinballGame({
  onScoreChange,
  onStatusUpdate,
}: {
  onScoreChange: (score: number) => void;
  onStatusUpdate?: (status: { lives: number; level: number; activePowerUps: PowerUpType[] }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>('idle');
  const ballsRef = useRef<Ball[]>([]);
  const paddleRef = useRef({ x: 0, w: 0, baseW: 0 });
  const bricksRef = useRef<Brick[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(LIVES_PER_LEVEL);
  const levelRef = useRef(1);
  const rafRef = useRef(0);
  const activeEffectsRef = useRef<Set<PowerUpType>>(new Set());
  const slowTimerRef = useRef(0);
  const expandTimerRef = useRef(0);
  const pierceTimerRef = useRef(0);
  const [gameState, setGameState] = useState<GameState>('idle');
  const canvasSizeRef = useRef({ w: 0, h: 0 });
  const keysRef = useRef<Set<string>>(new Set());

  const emitInfo = useCallback(() => {
    onScoreChange(scoreRef.current);
    onStatusUpdate?.({
      lives: livesRef.current,
      level: levelRef.current,
      activePowerUps: [...activeEffectsRef.current],
    });
  }, [onScoreChange, onStatusUpdate]);

  const buildBricks = useCallback((w: number, level: number) => {
    const rows = Math.min(BRICK_BASE_ROWS + level - 1, BRICK_COLORS.length + 7);
    const brickW = (w - BRICK_PADDING * (BRICK_COLS + 1)) / BRICK_COLS;
    const brickH = 18;
    const bricks: Brick[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: BRICK_PADDING + c * (brickW + BRICK_PADDING),
          y: 30 + BRICK_PADDING + r * (brickH + BRICK_PADDING),
          w: brickW,
          h: brickH,
          alive: true,
          hp: r < 2 ? Math.min(1 + Math.floor(level / 3), 3) : 1,
          color: BRICK_COLORS[r % BRICK_COLORS.length],
        });
      }
    }
    return bricks;
  }, []);

  const resetBall = useCallback((w: number, h: number): Ball => {
    const speedScale = w / 800;
    const speed = (3.5 + levelRef.current * 0.2) * speedScale;
    return {
      x: w / 2,
      y: h - 50,
      dx: speed * (Math.random() > 0.5 ? 0.7 : -0.7),
      dy: -speed,
    };
  }, []);

  const initLevel = useCallback(
    (canvas: HTMLCanvasElement, keepScore?: boolean) => {
      const w = canvas.width;
      const h = canvas.height;
      canvasSizeRef.current = { w, h };

      const paddleW = Math.max(35, w * 0.08);
      paddleRef.current = {
        x: (w - paddleW) / 2,
        w: paddleW,
        baseW: paddleW,
      };

      ballsRef.current = [resetBall(w, h)];
      bricksRef.current = buildBricks(w, levelRef.current);
      powerUpsRef.current = [];
      activeEffectsRef.current.clear();
      expandTimerRef.current = 0;
      slowTimerRef.current = 0;
      pierceTimerRef.current = 0;

      if (!keepScore) {
        scoreRef.current = 0;
        livesRef.current = LIVES_PER_LEVEL;
        levelRef.current = 1;
      }
      emitInfo();
    },
    [buildBricks, resetBall, emitInfo]
  );

  const spawnPowerUp = useCallback((x: number, y: number, dy: number) => {
    if (Math.random() > POWERUP_DROP_CHANCE) return;
    const type: PowerUpType =
      Math.random() < 0.7
        ? 'multi'
        : (['expand', 'slow', 'life', 'pierce'] as PowerUpType[])[Math.floor(Math.random() * 4)];
    powerUpsRef.current.push({ x, y, type, dy });
  }, []);

  const applyPowerUp = useCallback(
    (type: PowerUpType) => {
      activeEffectsRef.current.add(type);

      switch (type) {
        case 'expand':
          paddleRef.current.w = paddleRef.current.baseW * 1.6;
          expandTimerRef.current = 600; // ~10s at 60fps
          break;
        case 'multi': {
          const existing = ballsRef.current;
          if (existing.length > 0) {
            const b = existing[0];
            const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
            const newBalls: Ball[] = [];
            for (let i = 0; i < 2; i++) {
              const angle = -Math.PI / 2 + (i === 0 ? -0.2 : 0.2);
              newBalls.push({
                x: b.x,
                y: b.y,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
              });
            }
            existing.push(...newBalls);
          }
          setTimeout(() => activeEffectsRef.current.delete('multi'), 200);
          break;
        }
        case 'slow':
          if (!activeEffectsRef.current.has('slow')) {
            for (const ball of ballsRef.current) {
              ball.dx *= 0.6;
              ball.dy *= 0.6;
            }
          }
          slowTimerRef.current += 480; // 叠加只延长时间
          break;
        case 'life':
          livesRef.current = Math.min(livesRef.current + 1, 5);
          setTimeout(() => activeEffectsRef.current.delete('life'), 500);
          break;
        case 'pierce':
          pierceTimerRef.current = 480; // ~8s at 60fps
          break;
      }
      emitInfo();
    },
    [emitInfo]
  );

  const draw = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;
    const paddle = paddleRef.current;
    const ballR = Math.max(3, Math.round(w * 0.004));

    ctx.clearRect(0, 0, w, h);

    // bricks
    for (const b of bricksRef.current) {
      if (!b.alive) continue;
      ctx.globalAlpha = b.hp >= 3 ? 1 : b.hp === 2 ? 0.8 : 0.6;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.roundRect(b.x, b.y, b.w, b.h, 3);
      ctx.fill();
      if (b.hp >= 2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // power-ups
    for (const p of powerUpsRef.current) {
      ctx.fillStyle = POWERUP_COLORS[p.type];
      ctx.shadowColor = POWERUP_COLORS[p.type];
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, POWERUP_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(POWERUP_LABELS[p.type], p.x, p.y);
    }

    // paddle
    const paddleGrad = ctx.createLinearGradient(
      paddle.x,
      h - PADDLE_HEIGHT,
      paddle.x + paddle.w,
      h
    );
    paddleGrad.addColorStop(0, '#06b6d4');
    paddleGrad.addColorStop(1, '#8b5cf6');
    ctx.fillStyle = paddleGrad;
    ctx.beginPath();
    ctx.roundRect(paddle.x, h - PADDLE_HEIGHT - 8, paddle.w, PADDLE_HEIGHT, 6);
    ctx.fill();

    // expand glow
    if (activeEffectsRef.current.has('expand')) {
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(
        paddle.x - 2,
        h - PADDLE_HEIGHT - 10,
        paddle.w + 4,
        PADDLE_HEIGHT + 4,
        8
      );
      ctx.stroke();
    }

    // balls
    for (const ball of ballsRef.current) {
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = slowTimerRef.current > 0 ? '#eab308' : '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballR, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, []);

  const update = useCallback(
    (canvas: HTMLCanvasElement) => {
      const w = canvas.width;
      const h = canvas.height;
      const paddle = paddleRef.current;
      const keys = keysRef.current;
      const ballR = Math.max(3, Math.round(w * 0.004));
      // 速度按画布宽度缩放（基准 800px）
      const speedScale = w / 800;

      // 键盘 AD 控制挡板
      const step = 8;
      if (keys.has('a') || keys.has('A')) paddle.x = Math.max(0, paddle.x - step);
      if (keys.has('d') || keys.has('D')) paddle.x = Math.min(w - paddle.w, paddle.x + step);

      // timers
      if (expandTimerRef.current > 0) {
        expandTimerRef.current--;
        if (expandTimerRef.current <= 0) {
          paddle.w = paddle.baseW;
          activeEffectsRef.current.delete('expand');
          emitInfo();
        }
      }
      if (slowTimerRef.current > 0) {
        slowTimerRef.current--;
        if (slowTimerRef.current <= 0) {
          activeEffectsRef.current.delete('slow');
          emitInfo();
        }
      }
      if (pierceTimerRef.current > 0) {
        pierceTimerRef.current--;
        if (pierceTimerRef.current <= 0) {
          activeEffectsRef.current.delete('pierce');
          emitInfo();
        }
      }

      // power-ups fall
      for (let i = powerUpsRef.current.length - 1; i >= 0; i--) {
        const p = powerUpsRef.current[i];
        p.y += p.dy;
        if (
          p.y + POWERUP_SIZE / 2 >= h - PADDLE_HEIGHT - 8 &&
          p.x >= paddle.x &&
          p.x <= paddle.x + paddle.w
        ) {
          applyPowerUp(p.type);
          powerUpsRef.current.splice(i, 1);
          continue;
        }
        if (p.y > h + POWERUP_SIZE) {
          powerUpsRef.current.splice(i, 1);
        }
      }

      // balls
      const ballsToRemove: number[] = [];
      for (let bi = 0; bi < ballsRef.current.length; bi++) {
        const ball = ballsRef.current[bi];
        ball.x += ball.dx;
        ball.y += ball.dy;

        // wall — 含位置修正防止卡边
        if (ball.x - ballR <= 0) {
          ball.dx = Math.abs(ball.dx);
          ball.x = ballR;
        } else if (ball.x + ballR >= w) {
          ball.dx = -Math.abs(ball.dx);
          ball.x = w - ballR;
        }
        if (ball.y - ballR <= 0) {
          ball.dy = Math.abs(ball.dy);
          ball.y = ballR;
        }

        // paddle
        if (
          ball.dy > 0 &&
          ball.y + ballR >= h - PADDLE_HEIGHT - 8 &&
          ball.y + ballR <= h - 4 &&
          ball.x >= paddle.x - 2 &&
          ball.x <= paddle.x + paddle.w + 2
        ) {
          ball.dy = -Math.abs(ball.dy);
          const hit = (ball.x - paddle.x) / paddle.w - 0.5;
          const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          ball.dx = hit * speed * 1.5;
          // normalize speed
          const newSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
          const targetSpeed = (slowTimerRef.current > 0 ? 2.8 : 3.5 + levelRef.current * 0.2) * speedScale;
          ball.dx = (ball.dx / newSpeed) * targetSpeed;
          ball.dy = (ball.dy / newSpeed) * targetSpeed;
        }

        // brick collision
        for (const b of bricksRef.current) {
          if (!b.alive) continue;
          if (
            ball.x + ballR > b.x &&
            ball.x - ballR < b.x + b.w &&
            ball.y + ballR > b.y &&
            ball.y - ballR < b.y + b.h
          ) {
            b.hp--;
            if (b.hp <= 0) {
              b.alive = false;
              scoreRef.current += 10 * levelRef.current;
              spawnPowerUp(b.x + b.w / 2, b.y + b.h / 2, (3.5 + levelRef.current * 0.2) * speedScale * 0.5);
            }
            if (!activeEffectsRef.current.has('pierce')) {
              ball.dy *= -1;
            }
            emitInfo();
            break;
          }
        }

        // ball lost
        if (ball.y - ballR > h) {
          ballsToRemove.push(bi);
        }
      }

      // remove lost balls (reverse order)
      for (let i = ballsToRemove.length - 1; i >= 0; i--) {
        ballsRef.current.splice(ballsToRemove[i], 1);
      }

      // all balls lost → lose life
      if (ballsRef.current.length === 0) {
        livesRef.current--;
        emitInfo();
        if (livesRef.current <= 0) {
          return 'over' as GameState;
        }
        return 'lifeLost' as GameState;
      }

      // all bricks cleared → next level
      if (bricksRef.current.every((b) => !b.alive)) {
        levelRef.current++;
        livesRef.current = Math.min(livesRef.current + 1, LIVES_PER_LEVEL + 1);
        initLevel(canvas, true);
        return 'levelUp' as GameState;
      }

      return 'running' as GameState;
    },
    [resetBall, initLevel, spawnPowerUp, applyPowerUp, emitInfo]
  );

  const gameLoop = useCallback(
    (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
      if (stateRef.current !== 'running' && stateRef.current !== 'levelUp') return;

      if (stateRef.current === 'levelUp') {
        // brief pause then continue
        stateRef.current = 'running';
        setGameState('running');
      }

      const result = update(canvas);
      draw(ctx, canvas);

      if (result === 'running') {
        rafRef.current = requestAnimationFrame(() => gameLoop(canvas, ctx));
      } else if (result === 'levelUp') {
        // show level up briefly then continue
        stateRef.current = 'levelUp';
        setGameState('levelUp');
        draw(ctx, canvas);
        setTimeout(() => {
          stateRef.current = 'running';
          setGameState('running');
          rafRef.current = requestAnimationFrame(() => gameLoop(canvas, ctx));
        }, 1200);
      } else {
        stateRef.current = result;
        setGameState(result);
        draw(ctx, canvas);
      }
    },
    [update, draw]
  );

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    initLevel(canvas);
    stateRef.current = 'running';
    setGameState('running');
    gameLoop(canvas, ctx);
  }, [initLevel, gameLoop]);

  const continueGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ballsRef.current = [resetBall(w, h)];
    stateRef.current = 'running';
    setGameState('running');
    gameLoop(canvas, ctx);
  }, [resetBall, gameLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvasSizeRef.current = { w: rect.width, h: rect.height };
    };

    resize();
    // 首次 idle 状态绘制初始帧
    const ctx = canvas.getContext('2d');
    if (ctx && stateRef.current === 'idle') {
      initLevel(canvas);
      draw(ctx, canvas);
    }

    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // mouse / touch / keyboard control
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const movePaddle = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const paddle = paddleRef.current;
      paddle.x = Math.max(0, Math.min(canvas.width - paddle.w, x - paddle.w / 2));
    };

    const onMouseMove = (e: MouseEvent) => movePaddle(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      movePaddle(e.touches[0].clientX);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      // 防止按键滚动页面
      if (e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const levelUpMsg =
    gameState === 'levelUp' ? `第 ${levelRef.current} 关` : '';

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 'var(--radius-3)',
          cursor: 'default',
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)',
        }}
      />
      {gameState === 'lifeLost' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 'var(--radius-3)',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 600, color: '#f43f5e' }}>
            ❤️‍🔥 损失一条命！
          </span>
          <span style={{ fontSize: 14, color: '#94a3b8' }}>
            剩余 {livesRef.current} 条命 · 第 {levelRef.current} 关 · 得分 {scoreRef.current}
          </span>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button
              onClick={continueGame}
              style={{
                padding: '10px 28px',
                borderRadius: 8,
                border: 'none',
                background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              继续
            </button>
            <button
              onClick={startGame}
              style={{
                padding: '10px 28px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#f8fafc',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              重新开始
            </button>
          </div>
        </div>
      )}
      {gameState !== 'running' && gameState !== 'levelUp' && gameState !== 'lifeLost' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 'var(--radius-3)',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 600, color: '#f8fafc' }}>
            {gameState === 'over' ? '游戏结束' : '弹球消砖'}
          </span>
          {gameState === 'over' && (
            <span style={{ fontSize: 14, color: '#94a3b8' }}>
              到达第 {levelRef.current} 关 · 得分 {scoreRef.current}
            </span>
          )}
          <button
            onClick={startGame}
            style={{
              padding: '10px 28px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              marginTop: 4,
            }}
          >
            {gameState === 'idle' ? '开始游戏' : '再来一局'}
          </button>
          {gameState === 'idle' && (
            <span style={{ fontSize: 12, color: '#64748b' }}>
              移动鼠标 / 触摸 / 键盘 A D 控制挡板
            </span>
          )}
        </div>
      )}
      {gameState === 'levelUp' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 'var(--radius-3)',
            animation: 'fadeInUp 0.2s ease',
          }}
        >
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: '#06b6d4',
              textShadow: '0 0 20px rgba(6,182,212,0.5)',
            }}
          >
            {levelUpMsg}
          </span>
        </div>
      )}
    </div>
  );
}
