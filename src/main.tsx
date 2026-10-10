// Safeguard against interceptor extensions attempting to assign to getter-only window.fetch
try {
  const _orig = window.fetch;
  let _current = _orig;
  Object.defineProperty(window, 'fetch', {
    get: () => _current,
    set: (v) => { _current = v; },
    configurable: true,
    enumerable: true,
  });
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
