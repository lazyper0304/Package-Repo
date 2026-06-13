export function Header() {
  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 999,
        padding: '12px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          style={{ width: 42, height: 42 }}
          alt="向僵尸开炮"
        />
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
          向僵尸开炮
        </h1>
      </div>
    </header>
  );
}
