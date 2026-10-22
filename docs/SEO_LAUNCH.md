# Technical SEO and launch guide

Audience: the developer or agency deploying the site, and whoever manages Search Console.
Prepared on 22 October 2026, from the SEO audit of the same date.

Nothing here has been deployed, pushed or submitted. Search Console and Bing were not
touched, and no claim is made that the site is verified, crawled or indexed.

## 1. Audit findings: what was confirmed

| Finding | Status | Cause and fix |
|---|---|---|
| Opening or refreshing a nested route returns a Vercel 404 | **Confirmed in code** | The build produced only `index.html` and there was no `vercel.json`, so `/en/industrial` had no file. Every page is now prerendered to `<lang><path>.html`, and `vercel.json` sets `cleanUrls`. Verified locally with Vercel's `serve` (§6). |
| Content rendered mainly by JavaScript | **Confirmed** | `#root` was empty in the served HTML. Every page is now prerendered from the real React app at build time and hydrated in the browser. |
| No XML sitemap | **Confirmed** | `sitemap.xml` is generated from the route inventory, once `VITE_SITE_URL` is set. |
| Canonical and hreflang missing | **Confirmed** | They were already implemented but gated on `VITE_SITE_URL`, which is not set. They are now also in the static HTML. |
| Arabic routes not directly accessible | **Confirmed** (same cause as the nested-route 404) | Fixed by the same change: all 15 Arabic pages are prerendered. |
| No results for a `site:` query | **Consistent with what we found** | `reservia-energy.com` and `www.reservia-energy.com` currently serve a **Namecheap parking page** (LiteSpeed server, IP 66.29.153.198, checked 22 October 2026). The site is not on that domain, and the Vercel URL it does run on is not known to us. |
| Production domain configuration incomplete | **Confirmed** | See above. `VITE_SITE_URL` is unset, by design, until the domain serves this site. |
| Logo images with empty alt | **Confirmed, but intentional** | The header and footer logos sit next to the visible text "Reservia", inside the same link or block. `alt=""` avoids screen readers saying "Reservia Reservia" (WCAG technique H2). The header link's accessible name is the brand text plus ", Home". Lighthouse accessibility: 100. |
| No Open Graph image | **Confirmed** | `public/og-image.jpg` (1200×630) was cropped from the existing approved brand banner. `og:image` is emitted once a domain is set, because it must be an absolute URL. |
| Favicon uses a large logo file | **Confirmed** | Replaced with emblem-only icons made from the brand logo: `favicon.ico` (16/32/48), 16/32 px PNGs, a 180 px Apple touch icon, and 192/512 px icons. |
| Organization and FAQ structured data need review | Reviewed | Both were correct. FAQ markup is generated from the visible FAQ text. Organization now gets a logo and `@id` once a domain is set. Added WebSite (home), WebPage (all indexable pages), Service (solution pages) and BreadcrumbList. |
| LocalBusiness may be useful | **Not added** | A verified street address, phone and opening hours would be needed, and client decision 9 (company details) is still open. |
| Duplicate calculator heading | **Confirmed** | A visually hidden `h2` repeated the page title. It now reads "Your estimate" ("تقديرك"). |

## 2. Route inventory

All routes are defined once in `src/content/seoHead.ts` (`ROUTES`). The router, prerender,
sitemap, canonical/hreflang tags, the site checker and the tests all read this list.

| Path | EN | AR | Status | Sitemap | Notes |
|---|---|---|---|---|---|
| `/en`, `/ar` | ✓ | ✓ | 200 | yes | Home |
| `/residential` | ✓ | ✓ | 200 | yes | Residential & Commercial |
| `/agriculture` | ✓ | ✓ | 200 | yes | Agricultural Farms |
| `/industrial` | ✓ | ✓ | 200 | yes | Industrial Facilities |
| `/oil-gas` | ✓ | ✓ | 200 | yes | **New:** solar hybrid systems for oil and gas sites |
| `/service` | ✓ | ✓ | 200 | yes | Services Sector |
| `/solar-irrigation-guide` | — | ✓ | AR 200, EN **404** | AR only | **New:** Arabic guide. No English page exists, so no hreflang pair is declared. |
| `/calculator` | ✓ | ✓ | 200 | yes | `?tab=home\|farm\|ind\|svc` selects a tab. The canonical URL has no query string. |
| `/how-we-work`, `/about` | ✓ | ✓ | 200 | yes | |
| `/contact` | ✓ | ✓ | 200 | yes | `?type=` preselects the site type. The canonical URL has no query string. |
| `/lp/villas`, `/lp/compounds`, `/lp/agriculture`, `/lp/industrial`, `/lp/service` | ✓ | ✓ | 200 | **no** | `noindex, follow`. No canonical or hreflang. Linked from the footer. |
| `/` | | | **307** → `/ar` if the browser prefers Arabic, else `/en` | no | Temporary, so language detection is not cached. |
| `/en/x/`, `/en/x.html` | | | **308** → `/en/x` | | `trailingSlash: false` and `cleanUrls`. |
| Anything else | | | **404** (`404.html`, noindex) | no | No catch-all rewrite, so unknown URLs never return the home page with status 200. |

## 3. How it works

- **Prerendering** (`scripts/build-site.mjs`, run by `npm run build`):
  1. the normal client build;
  2. an SSR build of `src/entry-server.tsx`;
  3. a render of every route and language with React 19 `prerenderToNodeStream`.

  Each output file contains that page's own `<title>`, description, robots, Open Graph, canonical,
  hreflang and JSON-LD, the full page HTML, and the correct `lang`/`dir`. The browser hydrates this
  HTML (`hydrateRoot`) instead of rendering from scratch. The build fails if a page has no title or
  `h1`, or if a Suspense fallback leaks into the HTML.
- **Hydration safety.** Values that only exist in the browser are applied immediately after
  hydration, so the HTML and the first client render are identical:
  - the theme, via `useSyncExternalStore`;
  - the `?tab=` and `?type=` query values;
  - the calculator estimate in router state;
  - the loader label, via `useIsClient`.

  Hero spark positions now come from a seeded generator. Tests check that hydration logs no errors.
- **One source for the domain.** `VITE_SITE_URL` must be a bare `https://` origin. Missing or
  invalid means no absolute URLs anywhere, and the build prints a warning. Preview deployments
  (`VERCEL_ENV=preview`) get `noindex, nofollow` and a disallow-all `robots.txt`.
- **Performance.** Google Fonts no longer block rendering, logo dimensions match the image, and all
  content is in the first HTML response.

## 4. Deployment (Vercel)

1. **Confirm the production domain** (client decision 7), for example `https://www.reservia-energy.com`.
2. **Connect the domain to Vercel.** This needs DNS and registrar access, which the team holds; I
   did not change anything. Add both `reservia-energy.com` and `www.reservia-energy.com` to the
   Vercel project, choose one as primary, and have Vercel redirect the other to it (308). Vercel
   provides HTTPS automatically. At Namecheap, replace the parking DNS records with the A and CNAME
   records Vercel shows.
3. **Set the environment variable** in Vercel → Project → Settings → Environment Variables →
   *Production only*: `VITE_SITE_URL=https://www.reservia-energy.com` (the primary host, no
   trailing slash). Leave it unset for Preview.
4. **Check the project settings.** Vercel reads `vercel.json` (build command `npm run build`,
   output `dist`). If the dashboard overrides the build or output settings, clear the overrides.
5. **Deploy**, then run the checker against the live site (read-only):
   ```bash
   npm run check:site -- https://www.reservia-energy.com --expect-origin=https://www.reservia-energy.com --strict-404
   ```
   Every line must pass. Also confirm `http://` redirects to `https://`, and that the non-primary
   host redirects to the primary one.

Until steps 1–3 are done, the site works on its Vercel URL and every page is crawlable HTML.
But there is no canonical and no sitemap, and the content cannot be found under the company domain.

## 5. Search engines and listings (manual; needs account access)

**Google Search Console**
1. Add a **Domain property** for `reservia-energy.com` and verify it with the DNS TXT record Google
   provides (this covers http, https, www and the apex).
2. Sitemaps → submit `https://www.reservia-energy.com/sitemap.xml`.
3. URL Inspection → test the live URLs `/en`, `/ar`, `/en/industrial`, `/ar/agriculture`,
   `/en/oil-gas` and `/ar/solar-irrigation-guide`. Check that "User-declared canonical" equals the
   URL and that the rendered HTML shows the page content. Request indexing for the key pages.
4. Over the following weeks, monitor Pages (indexed / not indexed and the reasons), the sitemap
   report, canonical selection ("Google-selected canonical"), and Core Web Vitals.

**Bing Webmaster Tools.** Import the site from Search Console, or add it and verify with DNS. Submit
the sitemap and use URL Inspection on the same pages. IndexNow is optional.

**Business profile and listings.** These are recommendations only; nothing has been created.
- **Google Business Profile**, only if the Maadi office receives customers or has staff there at
  stated hours. Use exactly the legal name, address and phone confirmed in client decision 9, and
  keep them identical to the website.
- **Industry listings:** Egyptian solar or renewable-energy industry associations Reservia
  belongs to, relevant chambers of commerce, the NREA qualified-contractor list (only once the
  certificate is issued, per client decision 1), and LinkedIn and Facebook company pages linking to
  the canonical domain.
- **Referral links:** equipment suppliers' installer directories, bank or IFC programme partner
  lists (if eligible), and press coverage of real completed projects.

## 6. Verification performed (22 October 2026, local production builds)

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc -b` | pass |
| Lint | `npm run lint` | 0 errors; the 8 warnings are pre-existing |
| Unit | `npm test` | **112 passed** |
| Browser | `npm run test:e2e` | **275 passed**: route matrix with axe, initial-HTML and hydration tests, new pages, and the checker in both build modes |
| Build | `npm run build` | 31 pages prerendered, plus `404.html` |
| Site checker, domain build on `serve` (Vercel rules) | `check-site.mjs http://localhost:4301 --expect-origin=… --strict-404` | all checks passed |
| Site checker, default build (no domain) | `check-site.mjs http://localhost:4302 --strict-404` | all checks passed |
| Checker catches errors | same, with a wrong `--expect-origin` | 85 failures reported (as intended) |
| HTTP statuses on `serve` | curl | `/` 307 → `/en`; `/en/industrial` 200; trailing slash and `.html` 301 to the clean URL; `/en/solar-irrigation-guide` and unknown URLs 404; `sitemap.xml` 200 `application/xml` |
| Lighthouse 12, mobile | `npx lighthouse …` on the local production build | /en 92 · /ar/residential 96 · /en/calculator 96 · /en/oil-gas 96 · /ar/solar-irrigation-guide 96 (performance); accessibility, best practices and SEO **100** on all five; CLS ≤ 0.03; LCP 2.3–3.2 s |

Lighthouse ran on a local server without a CDN. Re-measure on the live domain with PageSpeed
Insights after deployment, which will also show real-user (CrUX) data once there is traffic.

## 7. Content added, and sources

- **Oil and gas page** (`src/content/pages/oilGas.ts`, EN + AR). Every figure reuses numbers the
  site already sources: diesel EGP 20.50 a litre (as reported, 10 March 2026; Ahram Online) and about
  0.3 litres per kWh, giving about EGP 6.15 per kWh in fuel. The 30% worked example is labelled as an
  illustration. The only project mentioned is the existing, source-linked Esh El Mallaha example
  (Zawya, 1 June 2026), marked "Not a Reservia project". No Reservia oil and gas projects, customers,
  certifications or guarantees are claimed.
- **Arabic irrigation guide** (`src/content/pages/irrigationGuide.ts`).
  - The hydraulic formula P = Q·H / 367 is standard pump physics.
  - The efficiency range 0.4–0.6 is stated as an assumption.
  - Diesel and array sizing reuse the calculator's assumptions.
  - Financing cites only the IFC/ALEXBANK programme announcement (SolarQuarter, 22 March 2021, also
    on the About page). It states no rates, eligibility rules, subsidies or procedures, and tells
    farmers to confirm current programmes with the Agricultural Bank of Egypt or their bank.
  - Marked "reviewed 22 October 2026".
- **Residential price table.** Computed by `homeSystemPrice()` from the same price list the
  calculator uses (EGP 30,600 per kWp up to 10 kWp, battery EGP 120,000). It says "indicative",
  "final price after survey" and "reviewed 22 October 2026". **Client to confirm the price list
  year** (open since decision 5: the copy says 2026 in one place and 2027 in another).
- **Agriculture** (pump sizing factors and a guide link), **Industrial** (factory assessment and an
  oil and gas link), and **Calculator** (an intro and related-solution links): all qualitative, no
  new figures.
- **Not done:**
  - A separate hotel/resort page. It would duplicate the Services Sector page, which already covers
    hotels.
  - Case studies. There are no verified Reservia projects to describe.

## 8. Remaining risks and dependencies

- **The site is not on the company domain.** Until DNS points to Vercel and `VITE_SITE_URL` is set,
  there is no canonical, sitemap or `og:image`, and searches for the domain find the parking page.
  This is the main blocker for indexing.
- **Unconfirmed Vercel behaviour.** The `has: accept-language` redirect and `cleanUrls` were checked
  against Vercel's documented behaviour and tested with Vercel's `serve` (minus the header
  condition). The header condition itself must be confirmed after the first Vercel deployment. If it
  misbehaves, removing it leaves a plain `/` → `/en` redirect.
- **Content awaiting client review** before or soon after launch: the new Arabic and English copy on
  the oil and gas page and the guide, the price list year, and the financing wording (decision 12).
- **Photo licences.** The How We Work photo credits were removed (commit `8e72732`). The step 2
  (CC BY 2.0), step 5 and step 8 (CC BY-SA 4.0) photos require visible attribution under their
  licences. Restore a credit, or replace those photos.
- **No guarantee of results.** Indexing, rankings and traffic depend on Google and Bing. These
  changes remove the technical blockers, but they don't guarantee any of these outcomes.
