import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import './styles/reservia.css';
import App from './App.tsx';
import { AppLoader } from './components/effects/AppLoader.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';

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
