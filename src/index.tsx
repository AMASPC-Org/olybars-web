
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { logErrorToBackend } from './services/errorService';
import { BreadcrumbService } from './services/breadcrumbService';

// --- GLOBAL OBSERVABILITY ---
// Catch runtime crashes
window.onerror = (message, source, lineno, colno, error) => {
  logErrorToBackend(error || message, `window.onerror: ${source}:${lineno}:${colno}`);
};

// Catch unhandled promise rejections (e.g. async failures)
window.onunhandledrejection = (event) => {
  logErrorToBackend(event.reason, 'window.onunhandledrejection');
};

// --- INTERACTION TRACKING ---
// Track global clicks to establish user intent before a crash
window.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target && typeof target.getAttribute === 'function') {
    const label = target.innerText?.trim().slice(0, 30) || target.getAttribute('aria-label') || target.id || target.tagName;
    BreadcrumbService.trackClick(target.id || 'anonymous', label);
  }
}, true);

// Track back/forward navigation
window.addEventListener('popstate', () => {
  BreadcrumbService.trackNavigation(window.location.pathname);
});

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './components/ui/BrandedToast';
import { PersonaProvider, UserProvider, GamificationProvider } from './contexts';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <UserProvider>
          <GamificationProvider>
            <BrowserRouter>
              <PersonaProvider>
                <App />
              </PersonaProvider>
            </BrowserRouter>
          </GamificationProvider>
        </UserProvider>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
