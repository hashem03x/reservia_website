import { createContext, useContext, useMemo, type ReactNode } from 'react';
import en from './translations/en';
import ar from './translations/ar';
import type { Dictionary } from './translations/en';

export const SUPPORTED_LANGUAGES = ['en', 'ar'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'en';

const dictionaries: Record<Language, Dictionary> = { en, ar };
const DIRECTION: Record<Language, 'ltr' | 'rtl'> = { en: 'ltr', ar: 'rtl' };

export function isLanguage(value: string | undefined): value is Language {
  return !!value && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/** Fills a `{token}` placeholder, matching the template's own `.replace("{n}", ...)` convention. */
export function fmt(template: string, token: string, value: string) {
  return template.replace(`{${token}}`, value);
}

interface LanguageContextValue {
  language: Language;
  dir: 'ltr' | 'rtl';
  t: Dictionary;
  buildPath: (lang: Language, path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ language, children }: { language: Language; children: ReactNode }) {
  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      dir: DIRECTION[language],
      t: dictionaries[language],
      buildPath: (lang, path) => {
        const cleanPath = path.replace(/^\/(en|ar)/, '') || '/';
        return `/${lang}${cleanPath === '/' ? '' : cleanPath}`;
      },
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
}
