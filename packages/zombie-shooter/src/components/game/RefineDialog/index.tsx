import { useState, useEffect, useRef } from 'react';
import { Text, Button } from '@radix-ui/themes';
import { ELEMENT_INFO, type ElementType } from '@/game/data/equipment';
import type { Quality } from '@/game/data/gems';
import { formatCurrency } from '@/utils/formatCurrency';
import styles from './index.module.less';

interface RefineDialogProps {
  quality: Quality;
  cost: number;
  damageRange: { min: number; max: number };
  currentAffix?: { elementType: string; damage: number };
  onRefine: () => void;
  onClose: () => void;
  refining: boolean;
  result?: { elementType: string; damage: number };
}

const ELEMENTS: ElementType[] = ['fire', 'thunder', 'water', 'wind', 'earth'];

export function RefineDialog({ quality, cost, damageRange, currentAffix, onRefine, onClose, refining, result }: RefineDialogProps) {
  const [currentElement, setCurrentElement] = useState<ElementType>('fire');
  const [cursorPos, setCursorPos] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!refining) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    const elementInterval = 80;
    let lastElementSwitch = 0;
    let targetPos = Math.random() * 100;
    let lastPosSwitch = 0;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed - lastPosSwitch > 50) {
        lastPosSwitch = elapsed;
        targetPos = Math.random() * 100;
      }
      setCursorPos(targetPos);

      if (elapsed - lastElementSwitch > elementInterval) {
        lastElementSwitch = elapsed;
        setCurrentElement(ELEMENTS[Math.floor(Math.random() * ELEMENTS.length)]);
      }

      if (elapsed < 1500) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [refining]);

  const currentDamage = Math.floor(damageRange.min + (cursorPos / 100) * (damageRange.max - damageRange.min));

  // 显示的数据
  const displayData = result || (refining ? { elementType: currentElement, damage: currentDamage } : currentAffix);
  const hasData = displayData && displayData.damage > 0;
  const displayElem = displayData ? ELEMENT_INFO[displayData.elementType as ElementType] : null;

  return (
    <div className={styles.overlay} onClick={refining ? undefined : onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <Text size="3" weight="bold" style={{ marginBottom: 12 }}>
          {refining ? '洗练中...' : '元素洗练'}
        </Text>

        {/* 元素显示 */}
        <div className={styles.elementDisplay}>
          {hasData ? (
            <>
              <Text size="5">{displayElem?.icon}</Text>
              <Text size="4" weight="bold" style={{ color: displayElem?.color }}>
                {displayElem?.name}系
              </Text>
            </>
          ) : (
            <Text size="3" color="gray">未洗练</Text>
          )}
        </div>

        {/* 进度条 */}
        <div className={styles.damageBarWrapper}>
          <div className={styles.damageBar}>
            <div className={styles.damageBarFill} style={{ width: `${result ? ((result.damage - damageRange.min) / (damageRange.max - damageRange.min)) * 100 : cursorPos}%` }} />
            <div className={styles.cursor} style={{ left: `${result ? ((result.damage - damageRange.min) / (damageRange.max - damageRange.min)) * 100 : cursorPos}%` }} />
          </div>
          <div className={styles.damageBarLabels}>
            <Text size="1" color="gray">{damageRange.min}</Text>
            <Text size="2" weight="bold" color="orange">
              {result ? result.damage : currentDamage}
            </Text>
            <Text size="1" color="gray">{damageRange.max}</Text>
          </div>
        </div>

        {/* 按钮区域 */}
        <div className={styles.buttonRow}>
          {!refining && (
            <>
              <Text size="1" color="gray">消耗 {formatCurrency(cost)} 铜钱</Text>
              <Button size="2" onClick={onRefine}>
                {result ? '再次洗练' : '洗练'}
              </Button>
              {result && (
                <Button size="2" variant="soft" onClick={onClose}>
                  关闭
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
