import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Theme, Button, Flex, IconButton, Card } from '@radix-ui/themes'
import { MdBrightness2, MdBrightnessAuto, MdBrightnessHigh } from 'react-icons/md'
import { useLocalStorageState } from 'ahooks'
import { useMobile } from './hooks/useMobile'
import { GradientBackground } from './components/GradientBackground'
import UploadArea from './components/UploadArea'
import WatermarkSelector from './components/WatermarkSelector'
import OptionsPanel from './components/OptionsPanel'
import ResultModal from './components/ResultModal'
import { Footer } from './components/Footer'
import { watermarks, drawWatermark, drawTiledWatermark, type PositionValue, type OptionsChange } from './watermarks'
import styles from './App.module.less'

export default function App() {
  const isMobile = useMobile()
  const [image, setImage] = useState<string | null>(null)
  const [selectedWatermark, setSelectedWatermark] = useState<string>(watermarks[0].id)
  const [position, setPosition] = useState<PositionValue>('center')
  const [opacity, setOpacity] = useState<number>(100)
  const [size, setSize] = useState<number>(100)
  const [overlayOpacity, setOverlayOpacity] = useState<number>(60)
  const [tiled, setTiled] = useState<boolean>(false)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [themeMode, setThemeMode] = useLocalStorageState<'light' | 'dark' | 'system'>('theme-mode', {
    defaultValue: 'system',
  })

  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  const appearance = useMemo(() => {
    if (themeMode === 'system') {
      return systemDarkMode ? 'dark' : 'light'
    }
    return themeMode
  }, [themeMode, systemDarkMode])

  useEffect(() => {
    fetch('/api/visit/log').catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => setSystemDarkMode(e.matches)
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  useEffect(() => {
    const currentTheme = themeMode === 'system' ? (systemDarkMode ? 'dark' : 'light') : themeMode
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [themeMode, systemDarkMode])

  const cycleTheme = useCallback(() => {
    setThemeMode(themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light')
  }, [themeMode, setThemeMode])

  const handleImageLoad = useCallback((dataUrl: string) => {
    setImage(dataUrl)
  }, [])

  const handleOptionsChange = useCallback((changes: OptionsChange) => {
    if ('position' in changes) setPosition(changes.position!)
    if ('opacity' in changes) setOpacity(changes.opacity!)
    if ('size' in changes) setSize(changes.size!)
    if ('overlayOpacity' in changes) setOverlayOpacity(changes.overlayOpacity!)
    if ('tiled' in changes) setTiled(changes.tiled!)
  }, [])

  const handleReset = () => {
    setImage(null)
    setPosition('center')
    setOpacity(100)
    setSize(100)
    setOverlayOpacity(60)
    setTiled(false)
    setPreviewUrl(null)
    setResultUrl(null)
  }

  const handleGenerate = async () => {
    if (!image) return
    const canvas = canvasRef.current
    if (!canvas) return
    const draw = tiled ? drawTiledWatermark : drawWatermark
    await draw(canvas, image, selectedWatermark, position, opacity, size, overlayOpacity)
    setResultUrl(canvas.toDataURL('image/png'))
  }

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null)
      return
    }
    let cancelled = false
    const canvas = document.createElement('canvas')
    const draw = tiled ? drawTiledWatermark : drawWatermark
    draw(canvas, image, selectedWatermark, position, opacity, size, overlayOpacity).then(() => {
      if (!cancelled) {
        setPreviewUrl(canvas.toDataURL('image/png'))
      }
    })
    return () => {
      cancelled = true
    }
  }, [image, selectedWatermark, position, opacity, size, overlayOpacity, tiled])

  return (
    <Theme
      appearance={appearance}
      accentColor={appearance === 'dark' ? 'teal' : 'blue'}
      grayColor='gray'
      panelBackground='translucent'
    >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={`${import.meta.env.BASE_URL}logo.png`} style={{ width: '42px', height: '42px' }} />
            <h1 style={{ fontSize: '22px', fontWeight: 500, margin: 0 }}>闲鱼水印工具</h1>
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
            <div className={styles.mainGrid}>
              {/* Left: Image area */}
              <Card className={styles.glassCard}>
                <UploadArea
                  onImageLoad={handleImageLoad}
                  previewUrl={previewUrl}
                  hasFile={!!image}
                  onReset={handleReset}
                />
              </Card>
              <Card className={styles.glassCard}>
                <div className={styles.controlsSection}>
                  <WatermarkSelector
                    watermarks={watermarks}
                    selected={selectedWatermark}
                    onSelect={setSelectedWatermark}
                    styles={styles}
                  />
                  <OptionsPanel
                    position={position}
                    opacity={opacity}
                    size={size}
                    overlayOpacity={overlayOpacity}
                    tiled={tiled}
                    onChange={handleOptionsChange}
                    styles={styles}
                  />
                  <Flex gap='3' className={styles.actionButtons}>
                    <Button variant='outline' onClick={handleReset} style={{ flex: 1 }}>
                      重置
                    </Button>
                    <Button onClick={handleGenerate} disabled={!image} style={{ flex: 1 }}>
                      生成水印图片
                    </Button>
                  </Flex>
                </div>
              </Card>
            </div>
          </div>

          <div className={isMobile ? styles.footerMobile : styles.footer}>
            <Footer name='闲鱼水印工具' />
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <ResultModal show={!!resultUrl} imageUrl={resultUrl} onClose={() => setResultUrl(null)} />
      </>
    </Theme>
  )
}
