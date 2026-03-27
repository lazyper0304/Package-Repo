import React, { Suspense, useMemo } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router';
import Home from './pages/Home';
import { Theme } from '@radix-ui/themes';
import Notify from './components/ui/Notify';
import { AppTypeProvider } from './contexts/AppTypeContext';

// 权限检查组件
const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  // 根据访问的 URL 路径判断权限
  const isAdmin = useMemo(() => {
    // 检查是否访问的是 repo（管理员权限）
    return location.pathname === '/repo';
  }, [location.pathname]);

  // 将权限信息传递给子组件
  return React.cloneElement(children as React.ReactElement, { isAdmin });
};

const App: React.FC = () => {
  return (
    <AppTypeProvider>
      <Theme>
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
                    <AuthWrapper>
                      <Home />
                    </AuthWrapper>
                  }
                ></Route>
                <Route
                  path="repo"
                  element={
                    <AuthWrapper>
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
