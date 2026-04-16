import React, { Suspense, useMemo, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import Home from './pages/Home';
import { Theme } from '@radix-ui/themes';
import Notify from './components/ui/Notify';
import { AppTypeProvider } from './contexts/AppTypeContext';
import { useLocalStorageState } from 'ahooks';

// 主题模式类型
type ThemeMode = 'light' | 'dark' | 'system';

// 权限检查组件
const AuthWrapper: React.FC<{ children: React.ReactNode; themeMode: ThemeMode; setThemeMode: (value: ThemeMode) => void }> = ({ children, themeMode, setThemeMode }) => {
  const location = useLocation();

  // 根据访问的 URL 路径判断权限
  const isAdmin = useMemo(() => {
    // 检查是否访问的是 repo（管理员权限）
    return location.pathname === '/repo';
  }, [location.pathname]);

  // 将权限信息传递给子组件
  return React.cloneElement(children as React.ReactElement, { isAdmin, themeMode, setThemeMode });
};

const App: React.FC = () => {
  // 主题模式状态
  const [themeMode, setThemeMode] = useLocalStorageState<ThemeMode>('theme-mode', {
    defaultValue: 'system',
  });

  // 检测系统颜色模式
  const [systemDarkMode, setSystemDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // 计算当前外观模式
  const appearance = useMemo(() => {
    if (themeMode === 'system') {
      return systemDarkMode ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemDarkMode]);

  // 监听系统颜色模式变化
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setSystemDarkMode(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // 根据主题模式设置根元素的 data-theme 属性
  useEffect(() => {
    const rootElement = document.documentElement;
    const currentTheme = themeMode === 'system' 
      ? (systemDarkMode ? 'dark' : 'light')
      : themeMode;
    
    rootElement.setAttribute('data-theme', currentTheme);
  }, [themeMode, systemDarkMode]);

  // 记录用户访问信息
  useEffect(() => {
    const logVisit = async () => {
      try {
        await fetch('/api/visit/log');
      } catch (error) {
        console.error('记录访问信息失败:', error);
      }
    };

    logVisit();
  }, []);

  return (
    <AppTypeProvider>
      <Theme
        appearance={appearance}
        accentColor={appearance === 'dark' ? 'teal' : 'blue'}
        grayColor="gray"
        panelBackground="translucent"
      >
        <BrowserRouter>
          <Suspense
            fallback={
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  height: '100%',
                  fontSize: '24px',
                }}
              >
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/">
                <Route
                  index
                  element={
                    <AuthWrapper themeMode={themeMode} setThemeMode={setThemeMode}>
                      <Home />
                    </AuthWrapper>
                  }
                ></Route>
                <Route
                  path="repo"
                  element={
                    <AuthWrapper themeMode={themeMode} setThemeMode={setThemeMode}>
                      <Home />
                    </AuthWrapper>
                  }
                ></Route>
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>

        <Notify />
      </Theme>
    </AppTypeProvider>
  );
};

export default React.memo(App);
