
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { logErrorToBackend } from './services/errorService';

// --- GLOBAL OBSERVABILITY ---
// Catch runtime crashes
window.onerror = (message, source, lineno, colno, error) => {
  logErrorToBackend(error || message, `window.onerror: ${source}:${lineno}:${colno}`);
};

// Catch unhandled promise rejections (e.g. async failures)
window.onunhandledrejection = (event) => {
  logErrorToBackend(event.reason, 'window.onunhandledrejection');
};

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ToastProvider } from './components/ui/BrandedToast';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
