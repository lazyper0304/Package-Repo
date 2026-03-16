import React from 'react'
import 'rc-pagination/assets/index.css'
import styles from './index.module.less'

import RcPagination, { type PaginationProps } from 'rc-pagination'

const Pagination: React.FC<PaginationProps> = (props) => {
  return (
    <RcPagination
      {...props}
      className={styles.pagination}
      showLessItems
      showTotal={(v) => <div className={styles.pagination__total}>共{v}个</div>}
    />
  )
}

export default React.memo(Pagination)
