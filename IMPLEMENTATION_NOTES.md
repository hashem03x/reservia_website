# Implementation notes

> **October 2026 update.** The client brief of 13–17 October 2026 (tariffs, calculator
> regression, accessibility, service sector, SEO, analytics privacy) is implemented. See
> [docs/IMPROVEMENTS_2026-10.md](docs/IMPROVEMENTS_2026-10.md),
> [docs/TARIFFS.md](docs/TARIFFS.md) and [docs/CLIENT_DECISIONS.md](docs/CLIENT_DECISIONS.md).
> Where this file differs from those documents, they are current. In particular:
> - forms now report "preview mode" rather than success when no endpoint is set;
> - lead events fire only after confirmed delivery;
> - a real headless-browser regression suite now runs (Playwright + axe-core).

This file was rewritten after a supplied HTML/CSS/JS reference template
(`Reservia.html`) was added to the repository mid-project. That file is
the authoritative source of truth for design, content, and section
structure. Everything below reflects the current, template-aligned
implementation.

## What the reference template actually is

`Reservia.html` is a single-file, bilingual (EN/AR) prototype for
**Reservia Integrated Energy Solutions**, a solar + battery-storage EPC
(engineering/procurement/construction) company based in Maadi, Cairo,
Egypt -- not a real-estate/land developer, which an earlier pass of this
project had incorrectly assumed before the template was supplied (see
git history / prior session for that discarded work).

The template embeds, as real content (not placeholders):

- **Brand assets**: a logo mark and two photographic banners, encoded as
  base64 WebP data URIs. These were decoded and extracted to
  `src/assets/brand/{logo,hero-bg,about-banner}.webp` and are used as
  real `<img>`/background assets throughout.
- **Brand palette & type**: CSS custom properties (`--navy`, `--teal`,
  `--sun`, `--leaf`, etc., with a full dark-mode variant) and Google
  Fonts (Readex Pro, IBM Plex Sans Arabic, IBM Plex Mono) -- ported
  verbatim into `src/styles/tokens.css`.
- **Real business contact details**: two emails
  (`Business_info@reservia-energy.com`, `Reservia_Sales@reservia-energy.com`),
  a mobile/WhatsApp number (+20 121 189 2995, used as the real
  `wa.me` number), an office line (+20 2 2522 2814), an address (Maadi,
  Cairo, Egypt), a named Managing Director (Ahmed A. Fattah), and 16
  real press/industry citation links on the About page.
- **A complete bilingual copy deck** (~280 keys per language) covering
  every page -- ported verbatim into `src/i18n/translations/{en,ar}.ts`.
  This is approved content, not generated marketing copy, and was not
  re-translated or paraphrased.
- **A working financial calculator** (household tariff slabs, solar
  pricing per kWp, 30-year payback with panel degradation/O&M/inverter
  replacement) -- ported line-for-line into `src/services/calculator.ts`
  so it produces the same numbers as the reference for the same inputs.

## Information architecture (matches the template, not the original brief)

The original task brief assumed three verticals (Villas/Compounds/
Agriculture) on a real-estate site. The actual template's structure is
different and was followed instead, per the instruction to treat it as
primary source of truth:

**Main navigation (9 pages):** Home, Residential (villas & compounds
together), Agriculture, Industrial (oil/gas + factories), Service sector
(hospitals/hotels/schools), Savings Calculator, How we work, About,
Contact.

**Five separate ad-campaign landing pages** (`/lp/villas`,
`/lp/compounds`, `/lp/agriculture`, `/lp/industrial`, `/lp/service`),
each a minimal hero + stat + short benefit list + compact lead form,
intentionally excluded from indexing (`noindex`) per the template's own
SEO comment about campaign pages.

Unlike the template (a single-page hash router, `#residential` etc.),
this implementation uses real React Router routes (`/en/residential`,
`/ar/residential`, ...) -- one indexable URL per page per language, with
hreflang alternates. This is a deliberate improvement consistent with
"preserve React and the existing architecture," not a content change.

## Component mapping

CSS: `src/styles/reservia.css` is a faithful, de-duplicated port of the
template's entire `<style>` block, using the template's own class names
(`.hero`, `.seg`, `.region`, `.cards4`, `.pillars`, `.terms`,
`.cta-band`, `.calc`, `.contact-list`, `.lp-grid`, ...) so markup can be
visually cross-checked against the source directly. Components render
those classes in JSX rather than wrapping them in a separate design
system -- e.g. `<Link className="btn sun">` instead of a `<Button>`
abstraction -- because the template itself barely has one (buttons,
cards, and form fields are plain classed elements, not a component
library).

Key new/rewritten files:
- `src/services/calculator.ts` -- the ported financial model
- `src/services/whatsapp.ts`, `src/content/whatsappMessages.ts` -- the
  real WhatsApp number + the template's exact per-segment prefilled
  messages
- `src/content/seo.ts` -- per-page title/description pairs, ported
  verbatim
- `src/content/aboutSources.ts` -- the 16 real citation links
- `src/components/icons/SegmentIcons.tsx` -- the four hand-drawn segment
  SVGs + the WhatsApp SVG, ported with identical path data
- `src/components/sections/{RateBoard,SegmentPicker,EgyptMap,Pillars,
  TermsTable,TrustGrid,Faq,CtaBand}.tsx` -- the template's reusable
  sections
- `src/pages/*` -- one file per page; `LandingPage.tsx` is the shared
  shape for the five campaign pages, parameterized by segment

## The "H2i icons" question -- resolved, not substituted

No npm package or repository named "H2i icons" could be found (checked
npm and GitHub). The user was informed and said to proceed. Once the
real reference template arrived, this became moot: **the template does
not use a generic icon library at all.** Its only graphics are four
hand-drawn segment SVGs, one WhatsApp SVG, a CSS mask for the FAQ/tick
checkmarks, and literal "+"/"−"/▲ characters. `lucide-react` (installed
in an earlier pass, before the template was supplied) was removed as an
unused dependency. `src/components/icons/Icon.tsx` is left as a stub
documenting this; nothing imports it.

## Integrations -- wired but not live

- **Lead capture / CRM** (`src/services/leadService.ts`): posts JSON to
  `VITE_LEADS_API_URL`. Unset -> logs locally and the UI shows the
  template's own prototype-disclosure copy (`q_priv`/`lp_priv`: "this is
  a prototype, nothing is sent yet..."), never a false success. The
  payload shape (`LeadPayload`) is a reasonable inference from the two
  form shapes in the template (`qform`, `lpform`) and should be
  confirmed against the real CRM contract before launch.
- **WhatsApp**: real number (201211892995, from the template's `WA_NUM`
  constant), configurable via `VITE_WHATSAPP_NUMBER` with that number as
  the default. Per-segment prefilled messages ported verbatim.
- **Analytics** (`src/services/analytics.ts`): every `dataLayer` event
  name (`page_view`, `language_change`, `generate_lead`,
  `click_whatsapp`, `click_call`, `click_email`) and payload shape is
  ported from the template's "v2: tracking layer (GTM-ready)" comment
  block, including UTM capture and a stable `event_id` per event for
  future Meta CAPI deduplication. GA4 / GTM / Meta Pixel / Google Ads
  loaders are real and activate the moment their `VITE_*` ID is set; no
  IDs were supplied, so nothing fires by default.
- **SEO**: canonical/hreflang/OG URLs only render once `VITE_SITE_URL`
  is set (no production domain was supplied). Organization JSON-LD
  (`src/components/layout/Seo.tsx`) and per-page FAQPage JSON-LD are
  ported from the template's `ldOrg` script and its dynamic FAQ JSON-LD
  builder respectively.

## Known simplifications vs. the reference

- The template's count-up number animation (`.lp-stat b`, `.facts b`)
  and its `IntersectionObserver`-driven scroll-reveal (`.rv-in`) were
  not reproduced pixel-for-pixel; static values render immediately
  instead. This was a deliberate scope cut given the size of the rest of
  the port, not an oversight -- flagging it here rather than silently
  dropping it.
- RTL/LTR, dark mode, focus-visible styles, `prefers-reduced-motion`,
  and the `body[data-lp="1"]` landing-page chrome (hidden main nav,
  sticky bottom CTA bar, phone pill instead of "Menu") are all ported
  and functional.

## Verification performed

- `npm run build` (`tsc -b && vite build`): passes, zero errors.
- `npm run lint` (oxlint): passes with a few informational warnings
  (Fast-Refresh "only-export-components" on files that intentionally
  export a hook/helper alongside a component; two
  "set-state-in-effect" notices on legitimate route-change /
  external-storage syncs). No errors.
- Dev server smoke test: started `npm run dev`, confirmed `/en`,
  `/en/calculator`, `/en/contact`, `/ar` all return HTTP 200 with the
  expected HTML shell.
- **Not performed**: a real headless-browser visual check. This
  sandbox's outbound network access is blocked (`EACCES` on the
  Playwright Chromium download), so no screenshot comparison against
  the reference template could be taken. Everything above was verified
  by build/lint/HTTP checks and close manual comparison against the
  template's markup/CSS/JS while writing each file, not by looking at a
  rendered page. Recommend a manual pass (or a CI run with network
  access) at both LTR and RTL, desktop and mobile, before shipping.

## Known gaps for a real production launch

- No real CRM endpoint, GA4/GTM/Meta Pixel/Google Ads IDs, or production
  domain were supplied -- all env-var-gated as described above.
- The lead payload shape is an inference, not a confirmed backend
  contract.
- Two leftover files from the original Vite scaffold step
  (`src/App.css`, `src/assets/{react,vite}.svg`, `src/assets/hero.png`,
  `public/favicon.svg`, `public/icons.svg`, `src/index.css`) and several
  files superseded by this rebuild (listed with a one-line comment
  inside each file, e.g. `src/components/ui/Button.tsx`,
  `src/pages/VerticalPageTemplate.tsx`) are unused and were intended for
  deletion, but the delete command was blocked by this environment's
  permission settings both times it was attempted. None are imported or
  referenced anywhere in the app; they are safe to delete manually.
