import { useState, useCallback, useEffect } from 'react';
import { Theme, Button, IconButton } from '@radix-ui/themes';
import { MdBrightness2, MdBrightnessAuto, MdBrightnessHigh, MdSettings, MdRefresh, MdDownload } from 'react-icons/md';
import { useLocalStorageState } from 'ahooks';
import { useMobile } from './hooks/useMobile';
import { GradientBackground } from './components/GradientBackground';
import { Footer } from './components/Footer';
import { TierBoard } from './components/TierBoard';
import { ItemPool } from './components/ItemPool';
import { ConfigDialog } from './components/ConfigDialog';
import { TierListProvider, useTierList } from './store/TierListContext';
import { useImageExport } from './hooks/useImageExport';
import styles from './App.module.less';

function AppContent() {
  const isMobile = useMobile();
  const { state, dispatch } = useTierList();
  const { ref: exportRef, exportImage } = useImageExport();
  const [configOpen, setConfigOpen] = useState(false);
  const [themeMode, setThemeMode] = useLocalStorageState<'light' | 'dark' | 'system'>('theme-mode', {
    defaultValue: 'system',
  });
  const [systemDarkMode, setSystemDarkMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false
  );

  const appearance = themeMode === 'system' ? (systemDarkMode ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appearance);
  }, [appearance]);

  // 持久化
  useEffect(() => {
    const saved = localStorage.getItem('tier-list-state');
    if (saved) {
      try {
        dispatch({ type: 'LOAD_STATE', state: JSON.parse(saved) });
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('tier-list-state', JSON.stringify(state));
  }, [state]);

  const cycleTheme = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light');
  }, [themeMode, setThemeMode]);

  return (
    <Theme appearance={appearance} accentColor={appearance === 'dark' ? 'teal' : 'blue'} grayColor="gray" panelBackground="translucent">
      <>
        <GradientBackground />
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
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: 42, height: 42 }} alt="从夯到拉" />
            <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>从夯到拉排名生成器</h1>
          </div>
          <IconButton
            variant='soft'
            size='3'
            radius='full'
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
        <div className={isMobile ? styles.appWrapperMobile : styles.appWrapper}>
          <div className={isMobile ? styles.containerMobile : styles.container}>
            <div className={styles.toolbar}>
              <Button variant="soft" onClick={() => setConfigOpen(true)}><MdSettings /> 配置</Button>
              <Button variant="soft" color="red" onClick={() => dispatch({ type: 'RESET_ALL' })}><MdRefresh /> 重置</Button>
              <Button onClick={exportImage}><MdDownload /> 保存图片</Button>
            </div>

            <div className={styles.tierBoard}>
              <TierBoard ref={exportRef} />
            </div>

            <div className={styles.poolSection}>
              <ItemPool />
            </div>
          </div>
          <div className={isMobile ? styles.footerMobile : styles.footer}>
            <Footer name="从夯到拉" />
          </div>
        </div>

        <ConfigDialog open={configOpen} onClose={() => setConfigOpen(false)} />
      </>
    </Theme>
  );
}

export default function App() {
  return (
    <TierListProvider>
      <AppContent />
    </TierListProvider>
  );
}
