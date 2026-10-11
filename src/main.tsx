// Safeguard against interceptor extensions attempting to assign to getter-only window.fetch or Window.prototype.fetch
try {
  let _currentFetch = window.fetch ? window.fetch.bind(window) : undefined;
  try {
    Object.defineProperty(window, 'fetch', {
      get: () => _currentFetch,
      set: (v) => { _currentFetch = v; },
      configurable: true,
      enumerable: true,
    });
  } catch (_) {}

  try {
    if (typeof Window !== 'undefined' && Window.prototype) {
      Object.defineProperty(Window.prototype, 'fetch', {
        get: () => _currentFetch,
        set: (v) => { _currentFetch = v; },
        configurable: true,
        enumerable: true,
      });
    }
  } catch (_) {}
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
