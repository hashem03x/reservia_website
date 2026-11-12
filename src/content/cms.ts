/**
 * SEO overrides published from the Reservia Website Management CMS (Central Portal).
 *
 * The CMS publishes a feed (GET <CMS_API_URL>/website/public/site) of the pages an editor has
 * published, with each page's head metadata already resolved per language. The build fetches it
 * once (scripts/build-site.mjs), and every consumer -- prerendering, the browser bundle, the
 * sitemap and the root index.html -- reads the SAME validated copy through the `virtual:cms-feed`
 * module (vite.config.ts), so the HTML a crawler gets and the page React hydrates never disagree.
 *
 * The website's built-in pages are written in code and keep their own text (content/seo.ts). The
 * CMS only overrides what an editor actually typed: a field resolved from source 'custom' replaces
 * the code's value; anything else (an empty field) leaves the code's value in place.
 *
 * CMS-built ("managed") pages are rendered from their published sections by src/cms/PageRenderer:
 * a managed page at a new path becomes a new page of the site (router, prerender, sitemap); a
 * managed page published at an existing path replaces that page's built-in body. The feed also
 * carries the published menus, site settings, tracking ids and custom code. With no feed
 * configured, or nothing published, the site renders exactly as it does without a CMS.
 *
 * Pure and framework-free: imported by vite.config.ts (Node), React components and unit tests.
 */
import type { Lang } from './seoHead.ts';

export const CMS_SCHEMA_VERSION = 1;

/** One page in one language, as the CMS resolved it (backend utils/website/seoResolver.js). */
export interface CmsPageSeo {
  title: string;
  titleSource: string;
  description: string;
  descriptionSource: string;
  url: string;
  canonical: string;
  robots: string;
  indexable: boolean;
  openGraph: { title: string; description: string; image: string | null };
  twitter: { card: string; cardSource: string };
  breadcrumbs: Array<{ name: string; url: string; path?: string }>;
  warnings: string[];
}

/** One section of a managed page (backend utils/website/sectionTypes.js). */
export interface CmsSection {
  type: string;
  content: Record<string, unknown>;
  settings: CmsSectionSettings;
}
export interface CmsSectionSettings {
  devices: { desktop: boolean; tablet: boolean; mobile: boolean };
  background: { type: 'none' | 'light' | 'brand' | 'dark' | 'color' | 'image'; color: string; image: { url: string; altEn?: string; altAr?: string } | null; overlay: number };
  spacing: { top: Spacing; bottom: Spacing };
  align: 'start' | 'center' | 'end';
  container: 'normal' | 'wide' | 'full';
  anchorId: string;
}
export type Spacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CmsPage {
  slug: string;
  /** Language-agnostic, '/' for home (the website's ROUTES use '' for home). */
  path: string;
  pageType: 'managed' | 'legacy';
  isHomePage: boolean;
  locales: Lang[];
  seo: Partial<Record<Lang, CmsPageSeo>>;
  titleEn: string;
  titleAr: string;
  layout: 'default' | 'landing' | 'full-width';
  parentSlug: string | null;
  /** Managed pages only; [] for legacy pages. */
  sections: CmsSection[];
  /** True when no built-in route exists at this path - the page exists only in the CMS. */
  dynamic: boolean;
}

export interface CmsNavLink {
  type: 'link' | 'group';
  labelEn: string;
  labelAr: string;
  /** Language-agnostic site path ('/about') or an external address. */
  href?: string;
  external?: boolean;
  target: '_self' | '_blank';
  items?: CmsNavLink[];
}
export interface CmsNavigation {
  header: CmsNavLink[];
  footer: Array<{ titleEn: string; titleAr: string; items: CmsNavLink[] }>;
}

export interface CmsSettings {
  siteNameEn: string;
  siteNameAr: string;
  taglineEn: string;
  taglineAr: string;
  descriptionEn: string;
  descriptionAr: string;
  logo: string | null;
  logoDark: string | null;
  favicon: string | null;
  defaultOgImage: string | null;
  footerCopyrightEn: string;
  footerCopyrightAr: string;
  socialLinks: Partial<Record<'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok' | 'x', string>>;
  businessHours: Array<{ day: string; open: string; close: string; closed: boolean }>;
  businessHoursNoteEn: string;
  businessHoursNoteAr: string;
  header: { showCta: boolean; ctaLabelEn: string; ctaLabelAr: string; ctaHref: string; showPhone: boolean; sticky: boolean };
  footer: { showSocial: boolean; showContact: boolean };
  cookieConsent: { enabled: boolean; messageEn?: string; messageAr?: string; acceptLabelEn?: string; acceptLabelAr?: string; policyUrl?: string; blockTrackingUntilConsent?: boolean };
  robots: { discourageIndexing: boolean; disallowPaths: string[] };
  /** Only when an administrator chose to publish them (otherwise the site's own contact details). */
  contact: { businessEmail: string; officePhone: string; mobilePhone: string; whatsappNumber: string; addressEn: string; addressAr: string; mapEmbedUrl: string } | null;
}

export interface CmsIntegrations {
  ga4?: string;
  gtm?: string;
  metaPixel?: string;
  googleAds?: string;
  verification: Partial<Record<'google' | 'bing' | 'meta' | 'yandex' | 'pinterest', string>>;
}

export interface CmsCustomCode {
  id: string;
  name: string;
  kind: 'html' | 'css' | 'js';
  placement: 'head' | 'body_start' | 'body_end';
  scope: 'global' | 'page';
  pageSlug: string | null;
  code: string;
}

export interface CmsFeed {
  schemaVersion: number;
  generatedAt: string | null;
  pages: CmsPage[];
  settings: CmsSettings | null;
  navigation: CmsNavigation;
  integrations: CmsIntegrations;
  customCode: CmsCustomCode[];
}

export const EMPTY_CMS_FEED: CmsFeed = {
  schemaVersion: CMS_SCHEMA_VERSION,
  generatedAt: null,
  pages: [],
  settings: null,
  navigation: { header: [], footer: [] },
  integrations: { verification: {} },
  customCode: [],
};

/** What the CMS changes on one page in one language. Every field is optional = keep the code's value. */
export interface CmsOverrides {
  title?: string;
  description?: string;
  noindex?: boolean;
  nofollow?: boolean;
  /** Absolute; only when an editor pointed the canonical at another URL. */
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  /** Breadcrumb label per language-agnostic route path ('' = home). */
  crumbLabels: Record<string, string>;
  hideBreadcrumbs: boolean;
}

const NO_OVERRIDES: CmsOverrides = Object.freeze({ crumbLabels: Object.freeze({}) as Record<string, string>, hideBreadcrumbs: false }) as CmsOverrides;

/** CMS path ('/', '/about') -> route path ('', '/about'). */
export const toRoutePath = (cmsPath: string) => (cmsPath === '/' ? '' : cmsPath.replace(/\/+$/, ''));

// ---------------------------------------------------------------------------------------------
// Validation: the feed comes from another system, so nothing is trusted blindly. Anything
// malformed is dropped (and reported), never rendered.
// ---------------------------------------------------------------------------------------------

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const httpsUrl = (v: unknown) => {
  const s = str(v, 2000);
  if (!s) return '';
  try {
    return new URL(s).protocol === 'https:' ? s : '';
  } catch {
    return '';
  }
};

function cleanSeo(raw: unknown): CmsPageSeo | null {
  if (!isObj(raw)) return null;
  const og = isObj(raw.openGraph) ? raw.openGraph : {};
  const tw = isObj(raw.twitter) ? raw.twitter : {};
  const crumbs = Array.isArray(raw.breadcrumbs) ? raw.breadcrumbs.filter(isObj) : [];
  return {
    title: str(raw.title, 200),
    titleSource: str(raw.titleSource, 20),
    description: str(raw.description, 400),
    descriptionSource: str(raw.descriptionSource, 20),
    url: str(raw.url, 2000),
    canonical: str(raw.canonical, 2000),
    robots: str(raw.robots, 40),
    indexable: raw.indexable !== false,
    openGraph: { title: str(og.title, 200), description: str(og.description, 400), image: httpsUrl(og.image) || null },
    twitter: { card: str(tw.card, 30), cardSource: str(tw.cardSource, 10) },
    breadcrumbs: crumbs.map((c) => ({ name: str(c.name, 100), url: str(c.url, 2000), path: typeof c.path === 'string' ? c.path : undefined })),
    warnings: Array.isArray(raw.warnings) ? raw.warnings.filter((w): w is string => typeof w === 'string') : [],
  };
}

// ---- sections ----
/** Every section type the website can render (src/cms/sections). Unknown types are dropped. */
export const RENDERABLE_SECTION_TYPES = [
  'hero', 'imageText', 'text', 'services', 'solutions', 'features', 'statistics', 'testimonials', 'partners', 'gallery', 'video', 'cta', 'faq', 'process', 'team', 'contactInfo', 'map', 'customHtml',
  'about', 'projects', 'benefits', 'contact',
] as const;
const SPACINGS = ['none', 'sm', 'md', 'lg', 'xl'];
const safeMedia = (v: unknown) => {
  const u = typeof v === 'string' ? v.trim() : '';
  if (!u) return '';
  if (u.startsWith('/') && !u.startsWith('//')) return u;
  try {
    const p = new URL(u).protocol;
    return p === 'https:' || (p === 'http:' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u)) ? u : '';
  } catch {
    return '';
  }
};
/** Strips any media URL that is not https (or a site path) from section content, recursively. */
function cleanContent(value: unknown, depth = 0): unknown {
  if (depth > 6) return undefined;
  if (Array.isArray(value)) return value.slice(0, 60).map((v) => cleanContent(v, depth + 1));
  if (isObj(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (isObj(v) && typeof v.url === 'string') {
        const url = safeMedia(v.url);
        if (url) out[k] = { ...v, url };
        continue;
      }
      out[k] = cleanContent(v, depth + 1);
    }
    return out;
  }
  if (typeof value === 'string') return value.slice(0, 60000);
  return typeof value === 'number' || typeof value === 'boolean' || value === null ? value : undefined;
}
export function cleanSectionSettings(raw: unknown): CmsSectionSettings {
  const s = isObj(raw) ? raw : {};
  const d = isObj(s.devices) ? s.devices : {};
  const b = isObj(s.background) ? s.background : {};
  const sp = isObj(s.spacing) ? s.spacing : {};
  const bgImage = isObj(b.image) && safeMedia(b.image.url) ? { url: safeMedia(b.image.url), altEn: str(b.image.altEn, 200), altAr: str(b.image.altAr, 200) } : null;
  const bgType = ['none', 'light', 'brand', 'dark', 'color', 'image'].includes(b.type as string) ? (b.type as CmsSectionSettings['background']['type']) : 'none';
  return {
    devices: { desktop: d.desktop !== false, tablet: d.tablet !== false, mobile: d.mobile !== false },
    background: { type: bgType === 'image' && !bgImage ? 'none' : bgType, color: /^#[0-9a-f]{3,6}$/i.test(String(b.color || '')) ? String(b.color) : '', image: bgImage, overlay: Math.min(90, Math.max(0, Number(b.overlay) || 0)) },
    spacing: { top: (SPACINGS.includes(sp.top as string) ? sp.top : 'md') as Spacing, bottom: (SPACINGS.includes(sp.bottom as string) ? sp.bottom : 'md') as Spacing },
    align: (['start', 'center', 'end'].includes(s.align as string) ? s.align : 'start') as CmsSectionSettings['align'],
    container: (['normal', 'wide', 'full'].includes(s.container as string) ? s.container : 'normal') as CmsSectionSettings['container'],
    anchorId: /^[a-z][a-z0-9-]{0,40}$/.test(String(s.anchorId || '')) ? String(s.anchorId) : '',
  };
}
export function cleanSections(raw: unknown, warnings: string[] = [], where = 'page'): CmsSection[] {
  if (!Array.isArray(raw)) return [];
  const out: CmsSection[] = [];
  for (const sec of raw) {
    if (!isObj(sec) || typeof sec.type !== 'string') continue;
    if (!(RENDERABLE_SECTION_TYPES as readonly string[]).includes(sec.type)) {
      warnings.push(`${where}: section type "${sec.type}" is not supported by this website build - skipped`);
      continue;
    }
    out.push({ type: sec.type, content: (cleanContent(isObj(sec.content) ? sec.content : {}) as Record<string, unknown>) || {}, settings: cleanSectionSettings(sec.settings) });
  }
  return out;
}

// ---- menus, settings, tracking, custom code ----
const SAFE_HREF = /^(https?:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+0-9 ()-]+|\/[^\s<>"']*|#[A-Za-z0-9_-]+)$/i;
function cleanNav(list: unknown, depth = 0): CmsNavLink[] {
  if (!Array.isArray(list) || depth > 3) return [];
  const out: CmsNavLink[] = [];
  for (const e of list.slice(0, 60)) {
    if (!isObj(e)) continue;
    const labelEn = str(e.labelEn, 60);
    const labelAr = str(e.labelAr, 60);
    if (!labelEn && !labelAr) continue;
    const href = typeof e.href === 'string' && SAFE_HREF.test(e.href.trim()) ? e.href.trim() : undefined;
    const target = e.target === '_blank' ? '_blank' : '_self';
    if (e.type === 'group') {
      const items = cleanNav(e.items, depth + 1);
      if (items.length) out.push({ type: 'group', labelEn, labelAr, href, external: e.external === true, target, items });
    } else if (href) {
      out.push({ type: 'link', labelEn, labelAr, href, external: e.external === true || /^(https?:|mailto:|tel:)/i.test(href), target });
    }
  }
  return out;
}
function cleanNavigation(raw: unknown): CmsNavigation {
  const n = isObj(raw) ? raw : {};
  return {
    header: cleanNav(n.header),
    footer: (Array.isArray(n.footer) ? n.footer : [])
      .filter(isObj)
      .slice(0, 6)
      .map((c) => ({ titleEn: str(c.titleEn, 60), titleAr: str(c.titleAr, 60), items: cleanNav(c.items) }))
      .filter((c) => c.items.length),
  };
}
const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
function cleanSettings(raw: unknown): CmsSettings | null {
  if (!isObj(raw) || !Object.keys(raw).length) return null;
  const h = isObj(raw.header) ? raw.header : {};
  const fo = isObj(raw.footer) ? raw.footer : {};
  const cc = isObj(raw.cookieConsent) ? raw.cookieConsent : {};
  const rb = isObj(raw.robots) ? raw.robots : {};
  const sl = isObj(raw.socialLinks) ? raw.socialLinks : {};
  const c = isObj(raw.contact) ? raw.contact : null;
  const img = (v: unknown) => safeMedia(v) || null;
  return {
    siteNameEn: str(raw.siteNameEn, 120),
    siteNameAr: str(raw.siteNameAr, 120),
    taglineEn: str(raw.taglineEn, 200),
    taglineAr: str(raw.taglineAr, 200),
    descriptionEn: str(raw.descriptionEn, 600),
    descriptionAr: str(raw.descriptionAr, 600),
    logo: img(raw.logo),
    logoDark: img(raw.logoDark),
    favicon: img(raw.favicon),
    defaultOgImage: img(raw.defaultOgImage),
    footerCopyrightEn: str(raw.footerCopyrightEn, 200),
    footerCopyrightAr: str(raw.footerCopyrightAr, 200),
    socialLinks: Object.fromEntries(Object.entries(sl).filter(([k, v]) => ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok', 'x'].includes(k) && httpsUrl(v)).map(([k, v]) => [k, httpsUrl(v)])),
    businessHours: (Array.isArray(raw.businessHours) ? raw.businessHours : []).filter(isObj).slice(0, 7).map((r) => ({ day: str(r.day, 3), open: str(r.open, 5), close: str(r.close, 5), closed: r.closed === true })),
    businessHoursNoteEn: str(raw.businessHoursNoteEn, 200),
    businessHoursNoteAr: str(raw.businessHoursNoteAr, 200),
    header: { showCta: bool(h.showCta, true), ctaLabelEn: str(h.ctaLabelEn, 40), ctaLabelAr: str(h.ctaLabelAr, 40), ctaHref: typeof h.ctaHref === 'string' && SAFE_HREF.test(h.ctaHref) ? h.ctaHref : '', showPhone: bool(h.showPhone, true), sticky: bool(h.sticky, true) },
    footer: { showSocial: bool(fo.showSocial, true), showContact: bool(fo.showContact, true) },
    cookieConsent: cc.enabled === true ? { enabled: true, messageEn: str(cc.messageEn, 400), messageAr: str(cc.messageAr, 400), acceptLabelEn: str(cc.acceptLabelEn, 30), acceptLabelAr: str(cc.acceptLabelAr, 30), policyUrl: typeof cc.policyUrl === 'string' && SAFE_HREF.test(cc.policyUrl) ? cc.policyUrl : '', blockTrackingUntilConsent: cc.blockTrackingUntilConsent !== false } : { enabled: false },
    robots: { discourageIndexing: rb.discourageIndexing === true, disallowPaths: (Array.isArray(rb.disallowPaths) ? rb.disallowPaths : []).filter((p): p is string => typeof p === 'string' && /^\/[A-Za-z0-9_\-./*?=&%]*$/.test(p)).slice(0, 50) },
    contact: c
      ? { businessEmail: str(c.businessEmail, 120), officePhone: str(c.officePhone, 40), mobilePhone: str(c.mobilePhone, 40), whatsappNumber: str(c.whatsappNumber, 40), addressEn: str(c.addressEn, 300), addressAr: str(c.addressAr, 300), mapEmbedUrl: httpsUrl(c.mapEmbedUrl) }
      : null,
  };
}
const TRACKING_ID = { ga4: /^G-[A-Z0-9]{6,12}$/, gtm: /^GTM-[A-Z0-9]{4,10}$/, metaPixel: /^\d{10,20}$/, googleAds: /^AW-\d{6,12}$/ } as const;
function cleanIntegrations(raw: unknown): CmsIntegrations {
  const r = isObj(raw) ? raw : {};
  const out: CmsIntegrations = { verification: {} };
  for (const [k, rx] of Object.entries(TRACKING_ID) as Array<[keyof typeof TRACKING_ID, RegExp]>) if (typeof r[k] === 'string' && rx.test(r[k] as string)) out[k] = r[k] as string;
  const v = isObj(r.verification) ? r.verification : {};
  for (const k of ['google', 'bing', 'meta', 'yandex', 'pinterest'] as const) if (typeof v[k] === 'string' && /^[A-Za-z0-9_\-=.:+/]{6,160}$/.test(v[k] as string)) out.verification[k] = v[k] as string;
  return out;
}
function cleanCustomCode(raw: unknown): CmsCustomCode[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: CmsCustomCode[] = [];
  for (const c of raw) {
    if (!isObj(c) || typeof c.code !== 'string' || !c.code.trim()) continue;
    const kind = c.kind === 'css' || c.kind === 'js' ? c.kind : 'html';
    const placement = kind === 'css' ? 'head' : c.placement === 'body_start' || c.placement === 'body_end' ? c.placement : 'head';
    const key = `${kind}|${placement}|${c.code}`;
    if (seen.has(key)) continue; // the same snippet twice is injected once
    seen.add(key);
    out.push({ id: str(c.id, 40), name: str(c.name, 120), kind, placement, scope: c.scope === 'page' ? 'page' : 'global', pageSlug: c.scope === 'page' ? str(c.pageSlug, 100) || null : null, code: c.code.slice(0, 65536) });
  }
  return out;
}

/**
 * Validates a feed response (the API's `{ success, data }` envelope or the bare data) against the
 * website's own route inventory. A LEGACY page needs a built-in route (it only overrides SEO); a
 * MANAGED page at a path with no built-in route becomes a new, CMS-only page (`dynamic`).
 * @throws when the feed is not a usable CMS feed at all
 */
export function validateCmsFeed(raw: unknown, routePaths: string[]): { feed: CmsFeed; warnings: string[] } {
  const data = isObj(raw) && isObj(raw.data) ? raw.data : raw;
  if (!isObj(data)) throw new Error('CMS feed is not a JSON object');
  if (data.schemaVersion !== CMS_SCHEMA_VERSION) throw new Error(`CMS feed schemaVersion ${String(data.schemaVersion)} is not supported (expected ${CMS_SCHEMA_VERSION})`);
  if (!Array.isArray(data.pages)) throw new Error('CMS feed has no pages array');

  const known = new Set(routePaths);
  const warnings: string[] = [];
  const pages: CmsPage[] = [];
  const seen = new Set<string>();
  for (const p of data.pages) {
    if (!isObj(p) || typeof p.path !== 'string') {
      warnings.push('skipped a malformed page entry');
      continue;
    }
    const routePath = toRoutePath(p.path);
    const managed = p.pageType === 'managed';
    if (!known.has(routePath) && !managed) {
      warnings.push(`CMS page "${String(p.slug)}" (${p.path}) has no page on the website - skipped`);
      continue;
    }
    if (managed && !/^\/([a-z0-9-]+(\/[a-z0-9-]+)*)?$/.test(p.path)) {
      warnings.push(`CMS page "${String(p.slug)}" has an unusable path (${p.path}) - skipped`);
      continue;
    }
    if (routePath.startsWith('/__')) {
      warnings.push(`CMS page "${String(p.slug)}" uses a reserved path (${p.path}) - skipped`);
      continue;
    }
    if (seen.has(routePath)) {
      warnings.push(`two CMS pages use ${p.path} - only the first is used`);
      continue;
    }
    seen.add(routePath);
    const seo: CmsPage['seo'] = {};
    for (const lang of ['ar', 'en'] as Lang[]) {
      const s = isObj(p.seo) ? cleanSeo(p.seo[lang]) : null;
      if (s) seo[lang] = s;
    }
    const locales = Array.isArray(p.locales) ? (p.locales.filter((l) => l === 'ar' || l === 'en') as Lang[]) : [];
    if (managed && !locales.length) {
      warnings.push(`CMS page "${String(p.slug)}" has no language - skipped`);
      continue;
    }
    pages.push({
      slug: str(p.slug, 100),
      path: p.path,
      pageType: managed ? 'managed' : 'legacy',
      isHomePage: p.isHomePage === true,
      locales,
      seo,
      titleEn: str(p.titleEn, 120),
      titleAr: str(p.titleAr, 120),
      layout: p.layout === 'landing' || p.layout === 'full-width' ? p.layout : 'default',
      parentSlug: typeof p.parentSlug === 'string' ? p.parentSlug : null,
      sections: managed ? cleanSections(p.sections, warnings, String(p.slug)) : [],
      dynamic: !known.has(routePath),
    });
  }
  return {
    feed: {
      schemaVersion: CMS_SCHEMA_VERSION,
      generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : null,
      pages,
      settings: cleanSettings(data.settings),
      navigation: cleanNavigation(data.navigation),
      integrations: cleanIntegrations(data.integrations),
      customCode: cleanCustomCode(data.customCode),
    },
    warnings,
  };
}

// ---------------------------------------------------------------------------------------------
// Applying the feed
// ---------------------------------------------------------------------------------------------

export function cmsPageFor(feed: CmsFeed | null | undefined, routePath: string): CmsPage | undefined {
  return feed?.pages.find((p) => toRoutePath(p.path) === routePath);
}

/** The managed (section-built) page published at a route path, if any. */
export function managedPageFor(feed: CmsFeed | null | undefined, routePath: string): CmsPage | undefined {
  const p = cmsPageFor(feed, routePath);
  return p && p.pageType === 'managed' ? p : undefined;
}

/** Validates one draft page from the signed preview endpoint (GET /website/public/preview/:token). */
export function validatePreviewPage(raw: unknown): { page: CmsPage; navigation: CmsNavigation; settings: CmsSettings | null; expiresAt: string | null } {
  const data = isObj(raw) && isObj(raw.data) ? raw.data : raw;
  if (!isObj(data) || data.preview !== true || !isObj(data.page)) throw new Error('This is not a preview response.');
  const p = data.page;
  const seo: CmsPage['seo'] = {};
  for (const lang of ['ar', 'en'] as Lang[]) {
    const v = isObj(p.seo) ? cleanSeo(p.seo[lang]) : null;
    if (v) seo[lang] = v;
  }
  const page: CmsPage = {
    slug: str(p.slug, 100),
    path: typeof p.path === 'string' ? p.path : '/',
    pageType: p.pageType === 'managed' ? 'managed' : 'legacy',
    isHomePage: p.isHomePage === true,
    locales: Array.isArray(p.locales) ? (p.locales.filter((l) => l === 'ar' || l === 'en') as Lang[]) : [],
    seo,
    titleEn: str(p.titleEn, 120),
    titleAr: str(p.titleAr, 120),
    layout: p.layout === 'landing' || p.layout === 'full-width' ? p.layout : 'default',
    parentSlug: typeof p.parentSlug === 'string' ? p.parentSlug : null,
    sections: cleanSections(p.sections),
    dynamic: false,
  };
  return { page, navigation: cleanNavigation(data.navigation), settings: cleanSettings(data.settings), expiresAt: typeof data.expiresAt === 'string' ? data.expiresAt : null };
}

/** The CMS overrides for one route in one language; none when the page isn't published in the CMS. */
export function cmsOverrides(feed: CmsFeed | null | undefined, lang: Lang, routePath: string): CmsOverrides {
  const page = cmsPageFor(feed, routePath);
  const s = page?.seo[lang];
  if (!page || !s) return NO_OVERRIDES;

  const crumbLabels: Record<string, string> = {};
  for (const c of s.breadcrumbs) if (c.path !== undefined && c.name) crumbLabels[toRoutePath(c.path)] = c.name;
  const [, follow] = s.robots.split(',');
  const card = s.twitter.cardSource === 'custom' && (s.twitter.card === 'summary' || s.twitter.card === 'summary_large_image') ? s.twitter.card : undefined;
  const canonicalOverridden = s.warnings.includes('canonical_overridden') && /^https:\/\//.test(s.canonical);

  return {
    title: s.titleSource === 'custom' && s.title ? s.title : undefined,
    description: s.descriptionSource === 'custom' && s.description ? s.description : undefined,
    noindex: !s.indexable || undefined,
    nofollow: follow?.trim() === 'nofollow' || undefined,
    canonical: canonicalOverridden ? s.canonical : undefined,
    ogTitle: s.openGraph.title || undefined,
    ogDescription: s.openGraph.description || undefined,
    ogImage: s.openGraph.image || undefined,
    twitterCard: card,
    crumbLabels,
    // A non-home page always has at least the Home crumb unless an editor switched them off.
    hideBreadcrumbs: !page.isHomePage && s.breadcrumbs.length === 0,
  };
}
