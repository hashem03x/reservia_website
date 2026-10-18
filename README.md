# Reservia website

Bilingual (English / Arabic) marketing website for **Reservia Integrated
Energy Solutions**, a solar + battery-storage EPC company in Egypt.
Built with React, TypeScript, Vite, React Router, and Framer Motion,
closely following the supplied reference template (`Reservia.html`).

See [`IMPLEMENTATION_NOTES.md`](IMPLEMENTATION_NOTES.md) for what the
reference template actually contains, how it maps to this codebase, and
everything blocked on real credentials (CRM endpoint, analytics IDs,
production domain).

## Stack

- **React 19 + TypeScript**, scaffolded with Vite.
- **React Router v7**, using a `/:lang/...` URL structure (`/en/residential`,
  `/ar/residential`, ...) so every page has a distinct, indexable URL per
  language -- the template itself is a single-page hash router; this is
  a deliberate, backwards-compatible-in-spirit improvement.
- **Framer Motion**, with `prefers-reduced-motion` respected globally via
  `<MotionConfig reducedMotion="user">`.
- No generic icon library: the reference design only uses four hand-drawn
  segment SVGs and one WhatsApp SVG (`src/components/icons/SegmentIcons.tsx`),
  plus CSS for everything else. See implementation notes re: "H2i icons."
- **react-helmet-async** for per-page `<title>`/meta/hreflang/JSON-LD.
- Plain global CSS (`src/styles/reservia.css`) ported from the template's
  own stylesheet, using the template's own class names -- no CSS-in-JS,
  no UI framework.
- **oxlint** for linting.

## Getting started

```bash
npm install
cp .env.example .env.local   # real public contact details already default in; see the file
npm run dev
```

Other scripts:

```bash
npm run build     # type-check (tsc -b) + production build
npm run preview   # preview the production build locally
npm run lint       # oxlint
```

## Project structure

```
src/
  components/
    icons/        SegmentIcons.tsx (the four segment SVGs + WhatsApp SVG)
    layout/        Header, Footer, WhatsAppButton, Seo (incl. Organization JSON-LD)
    sections/      RateBoard, SegmentPicker, EgyptMap, Pillars, TermsTable,
                   TrustGrid, Faq, CtaBand -- the template's reusable sections
    forms/         LeadForm (the five campaign pages' shared form), Field
  config/          env.ts (VITE_* vars), navigation.ts (real IA)
  content/         seo.ts, whatsappMessages.ts, aboutSources.ts -- ported content
  hooks/           useUtmParams.ts
  i18n/            LanguageContext + en/ar dictionaries (ported verbatim, ~280 keys)
  layouts/         LangLayout (the /:lang route shell)
  services/        calculator.ts (ported financial model), leadService,
                   whatsapp, analytics (dataLayer events)
  pages/           Home, Residential, Agriculture, Industrial, Service,
                   Calculator, HowWeWork, About, Contact, NotFound,
                   LandingPage.tsx + 5 campaign-page wrappers (LpVillas, ...)
```

## Required environment variables

All documented in [`.env.example`](.env.example). The business-contact
ones already default to the real values published in the reference
template (WhatsApp number, two emails, office/mobile phone) -- they are
public info, not secrets, so the site works correctly out of the box.
Everything else degrades to a clearly-labelled mock/omitted state when
unset, never a false "it's live" claim:

| Variable | Effect when unset |
|---|---|
| `VITE_LEADS_API_URL` | Contact form and campaign-page forms run in mock mode (logs the payload locally, UI shows the template's own "this is a prototype, nothing was sent" copy) |
| `VITE_WHATSAPP_NUMBER`, `VITE_BUSINESS_EMAIL`, `VITE_SALES_EMAIL`, `VITE_MOBILE_PHONE`, `VITE_OFFICE_PHONE`, `VITE_WEBSITE_HOST` | Default to the real values from the reference template |
| `VITE_SITE_URL` | Canonical/hreflang/OG URL tags are omitted |
| `VITE_GA4_MEASUREMENT_ID`, `VITE_GTM_CONTAINER_ID`, `VITE_META_PIXEL_ID`, `VITE_GOOGLE_ADS_CONVERSION_ID` | Matching script never loads; dataLayer events still push (inspectable in devtools) but reach no provider |

None of these are secrets -- do not put CRM API keys/tokens here. Lead
submission authentication must happen server-side.
