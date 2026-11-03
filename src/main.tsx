import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { applyTheme, getSavedTheme } from './utils/themeManager';

// Initialize and apply user's saved theme
applyTheme(getSavedTheme());

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  const registerServiceWorker = () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.info('ILMS ServiceWorker registered with scope: ', registration.scope);
      },
      (err) => {
        console.warn('ILMS ServiceWorker registration failed: ', err);
      }
    );
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', registerServiceWorker);
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
