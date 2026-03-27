import React from 'react';
import 'rc-pagination/assets/index.css';
import styles from './index.module.less';

import RcPagination, { type PaginationProps } from 'rc-pagination';
import useMobile from '@/hooks/useMobile';

const Pagination: React.FC<PaginationProps> = (props) => {
  const isMobile = useMobile();

  return (
    <RcPagination
      {...props}
      className={`${styles.pagination} ${isMobile ? styles.pagination__mobile : ''}`}
      showLessItems={isMobile}
      showTotal={(v) => <div className={styles.pagination__total}>共{v}个</div>}
    />
  );
};

export default React.memo(Pagination);
