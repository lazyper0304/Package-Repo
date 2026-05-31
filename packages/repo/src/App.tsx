import React, { Suspense, useMemo, useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import { Theme } from '@radix-ui/themes';
import Notify from './components/ui/Notify';
import { AppTypeProvider } from './contexts/AppTypeContext';
import { useLocalStorageState } from 'ahooks';
import API from './services';

type ThemeMode = 'light' | 'dark' | 'system';

const AuthWrapper: React.FC<{
  children: React.ReactNode;
  themeMode: ThemeMode;
  setThemeMode: (value: ThemeMode) => void;
}> = ({ children, themeMode, setThemeMode }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setAuthChecked(true);
      return;
    }
    try {
      const valid = await API.verifyToken();
      setIsAdmin(valid);
      if (!valid) {
        localStorage.removeItem('auth_token');
      }
    } catch {
      localStorage.removeItem('auth_token');
    }
    setAuthChecked(true);
  }, []);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      setIsAdmin(false);
    }
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
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
    </>
  );
};

const App: React.FC = () => {
  const [themeMode, setThemeMode] = useLocalStorageState<ThemeMode>('theme-mode', {
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
    const currentTheme = themeMode === 'system' ? (systemDarkMode ? 'dark' : 'light') : themeMode;
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [themeMode, systemDarkMode]);

  useEffect(() => {
    fetch('/api/visit/log').catch(() => {});
  }, []);

  return (
    <AppTypeProvider>
      <Theme appearance={appearance} accentColor={appearance === 'dark' ? 'teal' : 'blue'} grayColor="gray" panelBackground="translucent">
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', fontSize: '24px' }}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<AuthWrapper themeMode={themeMode} setThemeMode={setThemeMode}><Home /></AuthWrapper>} />
              <Route path="repo" element={<AuthWrapper themeMode={themeMode} setThemeMode={setThemeMode}><Home /></AuthWrapper>} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Notify />
      </Theme>
    </AppTypeProvider>
  );
};

export default React.memo(App);
