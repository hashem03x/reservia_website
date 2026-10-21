import { lazy } from 'react';
import { MotionConfig } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LangLayout } from './layouts/LangLayout';
import { DEFAULT_LANGUAGE, type Language } from './i18n/LanguageContext';
import Home from './pages/Home';

// The home page ships in the main bundle (most visits start there); every
// other route is its own chunk, loaded on first visit. Organization JSON-LD
// is in the static HTML <head> (vite.config.ts), not rendered here.
const Residential = lazy(() => import('./pages/Residential'));
const Agriculture = lazy(() => import('./pages/Agriculture'));
const Industrial = lazy(() => import('./pages/Industrial'));
const Service = lazy(() => import('./pages/Service'));
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

function detectInitialLanguage(): Language {
  if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar')) {
    return 'ar';
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
          <Route index element={<Home />} />
          <Route path="residential" element={<Residential />} />
          <Route path="agriculture" element={<Agriculture />} />
          <Route path="industrial" element={<Industrial />} />
          <Route path="service" element={<Service />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="how-we-work" element={<HowWeWork />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="lp/villas" element={<LpVillas />} />
          <Route path="lp/compounds" element={<LpCompounds />} />
          <Route path="lp/agriculture" element={<LpAgriculture />} />
          <Route path="lp/industrial" element={<LpIndustrial />} />
          <Route path="lp/service" element={<LpService />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<Navigate to={`/${initialLanguage}`} replace />} />
      </Routes>
    </MotionConfig>
  );
}
