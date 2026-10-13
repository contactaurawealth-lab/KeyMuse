import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AudioStateProvider } from './context/AudioStateContext';
import './styles/theme.css';
import './styles/studio.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AudioStateProvider>
      <App />
    </AudioStateProvider>
  </React.StrictMode>
);

// Register PWA Service Worker
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[KeyMuse PWA] Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('[KeyMuse PWA] Service Worker registration failed:', err);
      });
  });
}

