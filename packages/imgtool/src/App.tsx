import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Theme, Card } from '@radix-ui/themes';
import { useLocalStorageState } from 'ahooks';
import { useMobile } from './hooks/useMobile';
import { GradientBackground } from './components/GradientBackground';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadArea } from './components/UploadArea';
import { EditPanel } from './components/EditPanel';
import styles from './App.module.less';

function App() {
  const isMobile = useMobile();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [originalFormat, setOriginalFormat] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [themeMode, setThemeMode] = useLocalStorageState<'light' | 'dark' | 'system'>('theme-mode', {
    defaultValue: 'system',
  });

  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const appearance = useMemo(() => {
    if (themeMode === 'system') {
      return systemDarkMode ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemDarkMode]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appearance);
  }, [appearance]);

  const cycleTheme = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light');
  }, [themeMode, setThemeMode]);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);

    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    setOriginalFormat(ext);

    const img = new Image();
    img.onload = () => {
      setOriginalWidth(img.naturalWidth);
      setOriginalHeight(img.naturalHeight);
    };
    img.src = url;
  }, []);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreviewUrl(null);
    setOriginalWidth(0);
    setOriginalHeight(0);
    setOriginalFormat('');
  }, []);

  const handleExport = useCallback(
    (width: number, height: number, format: string) => {
      if (!file || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'bmp' ? 'image/bmp' : `image/${format}`;
        const quality = format === 'jpeg' || format === 'webp' ? 0.9 : undefined;

        canvas.toBlob(
          (blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `image.${format === 'jpeg' ? 'jpg' : format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          },
          mimeType,
          quality
        );
      };
      img.src = URL.createObjectURL(file);
    },
    [file]
  );

  return (
    <Theme
      appearance={appearance}
      accentColor={appearance === 'dark' ? 'teal' : 'blue'}
      grayColor="gray"
      panelBackground="translucent"
    >
      <GradientBackground />
      <Header themeMode={themeMode || 'system'} onCycleTheme={cycleTheme} />
      <div className={isMobile ? styles.appWrapperMobile : styles.appWrapper}>
        <div className={isMobile ? styles.containerMobile : styles.container}>
          <div className={styles.mainGrid}>
            <Card className={styles.card}>
              <UploadArea
                onFileSelect={handleFileSelect}
                previewUrl={previewUrl}
                hasFile={!!file}
                onReset={handleReset}
              />
            </Card>
            <Card className={styles.card}>
              <EditPanel
                originalWidth={originalWidth}
                originalHeight={originalHeight}
                originalFormat={originalFormat}
                onExport={handleExport}
                disabled={!file}
              />
            </Card>
          </div>
        </div>
        <div className={isMobile ? styles.footerMobile : styles.footer}>
          <Footer name="图片尺寸格式工具" />
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </Theme>
  );
}

export default App;
