import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'rsv_theme';

/**
 * The theme lives on <html data-theme>, set before first paint by the
 * inline script in index.html. This tiny store reads and writes that
 * attribute; React subscribes with useSyncExternalStore, whose server
 * snapshot ('light') is what prerendered HTML contains. During hydration
 * React uses that same snapshot, then immediately re-renders with the real
 * theme -- so a returning dark-mode visitor gets no hydration mismatch
 * and no flash (the page colours already come from the attribute).
 */
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function writeTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private mode, etc.) -- theme still works for this session
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Single shared theme state for the whole app. Light Mode is the default
 * for first-time visitors -- this never reads `prefers-color-scheme`.
 * Dark Mode is only ever reached by an explicit user choice, which is
 * then persisted to localStorage and restored on later visits.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore<Theme>(subscribe, readTheme, () => 'light');

  function toggleTheme() {
    writeTheme(readTheme() === 'dark' ? 'light' : 'dark');
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
