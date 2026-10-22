import { StrictMode, type ReactNode } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import { AppLoader } from './components/effects/AppLoader.tsx';
import { ThemeProvider } from './theme/ThemeContext.tsx';

/**
 * The app tree shared by the browser entry (main.tsx, BrowserRouter) and
 * the build-time prerender (entry-server.tsx, StaticRouter). Keeping one
 * definition guarantees the prerendered HTML and the first client render
 * are the same tree, which hydration requires.
 */
export function Shell({ router: Router }: { router: (props: { children: ReactNode }) => ReactNode }) {
  return (
    <StrictMode>
      <ThemeProvider>
        <HelmetProvider>
          {/* Mounted once, outside the router, so client-side navigation never remounts or replays it. */}
          <AppLoader />
          <Router>
            <App />
          </Router>
        </HelmetProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
