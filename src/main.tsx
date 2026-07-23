import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/context/AuthContext';
import { applyTheme, getStoredTheme } from '@/lib/themes';
import App from './App';
import './index.css';

// Apply persisted color theme immediately to avoid flash
applyTheme(getStoredTheme());

// Hide splash screen once app is ready
function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity 0.4s ease-out';
    setTimeout(() => splash.remove(), 400);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);

// Remove splash after a short delay to ensure first paint
setTimeout(hideSplash, 600);
