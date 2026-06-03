import { useState, useCallback, useEffect } from 'react';
import { IconButton } from '@radix-ui/themes';
import {
  MdBrightness2,
  MdBrightnessAuto,
  MdBrightnessHigh,
} from 'react-icons/md';

type ThemeMode = 'light' | 'dark' | 'system';

export function Header() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'system';
  });

  const [systemDarkMode, setSystemDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const appearance =
      themeMode === 'system' ? (systemDarkMode ? 'dark' : 'light') : themeMode;
    document.documentElement.setAttribute('data-theme', appearance);
  }, [themeMode, systemDarkMode]);

  const cycleTheme = useCallback(() => {
    const next =
      themeMode === 'light'
        ? 'dark'
        : themeMode === 'dark'
          ? 'system'
          : 'light';
    setThemeMode(next);
    localStorage.setItem('theme-mode', next);
  }, [themeMode]);

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
          alt="图片矢量化"
        />
        <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>
          图片矢量化工具
        </h1>
      </div>
      <IconButton
        variant="soft"
        size="3"
        radius="full"
        onClick={cycleTheme}
        title={`当前: ${{ light: '浅色', dark: '深色', system: '跟随系统' }[themeMode || 'system']}，点击切换`}
      >
        {(themeMode || 'system') === 'light' ? (
          <MdBrightnessHigh size={20} />
        ) : (themeMode || 'system') === 'dark' ? (
          <MdBrightness2 size={20} />
        ) : (
          <MdBrightnessAuto size={20} />
        )}
      </IconButton>
    </header>
  );
}
