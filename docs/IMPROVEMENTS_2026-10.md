# Website improvements: client brief of 13–17 October 2026

Implementation checklist. **Before** is the state found on 21 October 2026. **Verified by** names
the automated check. Unit tests live in `src/**/*.test.ts` (`npm test`); browser tests live in
`tests/e2e*` (`npm run test:e2e`).

## Performance and accessibility

| Requirement | Before | Now | Verified by |
|---|---|---|---|
| Lightweight build | One 426 KB JS bundle (131 KB gzip) | Home page loads 404 KB JS (130 KB gzip); 14 other routes are lazy chunks of 0.4–11 KB. React DOM and React Router are most of the remaining weight; Framer Motion tree-shakes to about 3 KB | `npm run build` output |
| WebP assets not inlined | Already separate WebP files | Unchanged; the logo is also the favicon (fixed a 404) | matrix: no console errors |
| Skip link | Present | Unchanged; tested | `skip link…` |
| Visible focus, incl. dark sections | Missing on the dark footer | Cyan focus ring on hero, rate board, CTA band and footer | `visible focus ring…` |
| Field-specific errors | One shared message; the campaign form used native popups | Per-field localized errors, `aria-invalid`, `aria-describedby`, focus moved to the first invalid field | `field-specific…`, `campaign form…` |
| Language switch label | Text only | Visible name plus "Switch the site to Arabic/English" | `language switch…` |
| Calculator tabs: Arrow/Home/End | Missing | WAI-ARIA tabs pattern, mirrored in RTL | `tabs support…` |
| Escape closes the mobile menu | Present | Tested; focus returns to the button | `Escape closes…` |
| Focus after navigation | None (scroll only) | Focus moves to the new page's `h1` | `client-side navigation…` |
| Reduced motion | CSS honoured; loader always held content ≥ 900 ms | Loader shortened (500 ms; no minimum with reduced motion) | `reduced motion…` |
| Contrast, heading order, semantics | First axe run: colour-contrast failures on light-theme pages (cyan links and labels on tinted surfaces, selected calculator tab, green labels); headings skipping a level on 3 pages; logo link name mismatch; dark-mode fact figures nearly invisible; favicon 404 on every page | Fixed with tokens (`--navy`/`--teal` deepened in light theme, `--leaf-text`, `--on-navy`, `--brand-text`); headings fixed | axe-core in all 112 matrix cases |
| No horizontal overflow at phone width | — | Checked at 400 px on every route | matrix |

## Tariffs and calculator

| Requirement | Now | Verified by |
|---|---|---|
| Brief rates, centralized with metadata | `src/config/tariffs.ts` (source, as-of date, segment, status) | `tariffs.test.ts` |
| Tier boundaries | Preserved (50/100/200/350/650/1,000); band-rule question logged | `calculator.test.ts` |
| Reference villa | 6.0 kWp / 183,600 / 36,804 / 5.31 y / 4.80 y | unit + browser tests |
| Invalid input | Empty, zero, negative and NaN give "no estimate" plus a message | unit + `empty, zero…` |
| WhatsApp equals the screen | Summary uses the same formatting and rounding, and includes both paybacks | `reference villa…` |
| Rate board | 2.89 vs 2.23 (+29.6%), as-of date, disputed-rate note, diesel warning, EN + AR | `home: trust…`, `Arabic home…` |

## Conversion and trust

| Requirement | Now |
|---|---|
| NREA claims | None found; guarded by tests in both languages |
| Trust section (6 points) | Present; point 6 corrected to match the calculator |
| Home FAQs (5) / residential (permits, payback, small homes) | Present; FAQ JSON-LD is built from the visible strings and compared in every matrix case |
| Quote CTAs | Header, hero (now primary), closing bands on home, residential and service; segment pages preselect the contact type (`?type=`) |
| WhatsApp CTAs | Hero, residential, farms, industry, service, contact, closing band, floating button, calculator |
| No response-time promise | Guarded by tests |

## WhatsApp and forms

| Requirement | Now |
|---|---|
| Segment messages | Residential, compounds, farms, industry, service, general: each asks for location plus the segment's figures (EN + AR) |
| Floating button | Follows page language and segment |
| Calculator message | Size, price, saving, both paybacks |
| Encoding / destination | `encodeURIComponent`; number validated (8–15 digits, E.164); links hidden if invalid |
| Contact form | Name; phone (permitted formatting, 8–15 digits, Arabic digits accepted); localized hint; optional area and notes; sending state; sent / preview / failed states; WhatsApp continuation; service option |
| No false success | Preview mode says "nothing was sent"; errors show an alert; success only on 2xx |

## Service sector

The nav entry, home card, service page, campaign page, contact option, WhatsApp message,
SEO title/description and EN/AR copy already existed. Added: WhatsApp CTA, contact preselection,
FAQ (tariff assumption, backup power), closing band, `h2` headings, and explicit
"Not a Reservia project" tests. Analytics: `segment=service`, `group=industrial`, in events and
in the CRM payload (`segmentGroup`).

## SEO

Per-route static HTML (`dist/<lang><path>.html`) with title, description, `lang`/`dir`, robots,
Open Graph and Organization JSON-LD for crawlers that don't run JavaScript. The live head comes
from React Helmet. Canonical, hreflang, x-default and the sitemap appear only with `VITE_SITE_URL`.
Campaign pages and the 404 page are `noindex, follow` and carry no canonical or hreflang.
Organization JSON-LD has no contact details or legal name until decision 9.

## Analytics and privacy

- Event coverage: `page_view`, `generate_lead`, `click_whatsapp`, `click_call`, `click_email`,
  `language_change`.
- Every event has a unique `event_id`.
- Page views are deduplicated per route and language, including GA4 (`send_page_view: false`) and
  the Meta Pixel `PageView` with `eventID`.
- Lead events fire once, only after a confirmed send, with the id shared with the CRM.
- An allowlist sanitizer drops any other key and any value that looks like an email or a phone
  number.

## Test totals (21 October 2026)

- Unit (Vitest): **91 passed** in 8 files.
- Browser (Playwright, Chrome): **143 passed**.
  - 112 route-matrix cases: 14 routes × EN/AR × light/dark × 400/1,280 px, each with axe-core.
  - 28 interaction tests.
  - 3 preview-mode tests.
- Lint: 0 errors. The 8 warnings are pre-existing.
- Typecheck and production build: pass.

---

# Part 2: second client brief (October 2026)

| Requirement | Implementation | Verified by (`tests/e2e/brief-part2.spec.ts` unless noted) |
|---|---|---|
| Four categories: Residential & Commercial, Agricultural Farms, Industrial Facilities, Services Sector | Header Solutions menu (desktop and mobile), home cards, page eyebrows and calculator tabs, EN + AR, all from one set of translation keys | `four solution categories`; `translations.test.ts` |
| Calculator: four tabs on one engine | Residential & Commercial unchanged. Agricultural Farms adds crop and tree selects; the tree field appears only for tree-based activities and is cleared otherwise; both are contextual and do not change the estimate. Industrial Facilities adds on-grid/off-grid radios and a monthly electricity cost in EGP: on-grid converts the bill at 2.55 EGP/kWh; off-grid converts fuel spend to litres at the entered diesel price, then uses the existing diesel model. Services Sector is its own tab, using the grid model at the disclosed 2.55 assumption, with an optional facility type | `savings calculator…`; `calculator.test.ts`; `farmCrops.test.ts` |
| Calculator data reaches the lead | "Get an exact quote" passes the active tab's context only (router state, never the URL). The contact page shows it (removable) and sends it as `calculator` in the lead payload | `"Get an exact quote" sends only the active tab's estimate` |
| Animated slogan | `AnimatedSlogan`: CSS keyframes, one word per 2.5 s, shared grid cell (no layout shift), no React timers, energy bar sweep, sr-only full text, static under reduced motion | `animated slogan…`, `reduced motion (part 2)` |
| New homepage description | `h_lead` (EN/AR) | unit + e2e |
| Hero CTAs | Calculate your savings · Talk to an engineer · Send your bill to WhatsApp, side by side; they wrap on phones | `home: trust…` |
| Payment terms removed | `TermsTable` deleted; home section, How We Work section, solution-page payment rows, campaign-page payment chips, service payment FAQ and their copy keys removed; trust point 3 reworded (financing kept) | `payment terms removed…` on all 14 routes; `translations.test.ts` |
| Our partners carousel | `PartnersCarousel` + `content/partners.ts`: native scroll-snap (swipe, trackpad, keyboard), RTL-aware previous/next buttons, rounded/circular white tiles, `object-fit: contain`, no autoplay. **No partner assets exist**, so the section is hidden in production (decision 11) | `Our partners` (preview tiles); `preview-mode.spec.ts` (hidden) |
| How We Work cards | Framer Motion `LazyMotion` + `m.li` `whileInView`, staggered, once; static under reduced motion; hover border/shadow on pointer devices | `How we work`, `reduced motion (part 2)` |
| Common questions → FAQ | `faq_t` = "FAQ" / "الأسئلة الشائعة" | `payment terms removed, FAQ renamed` |
| WhatsApp bill CTA rules | Central rule `offersBillWhatsapp()` + `<BillWaLink>`: shown on the homepage (hero, closing band), Residential & Commercial (page, closing band, calculator tab, villas and compounds campaign forms); hidden on Agricultural Farms, Industrial Facilities and Services Sector (pages, closing bands, calculator tabs, campaign forms) and on the contact page, which keeps a general "Chat with us on WhatsApp" | bill CTA check on all 14 routes × EN/AR; `whatsapp.test.ts` |
| Footer | New description, "Main menu" column removed (two columns), WhatsApp chat button with the existing icon, "Reservia Integrated Energy Solutions LLC" in the identity and copyright line | `footer`; matrix (axe, overflow) |

Test totals after part 2 (21 October 2026):
- Unit: **105 passed** in 9 files.
- Browser: **203 passed**: 112 matrix cases, 28 interaction tests, 59 tests for this brief, 4 preview-mode tests.
- Lint: 0 errors; the 8 warnings are pre-existing.
- Typecheck and build: pass.

How We Work now loads an 84 KB (30 KB gzip) chunk for Framer Motion's in-view animation, on that page only. The homepage bundle is unchanged apart from the slogan CSS.
