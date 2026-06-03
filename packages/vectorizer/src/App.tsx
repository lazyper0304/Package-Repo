import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Theme, Card } from '@radix-ui/themes';
import { useLocalStorageState } from 'ahooks';
import { GradientBackground } from './components/GradientBackground';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadArea } from './components/UploadArea';
import { ConfigPanel } from './components/ConfigPanel';
import { ProgressBar } from './components/ProgressBar';
import { ResultView } from './components/ResultView';
import {
  vectorizeImage,
  DEFAULT_CONFIG,
  type VectorizeConfig,
  type VectorizeResult,
} from './utils/vectorize';
import styles from './App.module.less';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [config, setConfig] = useState<VectorizeConfig>(DEFAULT_CONFIG);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<VectorizeResult | null>(null);
  const cancelRef = useRef(false);

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

  const handleConvert = useCallback(async (f: File, cfg: VectorizeConfig) => {
    cancelRef.current = false;
    setProcessing(true);
    setProgress(0);
    setResult(null);

    try {
      const res = await vectorizeImage(f, cfg, (p) => {
        if (!cancelRef.current) setProgress(p);
      });
      if (!cancelRef.current) {
        setResult(res);
      }
    } catch (err) {
      console.error('转换失败:', err);
      if (!cancelRef.current) {
        alert('转换失败，请重试');
      }
    } finally {
      if (!cancelRef.current) {
        setProcessing(false);
      }
    }
  }, []);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    handleConvert(f, config);
  }, [config, handleConvert]);

  const handleConfigChange = useCallback((newConfig: VectorizeConfig) => {
    setConfig(newConfig);
    if (file && !processing) {
      handleConvert(file, newConfig);
    }
  }, [file, processing, handleConvert]);

  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setProgress(0);
    setProcessing(false);
  }, []);

  return (
    <Theme
      appearance={appearance}
      accentColor={appearance === 'dark' ? 'teal' : 'blue'}
      grayColor="gray"
      panelBackground="translucent"
    >
      <GradientBackground />
      <Header themeMode={themeMode || 'system'} onCycleTheme={cycleTheme} />
      <div className={styles.appWrapper}>
        <div className={styles.container}>
          {processing ? (
            <Card className={styles.card}>
              <ProgressBar progress={progress} />
            </Card>
          ) : result ? (
            <Card className={styles.card}>
              <ResultView
                svgContent={result.svgContent}
                svgUrl={result.svgUrl}
                originalUrl={result.originalUrl}
                fileName={file?.name || 'image.svg'}
                onBack={() => setResult(null)}
                onReset={handleReset}
              />
            </Card>
          ) : (
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
                <ConfigPanel
                  config={config}
                  onChange={handleConfigChange}
                  disabled={!file || processing}
                />
              </Card>
            </div>
          )}
        </div>
        <Footer name="图片矢量化" />
      </div>
    </Theme>
  );
}

export default App;
