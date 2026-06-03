import React from 'react';
import { Text } from '@radix-ui/themes';
import styles from './ProgressBar.module.less';

type Props = {
  progress: number;
};

export const ProgressBar: React.FC<Props> = ({ progress }) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text size="3">处理进度</Text>
        <Text size="3">{Math.round(progress)}%</Text>
      </div>
      <div className={styles.track}>
        <div
          className={styles.bar}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
