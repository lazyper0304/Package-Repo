import { useEffect, useRef } from 'react';
import { initPhaserGame, destroyPhaserGame } from '../../../game/PhaserGame';
import styles from './index.module.less';

export function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const game = initPhaserGame(containerRef.current);

    return () => {
      destroyPhaserGame();
    };
  }, []);

  return (
    <div className={styles.container}>
      <div ref={containerRef} className={styles.gameCanvas} />
    </div>
  );
}
