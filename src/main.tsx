import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/reservia.css';
import { Shell } from './Shell.tsx';
import { initAnalytics } from './services/analytics.ts';
import { startAnalyticsWhenAllowed } from './cms/consent.ts';
import { detectEditorMode } from './editor/mode.ts';
import { initAmplitude } from './analytics/amplitude.ts';
import { captureAttribution } from './analytics/attribution.ts';

// Record marketing attribution for THIS page load before anything else runs - every page, not just
// pages with a form, so a campaign landing on /en/farms is still known when the visitor submits the
// quote form on /en/contact (src/analytics/attribution.ts). Never throws.
// Visual editor (dashboard iframe, ?__ve=<signed token>) and signed draft preview (?__vp=...):
// a separate boot that loads the DRAFT configuration; no analytics, attribution or tracking.
const editorMode = detectEditorMode();
if (!editorMode) captureAttribution();

// Head tags written at build time (prerendered pages: data-ssr-head; root and
// 404 pages: data-static-head) serve crawlers and the first paint. React 19
// inserts its own copies when it renders, so remove these first to avoid
// duplicate title/description/canonical tags in the live page.
document.querySelectorAll('[data-static-head], [data-ssr-head]').forEach((el) => el.remove());

// Before the first render, so the first page's page_view reaches every configured provider.
const container = document.getElementById('root')!;
if (editorMode) {
  // The draft can differ from the prerendered (published) HTML: render fresh, never hydrate.
  import('./editor/boot.tsx').then(({ bootEditor }) => bootEditor(editorMode, container));
} else {
  startAnalyticsWhenAllowed(initAnalytics);
  initAmplitude();
  const app = <Shell router={BrowserRouter} />;
  // Prerendered pages (scripts/prerender.mjs) already contain the page's HTML:
  // hydrate it in place. The dev server and the 404 fallback start empty.
  if (container.firstElementChild) hydrateRoot(container, app);
  else createRoot(container).render(app);
}
