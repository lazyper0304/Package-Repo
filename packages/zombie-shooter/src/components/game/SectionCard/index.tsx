import type { ReactNode } from 'react';
import styles from './index.module.less';

interface SectionCardProps {
  title?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({ title, extra, children, className }: SectionCardProps) {
  return (
    <div className={`${styles.card} ${className || ''}`}>
      {(title || extra) && (
        <div className={styles.header}>
          {title && <div className={styles.title}>{title}</div>}
          {extra && <div className={styles.extra}>{extra}</div>}
        </div>
      )}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
