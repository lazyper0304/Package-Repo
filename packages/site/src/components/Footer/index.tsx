import { useEffect, useState } from 'react';

interface FooterProps {
  name: string;
}

export function Footer({ name }: FooterProps) {
  const [stats, setStats] = useState({ total: 0, today: 0 });

  useEffect(() => {
    fetch('/api/visit/count')
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats({ total: data.total || 0, today: data.today || 0 });
      })
      .catch(() => {});
  }, []);

  return (
    <footer style={{
      marginTop: 'auto',
      padding: '20px 24px',
      textAlign: 'center',
      fontSize: '13px',
      color: 'var(--text-tertiary, #94a3b8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      flexWrap: 'wrap',
    }}>
      <span>总访问量: {stats.total.toLocaleString()}</span>
      <span style={{ opacity: 0.4 }}>|</span>
      <span>今日访问量: {stats.today.toLocaleString()}</span>
      <span style={{ opacity: 0.4 }}>|</span>
      <span>All Rights Reserved© 2026 {name}</span>
    </footer>
  );
}
