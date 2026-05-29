import React, { Suspense, useMemo, useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import Home from './pages/Home';
import { Theme } from '@radix-ui/themes';
import Notify from './components/ui/Notify';
import { AppTypeProvider } from './contexts/AppTypeContext';
import { useLocalStorageState } from 'ahooks';
import LoginDialog from './components/LoginDialog';
import API from './services';

// 主题模式类型
type ThemeMode = 'light' | 'dark' | 'system';

// 权限检查组件
const AuthWrapper: React.FC<{
  children: React.ReactNode;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
}> = ({ children, themeMode, setThemeMode }) => {
  const location = useLocation();

  const isAdmin = useMemo(() => {
    return location.pathname === '/repo';
  }, [location.pathname]);

  const [showLogin, setShowLogin] = useState(false);
  const [loginExpired, setLoginExpired] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // 检查 token 是否有效
  const checkAuth = useCallback(async () => {
    if (!isAdmin) {
      setAuthChecked(true);
      return;
    }
    const token = sessionStorage.getItem('auth_token');
    if (!token) {
      setShowLogin(true);
      setAuthChecked(true);
      return;
    }
    const valid = await API.verifyToken();
    if (!valid) {
      sessionStorage.removeItem('auth_token');
      setShowLogin(true);
    }
    setAuthChecked(true);
  }, [isAdmin]);

  useEffect(() => {
    setAuthChecked(false);
    checkAuth();
  }, [isAdmin]);

  // 监听 token 过期事件：不跳转，直接弹登录框
  useEffect(() => {
    function handleAuthExpired() {
      if (isAdmin) {
        setLoginExpired(true);
        setShowLogin(true);
      }
    }
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, [isAdmin]);

  if (isAdmin && !authChecked) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      {React.cloneElement(children as React.ReactElement, {
        isAdmin,
        themeMode,
        setThemeMode,
      })}
      {isAdmin && (
        <LoginDialog
          open={showLogin}
          expired={loginExpired}
          onLoginSuccess={() => {
            setShowLogin(false);
            setLoginExpired(false);
          }}
        />
      )}
    </>
  );
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
        const token = sessionStorage.getItem('auth_token');
        await fetch('/api/visit/log', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
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
