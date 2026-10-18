import { useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { isLanguage, LanguageProvider, useLanguage, type Language } from '../i18n/LanguageContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { WhatsAppButton } from '../components/layout/WhatsAppButton';
import { initAnalytics, trackPageView } from '../services/analytics';

function DocumentDirection({ language }: { language: Language }) {
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);
  return null;
}

/** Mirrors the template's `body[data-lp="1"]` state, which drives the CSS for the landing-page chrome (sticky bar, hidden main nav, phone pill instead of Menu). */
function LandingPageMode() {
  const location = useLocation();
  useEffect(() => {
    document.body.dataset.lp = location.pathname.includes('/lp/') ? '1' : '0';
    return () => {
      document.body.dataset.lp = '0';
    };
  }, [location.pathname]);
  return null;
}

function SkipLink() {
  const { t } = useLanguage();
  return (
    <a href="#main" className="skip">
      {t.skip}
    </a>
  );
}

export function LangLayout() {
  const { lang } = useParams();
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
  }, []);

  if (!isLanguage(lang)) {
    return <Navigate to="/en" replace />;
  }

  return (
    <LanguageProvider language={lang}>
      <DocumentDirection language={lang} />
      <LandingPageMode />
      <PageViewTracker path={location.pathname} />
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppButton />
      <div id="sr" className="sr-only" role="status" aria-live="polite" />
    </LanguageProvider>
  );
}

function PageViewTracker({ path }: { path: string }) {
  const { language } = useLanguage();
  useEffect(() => {
    trackPageView(path, language, document.title);
    window.scrollTo(0, 0);
  }, [path, language]);
  return null;
}
