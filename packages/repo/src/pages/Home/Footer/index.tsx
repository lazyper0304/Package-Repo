import React from 'react';

interface FooterProps {
  name: string;
}

const Footer: React.FC<FooterProps> = ({ name }) => {
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
      <span>All Rights Reserved© 2026 {name}</span>
    </footer>
  );
};

export default React.memo(Footer);
