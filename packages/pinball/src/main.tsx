import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@radix-ui/themes/styles.css';
import App from './App';
import './index.less';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
