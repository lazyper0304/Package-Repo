import React, { forwardRef } from 'react';
import { TierRow } from '../TierRow';
import { useTierList } from '../../store/TierListContext';
import styles from './index.module.less';

export const TierBoard = forwardRef<HTMLDivElement>((_, ref) => {
  const { state } = useTierList();

  return (
    <div ref={ref} className={styles.board}>
      {state.rows.map((row) => (
        <TierRow key={row.id} row={row} />
      ))}
    </div>
  );
});

TierBoard.displayName = 'TierBoard';
