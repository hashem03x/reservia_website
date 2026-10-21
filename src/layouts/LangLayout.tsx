import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { isLanguage, LanguageProvider, useLanguage, type Language } from '../i18n/LanguageContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { WhatsAppButton } from '../components/layout/WhatsAppButton';

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

/** New page = start at the top. (Focus and the page_view event are handled by each page's <Seo>, once its title is known.) */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
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

  if (!isLanguage(lang)) {
    return <Navigate to="/en" replace />;
  }

  return (
    <LanguageProvider language={lang}>
      <DocumentDirection language={lang} />
      <LandingPageMode />
      <ScrollToTop />
      <SkipLink />
      <Header />
      <main id="main" tabIndex={-1}>
        {/* Route chunks load on demand; the reserved height avoids the footer jumping up while one loads. */}
        <Suspense fallback={<div style={{ minHeight: '60vh' }} aria-hidden="true" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <WhatsAppButton />
    </LanguageProvider>
  );
}
