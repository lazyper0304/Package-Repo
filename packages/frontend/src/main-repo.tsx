import { createRoot } from 'react-dom/client';
import './index.less';
import App from './App.tsx';
import '@radix-ui/themes/styles.css';

// 管理员页面入口
createRoot(document.getElementById('root')!).render(<App />);
