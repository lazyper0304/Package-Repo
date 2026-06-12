export function Footer({ name }: { name: string }) {
  return (
    <footer
      style={{
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
      }}
    >
      <span>All Rights Reserved© 2026 {name}</span>
    </footer>
  );
}
