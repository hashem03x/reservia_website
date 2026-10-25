# Open client decisions

Last updated: 21 October 2026 (website improvements from the 13–17 October brief).

The website ships with a safe default for each of the ten questions below. None of
these defaults is an approved fact. Each one is set up so the client's answer is a
small, local change. The **Change when answered** column says exactly where.

| # | Decision | Current default on the site | Change when answered |
|---|---|---|---|
| 1 | NREA certificate | No certification claim anywhere (copy, badges, metadata, JSON-LD) | Badge + copy only after the certificate is issued |
| 2 | Response time | No response-time promise | Add the confirmed wording to the form success copy |
| 3 | Coverage / field teams | Map shows "regions we focus on"; coverage confirmed per enquiry | Replace `map_lead` copy |
| 4 | Net metering and permits | Answers stay qualified; the distribution company approves and sets terms | Update `a_net`, `a_perm`, `r_a2` |
| 5 | Tariff basis | Brief's figures kept, with source and verification status recorded | `src/config/tariffs.ts` |
| 6 | Service-sector tariff | 2.55 EGP/kWh, disclosed as an assumption | `RATES.service` + `s_note`, `s_faq_a1` |
| 7 | URL structure / domain | No canonical, hreflang or sitemap until a domain is set | Set `VITE_SITE_URL` |
| 8 | Clickable emails | Emails are plain text with a Copy button | `VITE_ENABLE_MAILTO_LINKS=true` |
| 9 | Public company details | Organization JSON-LD omits phones, emails and legal name | `VITE_PUBLISH_ORG_CONTACTS=true` |
| 10 | Meta server-side (CAPI) | Lead `eventId` is sent to the lead endpoint for deduplication | Backend work, see below |
| 11 | Partner logos | "Our partners" section hidden: no approved partner assets exist | Add logos to `src/content/partners.ts` |
| 12 | Financing wording | "Flexible financing" in homepage, footer and trust copy; payment terms removed | Confirm the offer applies to every segment |

---

## 1. NREA certificate

- **Why it matters.** An unsupported certification claim is a legal and trust risk. The client
  expects the qualifying certificate around March 2027.
- **Current state.** No NREA or "certified" claim exists in the copy, structured data or
  metadata. A unit test (`src/i18n/translations.test.ts`) and a browser test fail if one is
  reintroduced. Trust copy uses verifiable points instead: Maadi, Cairo office and a written
  QHSE policy.
- **Needed from the client.** The application date, and a copy of the certificate once issued.
- **When answered.** Add the badge and copy only after issuance. Update the claims test to allow
  the exact approved wording.

## 2. Response time

- **Why it matters.** A promise such as "within one working day" becomes a service commitment.
- **Current state.** No response-time promise anywhere. Success copy says the request was sent
  (`q_sent`, `lp_ok_d` "An engineer will call you") without a deadline. A test guards against
  "working day" / "within N hours" in both languages.
- **When answered.** Add the confirmed wording to `q_sent`, `lp_ok_d` and `h_micro` (EN and AR),
  and relax the guard test accordingly.

## 3. Coverage and field-team availability

- **Why it matters.** "Field teams cover…" is an operational claim.
- **Current state.** `map_lead` now says the map shows the regions Reservia focuses on, and that
  coverage for a site is confirmed when the customer gets in touch. Map points are unchanged.
- **When answered.** Restore a firmer coverage statement in `map_lead` (EN/AR) if field teams are
  confirmed for each region. Remove regions that are not covered.

## 4. Net metering and permits (Maadi distribution company)

- **Why it matters.** Permits and net-metering terms are set by the distribution company.
  The only public reference is a press summary (Egypt Today, 18 May 2026). That page returned
  HTTP 403 to our automated check, so it has not been re-verified.
- **Current state.** `a_perm` now attributes the statement to Egypt Today as a report, not a
  confirmed rule. Answers say the distribution company approves the connection and sets the
  settlement terms, and that no connection date is promised. `r_a2` adds "subject to your
  distribution company's approval".
- **When answered.** Replace the press reference with the confirmed process, fees and typical
  timing (EN/AR: `a_net`, `a_perm`, `r_a2`, `s5d`).

## 5. Tariff basis

- **Why it matters.** Every saving and payback figure depends on it.
- **Current state.** The brief's figures are used exactly, all from `src/config/tariffs.ts`:
  household tiers 0.68 / 0.87 / 1.06 / 1.74 / 2.18 / 2.35, 2.89 above 1,000 kWh, commercial 2.79,
  other users 2.55, diesel 20.50. Each figure carries its source, as-of date and status. The
  discrepancies, with figures, are in [`TARIFFS.md`](TARIFFS.md):
  - EgyptERA's April 2026 page lists **2.58** for the top household tier. **2.89** is press-reported
    (EnterpriseAM, 2 Aug 2026) and has not been seen on an EgyptERA page.
  - Band rules: EgyptERA's table hints that consumers above 100 kWh lose tiers 1–2, and that
    651–1,000 kWh is billed "from zero". The press tables don't say so. The existing progressive
    model is preserved. If the band rules apply, the reference villa's yearly saving drops from
    about EGP 36,800 to about EGP 36,460.
  - Diesel 20.50 is as of 10 March 2026 and flagged "check the current pump price".
  - The price-list year differs between copy keys: `r_ex_note` says 2027, while `c_assume` says
    prices inflate after 2026. Please confirm which price list is current.
- **When answered.** Edit `src/config/tariffs.ts`. Update the rate-board copy if the comparison
  changes (`l_res_cmp`, `ledger_note`, `c_assume`). Then run `npm test`: the reference-villa
  regression test reports any change in the published example figures, which must then be
  updated in `r_ex*` / `lpv_stat`.

## 6. Service-sector tariff category

- **Why it matters.** Hospitals, hotels and schools are not a separate EgyptERA category. They pay
  commercial tiers (up to 2.79) or the other-users rate (2.55 MV, 2.74 LV) depending on the
  connection.
- **Current state.** The calculator uses 2.55, disclosed as a cautious assumption in `s_note`, the
  service FAQ (`s_faq_a1`) and the campaign page stat label. Nothing says all such buildings pay
  2.55.
- **Needed from the client.** Sample bills per customer type.
- **When answered.** Update `RATES.service` (and the calculator's service mapping if it should
  differ from industry) plus the three copy keys.

## 7. URL structure and production domain

- **Why it matters.** Canonical URLs, hreflang pairs and the sitemap must point at the real domain.
- **Current state.** URLs are `/en/...` and `/ar/...` without trailing slashes. Campaign pages
  (`/lp/*`) and the 404 page are `noindex, follow` and carry no canonical or hreflang. With
  `VITE_SITE_URL` unset, no canonical, hreflang, `og:url` or sitemap is emitted, so nothing points
  at a guessed domain. Every route also gets a static HTML file (`dist/<lang><path>.html`) with its
  own title, description, `lang`/`dir` and Open Graph tags for crawlers that don't run JavaScript.
- **Needed from the client.** The production domain (www or apex), whether to keep `/en` + `/ar`
  (and which language `/` should default to), and confirmation that campaign pages stay noindex.
- **When answered.** Set `VITE_SITE_URL=https://…` and rebuild. Canonical, hreflang (+ x-default →
  English), `og:url`, `sitemap.xml` and a `Sitemap:` line in robots.txt are generated
  automatically. Configure the host to serve `/<lang>/<page>` from `<lang>/<page>.html`
  (default on Netlify, Cloudflare Pages and GitHub Pages; nginx needs
  `try_files $uri $uri.html /index.html`), with `/index.html` as the SPA fallback.

- **Update (22 October 2026, SEO audit).** `reservia-energy.com` and `www.reservia-energy.com`
  currently serve a Namecheap parking page, so the website is not on the company domain yet. Every
  page is now prerendered, and `vercel.json` handles clean URLs and 404s. Once the domain points to
  Vercel, setting `VITE_SITE_URL` for Production switches on canonicals, hreflang, `og:image` and the
  sitemap. See [`SEO_LAUNCH.md`](SEO_LAUNCH.md) §4 for the exact steps.

## 8. Clickable emails

- **Current state.** Both emails are shown as text with a Copy button. The footer email was a
  `mailto:` link before; it is now plain text, pending this decision. Phone numbers are `tel:`
  links (they already were in the footer), and clicks are tracked as `click_call`.
- **When answered.** Set `VITE_ENABLE_MAILTO_LINKS=true`. The contact page and footer then render
  `mailto:` links tracked as `click_email`. No code change is needed.
- **Update (October 2026, part 4).** At the client's request the footer now shows the sales email
  as a `mailto:` link whatever this flag says. The contact page still follows the flag. See §13 for
  the spelling of the address.

## 9. Public company details

- **Why it matters.** Structured data is read by search engines and repeated in results.
- **Current state.** Organization JSON-LD (static, in every HTML file) contains the brand name,
  "Reservia" / "ريزيرفيا", description, "Maadi, Cairo, EG" and, once a domain is set, `url`. No
  phone numbers, emails or `legalName`. The visible contact page still shows the numbers and
  emails from the reference template. Please confirm those too.
- **Needed from the client.** Legal company name, mobile number, both email addresses.
- **When answered.** Set `VITE_PUBLISH_ORG_CONTACTS=true` (and the `VITE_*_EMAIL` / `VITE_*_PHONE`
  values if they differ). Add `legalName` in `src/content/organization.ts` once it is confirmed.
- **Update (October 2026, part 2).** The client asked for **"Reservia Integrated Energy Solutions
  LLC"** in the footer identity and copyright line, which is done. It has **not** been added to
  structured data as `legalName`, because the brief says not to change registered legal
  information elsewhere without verifying the source. Confirm it is the registered name and it
  can go into the JSON-LD too.

## 10. Meta Conversions API (server-side) and CRM

- **Why it matters.** The browser Pixel and the server call must share one `event_id`, or Meta
  counts each lead twice.
- **Current state.**
  - Each lead gets one `eventId`. It is reused across retries and sent to the lead endpoint in the
    JSON body (`eventId`) and as an `Idempotency-Key` header.
  - Only after the endpoint returns 2xx does the browser push `generate_lead` (dataLayer, GA4) and
    the Pixel `Lead` with `eventID` set to that same id.
  - Preview mode and failed submissions never fire a lead event.
  - Analytics payloads are allowlisted: segment, group, source, page, language, numeric site
    input, system size. Names, phones, emails, notes and typed addresses can't be sent.
- **Not done here (needs credentials and backend).** The lead endpoint (`VITE_LEADS_API_URL`, ideally
  a server-side proxy), CRM storage, and the server-side CAPI call. None exist in this
  repository, and none have been faked.
- **The launch team needs to:**
  1. Provide the lead endpoint URL. It must return 2xx only after the lead is stored, honour the
     `Idempotency-Key`, and validate, rate-limit and spam-filter server-side.
  2. Store `eventId` with the CRM record.
  3. Send the server-side Meta `Lead` event with `event_id = eventId`, `event_name = "Lead"`, and
     hashed user data per Meta's rules, server-side only. The access token must never go into a
     `VITE_*` variable.
  4. Give agency access: Meta Business Manager (Pixel ID + CAPI token), GA4 property, GTM
     container, Google Ads conversion ID.
  5. Agree the CORS origin for the production domain on the lead endpoint.

---

## 11. Partner logos (added October 2026, part 2)

- **Why it matters.** The homepage "Our partners" carousel must show real, approved partnerships
  only.
- **Current state.** The repository has no partner names or logos, so none were invented.
  `PARTNERS` in `src/content/partners.ts` is empty and the section is **not rendered** in
  production, so the homepage shows no gap. In local development, or in a build with
  `VITE_PARTNERS_PREVIEW=true`, the carousel shows labelled "Logo pending" tiles so the design
  can be reviewed. Never set that flag for production.
- **Needed from the client.** For each partner: the approved company name, the logo (SVG or
  transparent WebP/PNG, at least 400 px wide), an optional website link, and written permission to
  display it.
- **When answered.** Add each logo under `src/assets/partners/` and an entry in `PARTNERS`
  (instructions are in that file). The section appears automatically.

## 12. Payment terms and financing wording (added October 2026, part 2)

- Payment terms by project type (the 70/30, 50/30/20 and 80/20 table, the per-page payment rows,
  the campaign-page payment chips and the service-sector payment FAQ) were removed at the client's
  request. Trust point 3 now reads: "You pay in stages tied to delivery, as set out in your
  contract, and flexible financing is available."
- "Flexible financing" appears in the homepage description, the footer ("designs, finances,
  installs and maintains") and trust point 3, all from the client's own copy. Please confirm the
  financing offer is available to every segment before launch.

### Other copy flagged for client review

- New Arabic copy written for the second October brief: the four category names (سكني وتجاري،
  المزارع الزراعية، المنشآت الصناعية، قطاع الخدمات), the slogan (توليد. تخزين. ترشيد. استدامة.),
  the homepage and footer descriptions, the LLC name (ش.ذ.م.م), the calculator fields (on-grid and
  off-grid, monthly cost, facility type, crop and tree lists), "الأسئلة الشائعة" and the partners
  labels.
- New Arabic copy written for the first October brief (not from the approved template deck): WhatsApp
  messages, form states (`q_sent`, `q_fail`, `lp_mock_*`, `err_number`, `q_err_summary`),
  service FAQ (`s_faq_*`), rate-board note (`l_res_cmp`, `l_dsl_warn`), `map_lead`, `a_perm`,
  `r_a2`, `tk6_d`, `a_small`, `lang_switch_sr`.
- Corrected copy, so the site matches its own calculator:
  - `tk6_d` / `a_small` said homes under about 500 kWh "usually take 10 years or more". At the
    current tariffs the calculator gives 8.9–9.6 years for 400–499 kWh, and ≥ 10 years only below
    about 390 kWh. The copy now says "under about 400 kWh: 10 years or more; most homes under
    1,000 kWh: 8 to 10 years".
  - The reference-villa saving is now "about EGP 36,800" (calculator: 36,804) instead of 37,000.
- Third-party examples on the service page are all labelled "Not a Reservia project":
  - Luxor hospital (1.3 MW): verified against the UICC source. That source gives conflicting solar
    shares (38% vs 54%), and the site does not quote either.
  - Cairo University (660 kW): verified.
  - Sharm El-Sheikh / TAQA (Afrik21) and the five museums (UNDP) could not be re-fetched (no
    content / HTTP 403) and remain as written in the approved template. Please re-check before
    launch.

## 13. Open points from the October 2026 part 4 brief

- **Sales email spelling.** The footer shows **Resrevia_sales@reservia-energu.com** exactly as
  supplied, as a `mailto:` link. Both parts differ from the company profile, which uses the
  **reservia-energy.com** domain (`Business_info@reservia-energy.com`):
  - the mailbox reads "Resrevia" rather than "Reservia";
  - the domain reads "energ**u**" rather than "energ**y**".

  Mail sent to the domain as written will probably bounce. Please confirm the address. The
  correction is one line, `salesEmail` in `src/config/contactDefaults.ts` (or the `VITE_SALES_EMAIL`
  variable).
- **Company profile slides.** The About page carousel is built and tested, but it stays hidden until
  the slide images exist. The project has no PowerPoint or LibreOffice, and the deck is built from
  separate shapes and text, so no faithful slide images could be produced here. Nothing was
  approximated or redrawn.
  - **What is needed:** export `Company Profile.pptx` from PowerPoint (File → Export → PNG, all
    slides, 1920 × 1080).
  - **Where it goes:** save the images as `src/assets/profile/slide-01.webp` … `slide-15.webp`. PNG
    files can be converted to WebP.
  - **What happens then:** the carousel appears automatically, in deck order, with no code change.
    The accessible descriptions for each slide are already in `src/content/profileSlides.ts`.
- **Brand palette source.** The deck's theme file is the default Office theme, so the colours were
  taken from the deck itself:
  - colours used on the slides, as found in the slide XML;
  - dominant colours of the cover image.

  | Role | Colours |
  | --- | --- |
  | Deep emerald | #0A3D30 / #004D3A |
  | Forest green | #1B5E20 |
  | Teal | #005B4F |
  | Leaf green | #7CB342 |
  | Pale green | #A5D6A7 |
  | Aqua | #72D7C7 |
  | Mint | #EAF5F1 |

  All of them live in `src/styles/tokens.css`. If the company has an official brand guide with
  exact values, swapping them in there updates the whole site.
- **Hosting catch-all rewrite.** `vercel.json` now sends every unknown path to `/index.html` with
  status 200. Mistyped URLs therefore return a "soft 404": the page says "not found" while the HTTP
  status says success. Search engines treat these as low-quality pages. The prerendered build
  already writes a real `404.html` for this case. Removing the `rewrites` block restores proper 404
  status codes, and every real page is prerendered, so no route depends on the rewrite. This was
  left unchanged pending your decision.
