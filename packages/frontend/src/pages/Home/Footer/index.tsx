import React, { useEffect, useState } from 'react';
import styles from './index.module.less';
import API from '@/services';
import useMobile from '@/hooks/useMobile';

const Footer: React.FC = () => {
  const isMobile = useMobile();

  // 访问日志统计数据
  const [visitStats, setVisitStats] = useState({ total: 0, today: 0 });

  // 获取访问日志统计数据
  useEffect(() => {
    async function fetchVisitStats() {
      const result = await API.getVisitStats();
      if (result.success) {
        setVisitStats({ total: result.total, today: result.today });
      }
    }

    fetchVisitStats();
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.footer__content}>
        <div className={styles.footer__stats}>
          <span
            className={styles.footer__stats__item}
            style={{ marginRight: 6 }}
          >
            总访问量: {visitStats.total}
          </span>
          <span className={styles.footer__stats__item}>
            今日访问量: {visitStats.today}
          </span>
        </div>

        {!isMobile && <span className={styles.footer__divider}>|</span>}

        <div className={styles.footer__copyright}>
          All Rights Reserved© 2026 Package Repo
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);
