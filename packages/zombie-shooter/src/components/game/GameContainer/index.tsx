import { useEffect, useRef } from 'react';
import { initPhaserGame, destroyPhaserGame } from '@/game/PhaserGame';
import { gameBridge } from '@/game/bridge';
import styles from './index.module.less';

interface GameContainerProps {
  onReady?: () => void;
}

export function GameContainer({ onReady }: GameContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const unsub = gameBridge.on('scene:ready', () => {
      onReady?.();
    });

    // 延迟创建游戏，确保 App 的事件监听已注册
    const timer = setTimeout(() => {
      if (containerRef.current) {
        initPhaserGame(containerRef.current);
      }
    }, 50);

    return () => {
      unsub();
      clearTimeout(timer);
      destroyPhaserGame();
    };
  }, []);

  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.gameCanvas} />
    </div>
  );
}
