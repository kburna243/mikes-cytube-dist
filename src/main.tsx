import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Offline Capability (Lenovo Tab 11 / Android)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker erfolgreich registriert:', reg.scope);
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker Registrierung übersprungen oder fehlgeschlagen:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
