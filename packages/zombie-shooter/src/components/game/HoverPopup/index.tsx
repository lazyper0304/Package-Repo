import { useState, useRef, useEffect } from 'react';
import { useMobile } from '@/hooks/useMobile';
import styles from './index.module.less';

interface HoverPopupProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export function HoverPopup({ trigger, children }: HoverPopupProps) {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current && !triggerRef.current.contains(target)) {
        setIsOpen(false);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const startCloseTimer = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100);
  };

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();

    // 紧贴物品右侧显示
    let top = rect.top + rect.height / 2;
    let left = rect.right;

    // 防止超出右边界
    if (left + 200 > window.innerWidth) {
      left = rect.left - 200;
    }

    // 防止超出底部边界
    if (top + 150 > window.innerHeight) {
      top = window.innerHeight - 150;
    }

    // 防止超出顶部边界
    if (top < 8) {
      top = 8;
    }

    setPosition({ top, left });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      calculatePosition();
      setIsOpen(prev => !prev);
    }
  };

  const handleMouseEnter = () => {
    if (!isMobile) {
      clearCloseTimer();
      calculatePosition();
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      startCloseTimer();
    }
  };

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div ref={triggerRef} onClick={handleClick}>
        {trigger}
      </div>
      {isOpen && (
        <>
          {isMobile && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
          <div
            className={isMobile ? styles.popup : styles.dropdown}
            style={isMobile ? {} : { top: `${position.top}px`, left: `${position.left}px` }}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={handleMouseLeave}
          >
            {children}
          </div>
        </>
      )}
    </div>
  );
}
