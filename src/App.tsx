import { lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LangLayout } from './layouts/LangLayout';
import { DEFAULT_LANGUAGE, type Language } from './i18n/LanguageContext';
import Home from './pages/Home';
import { CmsRoute, CmsCatchAll } from './cms/CmsRoute';

// The home page ships in the main bundle (most visits start there); every
// other route is its own chunk, loaded on first visit. Organization JSON-LD
// is in the static HTML <head> (vite.config.ts), not rendered here.
const Residential = lazy(() => import('./pages/Residential'));
const Agriculture = lazy(() => import('./pages/Agriculture'));
const Industrial = lazy(() => import('./pages/Industrial'));
const Service = lazy(() => import('./pages/Service'));
const OilGas = lazy(() => import('./pages/OilGas'));
const IrrigationGuide = lazy(() => import('./pages/IrrigationGuide'));
const Calculator = lazy(() => import('./pages/Calculator'));
const HowWeWork = lazy(() => import('./pages/HowWeWork'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const LpVillas = lazy(() => import('./pages/LpVillas'));
const LpCompounds = lazy(() => import('./pages/LpCompounds'));
const LpAgriculture = lazy(() => import('./pages/LpAgriculture'));
const LpIndustrial = lazy(() => import('./pages/LpIndustrial'));
const LpService = lazy(() => import('./pages/LpService'));
const NotFound = lazy(() => import('./pages/NotFound'));
const CmsPreview = lazy(() => import('./pages/CmsPreview'));

// Arabic is the default; a browser that prefers English gets English (mirrors vercel.json's `/` redirect).
function detectInitialLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')) {
    return 'en';
  }
  return DEFAULT_LANGUAGE;
}

export default function App() {
  const initialLanguage = detectInitialLanguage();

  return (
    <MotionConfig reducedMotion="user">
      <Routes>
        <Route path="/" element={<Navigate to={`/${initialLanguage}`} replace />} />
        <Route path="/:lang" element={<LangLayout />}>
          {/* Each built-in page can be rebuilt in the Website CMS: a published CMS page at the same
              path (src/cms/CmsRoute.tsx) replaces the built-in body; otherwise the built-in page renders. */}
          <Route index element={<CmsRoute path="" fallback={<Home />} />} />
          <Route path="residential" element={<CmsRoute path="/residential" fallback={<Residential />} />} />
          <Route path="agriculture" element={<CmsRoute path="/agriculture" fallback={<Agriculture />} />} />
          {/* Campaign alias: ad links use /en/farms (the CRM launch acceptance URL). It shows the farm
              page with its campaign parameters intact (attribution records /en/farms as the landing
              page); the page's canonical stays /agriculture and the alias is not prerendered or in
              the sitemap, so search engines see one page. */}
          <Route path="farms" element={<Agriculture />} />
          <Route path="industrial" element={<CmsRoute path="/industrial" fallback={<Industrial />} />} />
          <Route path="service" element={<CmsRoute path="/service" fallback={<Service />} />} />
          <Route path="oil-gas" element={<CmsRoute path="/oil-gas" fallback={<OilGas />} />} />
          {/* Arabic only: the page renders the not-found page for /en/... */}
          <Route path="solar-irrigation-guide" element={<IrrigationGuide />} />
          <Route path="calculator" element={<CmsRoute path="/calculator" fallback={<Calculator />} />} />
          <Route path="how-we-work" element={<CmsRoute path="/how-we-work" fallback={<HowWeWork />} />} />
          <Route path="about" element={<CmsRoute path="/about" fallback={<About />} />} />
          <Route path="contact" element={<CmsRoute path="/contact" fallback={<Contact />} />} />
          <Route path="lp/villas" element={<LpVillas />} />
          <Route path="lp/compounds" element={<LpCompounds />} />
          <Route path="lp/agriculture" element={<LpAgriculture />} />
          <Route path="lp/industrial" element={<LpIndustrial />} />
          <Route path="lp/service" element={<LpService />} />
          {/* Signed draft preview (dashboard "Preview"): never prerendered, cached or indexed. */}
          <Route path="__preview" element={<CmsPreview />} />
          {/* Pages that exist only in the CMS; anything else is the not-found page. */}
          <Route path="*" element={<CmsCatchAll fallback={<NotFound />} />} />
        </Route>
        <Route path="*" element={<Navigate to={`/${initialLanguage}`} replace />} />
      </Routes>
    </MotionConfig>
  );
}
