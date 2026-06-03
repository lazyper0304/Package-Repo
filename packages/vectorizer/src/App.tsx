import { useState, useCallback } from 'react';
import { Theme } from '@radix-ui/themes';
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

type ViewState = 'upload' | 'config' | 'processing' | 'result';

function App() {
  const [viewState, setViewState] = useState<ViewState>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [config, setConfig] = useState<VectorizeConfig>(DEFAULT_CONFIG);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<VectorizeResult | null>(null);

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setViewState('config');
  }, []);

  const handleBack = useCallback(() => {
    setViewState('upload');
    setFile(null);
    setResult(null);
    setProgress(0);
  }, []);

  const handleBackToConfig = useCallback(() => {
    setViewState('config');
    setResult(null);
    setProgress(0);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setViewState('processing');
    setProgress(0);

    try {
      const res = await vectorizeImage(file, config, setProgress);
      setResult(res);
      setViewState('result');
    } catch (err) {
      console.error('转换失败:', err);
      alert('转换失败，请重试');
      setViewState('config');
    }
  }, [file, config]);

  // 获取系统主题
  const getThemeMode = () => {
    const saved = localStorage.getItem('theme-mode') || 'system';
    if (saved === 'system') {
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return saved;
  };

  return (
    <Theme
      appearance={getThemeMode() as 'light' | 'dark'}
      accentColor="teal"
      grayColor="gray"
      panelBackground="translucent"
    >
      <GradientBackground />
      <Header />
      <div className={styles.appWrapper}>
        <div className={styles.container}>
          {viewState === 'upload' && (
            <div className={styles.card}>
              <UploadArea onFileSelect={handleFileSelect} />
            </div>
          )}

          {viewState === 'config' && (
            <div className={styles.card}>
              <ConfigPanel
                config={config}
                onChange={setConfig}
                onConvert={handleConvert}
                onBack={handleBack}
              />
            </div>
          )}

          {viewState === 'processing' && (
            <div className={styles.card}>
              <ProgressBar progress={progress} />
            </div>
          )}

          {viewState === 'result' && result && (
            <div className={styles.card}>
              <ResultView
                svgContent={result.svgContent}
                svgUrl={result.svgUrl}
                originalUrl={result.originalUrl}
                fileName={file?.name || 'image.svg'}
                onBack={handleBackToConfig}
              />
            </div>
          )}
        </div>
        <Footer name="图片矢量化" />
      </div>
    </Theme>
  );
}

export default App;
