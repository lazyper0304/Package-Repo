import React, { Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import Home from './pages/Home';
import { Theme } from '@radix-ui/themes';
import Notify from './components/ui/Notify';

const App: React.FC = () => {
  return (
    <Theme>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/">
              <Route index element={<Home />}></Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Notify />
    </Theme>
  );
};

export default React.memo(App);
