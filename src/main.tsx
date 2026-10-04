import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker for offline kitchen display board and staff portal caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    const updateSW = registerSW({
      onNeedRefresh() {
        updateSW(true);
      },
      onOfflineReady() {
        console.log('NiEA KDS Staff Portal is ready for offline operation');
      },
    });
  } catch (err) {
    // Ignore in dev or environments where service workers are disabled
  }
}

// Universal Apple Liquid Crystal tactile jiggly physics listener
if (typeof window !== 'undefined') {
  const isLiquidPhysicsActive = () => {
    return document.documentElement.getAttribute('data-liquid-glass') !== 'false';
  };

  window.addEventListener(
    'pointerdown',
    (e) => {
      const target = (e.target as HTMLElement)?.closest(
        'button, [role="button"], .btn-press, .btn-liquid, .liquid-crystal-btn, a[href], summary, .clickable, [tabindex="0"]'
      ) as HTMLElement | null;
      if (
        target &&
        !target.hasAttribute('disabled') &&
        !target.classList.contains('logo-no-liquid') &&
        !target.closest('.logo-no-liquid')
      ) {
        target.classList.remove('liquid-jiggle-active');
      }
    },
    { passive: true }
  );

  window.addEventListener(
    'click',
    (e) => {
      if (!isLiquidPhysicsActive()) return;
      const target = (e.target as HTMLElement)?.closest(
        'button, [role="button"], .btn-press, .btn-liquid, .liquid-crystal-btn, a[href], summary, .clickable, [tabindex="0"]'
      ) as HTMLElement | null;
      if (
        target &&
        !target.hasAttribute('disabled') &&
        !target.classList.contains('logo-no-liquid') &&
        !target.closest('.logo-no-liquid')
      ) {
        target.classList.remove('liquid-jiggle-active');
        requestAnimationFrame(() => {
          target.classList.add('liquid-jiggle-active');
          setTimeout(() => {
            target.classList.remove('liquid-jiggle-active');
          }, 450);
        });
      }
    },
    { capture: true, passive: true }
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
