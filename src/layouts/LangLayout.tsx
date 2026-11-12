import { Suspense, useEffect, useLayoutEffect } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { DEFAULT_LANGUAGE, isLanguage, LanguageProvider, useLanguage, type Language } from '../i18n/LanguageContext';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { WhatsAppButton } from '../components/layout/WhatsAppButton';
import { ScrollTopButton } from '../components/layout/ScrollTopButton';
import { captureAttribution } from '../analytics/attribution';
import { CookieNotice } from '../cms/CookieNotice';
import '../cms/cms.css';
import '../editor/editor.css';
import { setRenderContext } from '../editor/store';
import { routeKey } from '../editor/visual';
import { isEditorMode } from '../editor/mode';

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

/**
 * Client-side navigations: a new campaign landing reached without a full page load (rare - e.g. a
 * tagged internal promo link) still updates the last-touch campaign. Internal navigation and
 * language switches leave the stored first/last touch untouched (src/analytics/attribution.ts).
 */
function AttributionTracker() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    if (isEditorMode()) return; // dashboard editor / draft preview: no attribution
    captureAttribution();
  }, [pathname, search]);
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

// Page-specific visual-editor styles are scoped with body[data-route] (src/editor/visual.ts).
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;
function RouteMarker({ route }: { route: string }) {
  useIsoLayoutEffect(() => {
    document.body.dataset.route = route;
  }, [route]);
  return null;
}

export function LangLayout() {
  const { lang } = useParams();
  const { pathname } = useLocation();
  const route = routeKey(pathname);
  // Before any element of this page is created: the visual-editor runtime applies the overrides
  // saved for this page (src/editor/store.ts).
  if (isLanguage(lang)) setRenderContext(route, lang);

  if (!isLanguage(lang)) {
    return <Navigate to={`/${DEFAULT_LANGUAGE}`} replace />;
  }

  return (
    <LanguageProvider language={lang}>
      <DocumentDirection language={lang} />
      <RouteMarker route={route} />
      <LandingPageMode />
      <AttributionTracker />
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
      <ScrollTopButton />
      <WhatsAppButton />
      <CookieNotice />
    </LanguageProvider>
  );
}
