import { useState, useCallback, useRef, useEffect } from 'react';
import { useMobile } from '@/hooks/useMobile';
import styles from './index.module.less';

interface HoverClickPanelProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
}

export function HoverClickPanel({ trigger, children, position = 'left', className }: HoverClickPanelProps) {
  const isMobile = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleClick = useCallback(() => {
    if (isMobile) {
      setIsOpen(prev => !prev);
    }
  }, [isMobile]);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) {
      setIsOpen(true);
    }
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    if (!isMobile) {
      setIsOpen(false);
    }
  }, [isMobile]);

  const positionClass = styles[`panel-${position}`] || styles['panel-left'];

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${className || ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {trigger}
      {isOpen && (
        <div className={`${styles.panel} ${positionClass}`}>
          {children}
        </div>
      )}
    </div>
  );
}
