import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './styles/reservia.css';
import App from './App.tsx';
import { AppLoader } from './components/effects/AppLoader.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';
import { initAnalytics } from './services/analytics.ts';

// The static <head> fallback (written per route at build time for crawlers
// without JavaScript) is replaced by react-helmet-async from here on;
// removing it first avoids duplicate description/canonical/OG tags.
document.querySelectorAll('[data-static-head]').forEach((el) => el.remove());

// Before the first render, so the first page's page_view reaches every configured provider.
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HelmetProvider>
        {/* Mounted once, outside the router, so client-side navigation never remounts or replays it. */}
        <AppLoader />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ThemeProvider>
  </StrictMode>,
);
