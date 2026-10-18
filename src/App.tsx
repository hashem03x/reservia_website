import { MotionConfig } from 'framer-motion';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LangLayout } from './layouts/LangLayout';
import { DEFAULT_LANGUAGE, type Language } from './i18n/LanguageContext';
import { OrganizationJsonLd } from './components/layout/Seo';
import Home from './pages/Home';
import Residential from './pages/Residential';
import Agriculture from './pages/Agriculture';
import Industrial from './pages/Industrial';
import Service from './pages/Service';
import Calculator from './pages/Calculator';
import HowWeWork from './pages/HowWeWork';
import About from './pages/About';
import Contact from './pages/Contact';
import LpVillas from './pages/LpVillas';
import LpCompounds from './pages/LpCompounds';
import LpAgriculture from './pages/LpAgriculture';
import LpIndustrial from './pages/LpIndustrial';
import LpService from './pages/LpService';
import NotFound from './pages/NotFound';

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
      <OrganizationJsonLd />
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
