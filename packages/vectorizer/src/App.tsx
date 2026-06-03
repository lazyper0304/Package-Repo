import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Theme, Card, Flex, Text, Button } from '@radix-ui/themes';
import { useLocalStorageState } from 'ahooks';
import copy from 'copy-to-clipboard';
import { GradientBackground } from './components/GradientBackground';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UploadArea } from './components/UploadArea';
import { ConfigPanel } from './components/ConfigPanel';
import { ProgressBar } from './components/ProgressBar';
import { downloadSvg } from './utils/vectorize';
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
    cancelRef.current = true;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setTimeout(() => handleConvert(f, config), 0);
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
          <div className={styles.topGrid}>
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

          {processing && (
            <Card className={styles.card}>
              <ProgressBar progress={progress} />
            </Card>
          )}

          {result && (
            <Card className={styles.resultCard}>
              <Flex justify="between" align="center" style={{ marginBottom: 16 }}>
                <Text size="4" weight="bold">转换结果</Text>
                <Flex gap="2">
                  <Button
                    size="2"
                    color="green"
                    onClick={() => {
                      copy(result.svgContent);
                      alert('SVG内容已复制到剪贴板');
                    }}
                  >
                    复制SVG
                  </Button>
                  <Button size="2" onClick={() => downloadSvg(result.svgContent, file?.name || 'image.svg')}>
                    下载SVG
                  </Button>
                </Flex>
              </Flex>
              <Flex gap="4" className={styles.compareGrid}>
                <div className={styles.compareItem}>
                  <Text size="2" weight="bold" style={{ marginBottom: 8 }}>原图</Text>
                  <div className={styles.compareImage}>
                    <img src={result.originalUrl} alt="原图" />
                  </div>
                </div>
                <div className={styles.compareItem}>
                  <Text size="2" weight="bold" style={{ marginBottom: 8 }}>矢量化结果</Text>
                  <div className={styles.compareImage}>
                    <img src={result.svgUrl} alt="SVG结果" />
                  </div>
                </div>
              </Flex>
            </Card>
          )}
        </div>
        <Footer name="图片矢量化" />
      </div>
    </Theme>
  );
}

export default App;
