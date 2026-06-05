import { IconButton } from '@radix-ui/themes';
import {
  MdBrightness2, MdBrightnessAuto, MdBrightnessHigh,
} from 'react-icons/md';

type ThemeMode = 'light' | 'dark' | 'system';

type HeaderProps = {
  themeMode: ThemeMode;
  onCycleTheme: () => void;
};

export function Header({ themeMode, onCycleTheme }: HeaderProps) {
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
          src={`${import.meta.env.BASE_URL}sudoku.png`}
          style={{ width: 42, height: 42 }}
          alt="数独"
        />
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
          数独
        </h1>
      </div>
      <IconButton
        variant="soft"
        size="3"
        radius="full"
        onClick={onCycleTheme}
        title={`当前: ${{ light: '浅色', dark: '深色', system: '跟随系统' }[themeMode]}，点击切换`}
      >
        {themeMode === 'light' ? (
          <MdBrightnessHigh size={20} />
        ) : themeMode === 'dark' ? (
          <MdBrightness2 size={20} />
        ) : (
          <MdBrightnessAuto size={20} />
        )}
      </IconButton>
    </header>
  );
}
