/**
 * Visual editor configuration: what an editor changed on the real website, independent of how it
 * is rendered. Pure (no React, no DOM): used by the build (published CSS in every page's <head>),
 * the browser runtime (content overrides) and the editor bridge (live CSS).
 *
 * Elements are addressed by their editor id (`data-ed`, added at build time by
 * editor-plugin/editorIds.ts). Overrides live per route ('/', '/about', ...) or for every page ('*').
 * Styles are emitted as CSS rules on `[data-ed="..."]` with !important, so they win over the site's
 * own stylesheets without touching them; responsive values are emitted inside the same breakpoints
 * the editor previews (desktop >= 1024px, tablet 640-1023px, mobile < 640px) so an edit made for
 * one device never changes the existing layout of another.
 */
export type Lang = 'en' | 'ar';
export type Device = 'desktop' | 'tablet' | 'mobile';
export type StyleMap = Record<string, string>;
export interface StyleBuckets {
  /** Applies on every device (colors, fonts, borders...). */
  all?: StyleMap;
  desktop?: StyleMap;
  tablet?: StyleMap;
  mobile?: StyleMap;
  /** :hover state, every device. */
  hover?: StyleMap;
}
export interface ElOverride {
  label?: string;
  text?: Partial<Record<Lang, string>>;
  attrs?: { src?: string; mobileSrc?: string; alt?: Partial<Record<Lang, string>>; href?: string; target?: '_self' | '_blank' };
  styles?: StyleBuckets;
  hidden?: Partial<Record<Device, boolean>>;
  /** Not rendered at all (removed from the HTML). */
  deleted?: boolean;
  /** Visual order of this element's children (their editor ids). */
  order?: string[];
  /** The children were laid out in normal flow: switch to a column flexbox so `order` applies. */
  flexify?: boolean;
  /** New elements (ids into VisualConfig.nodes) appended inside this element. */
  insert?: string[];
}
export type NodeType = 'heading' | 'text' | 'image' | 'video' | 'button' | 'icon' | 'box' | 'spacer' | 'divider' | 'list' | 'faq' | 'html';
export interface VNode {
  type: NodeType;
  props: Record<string, unknown>;
  children?: string[];
}
export interface RouteConfig {
  el: Record<string, ElOverride>;
  /** Page-specific CSS (administrators). */
  css?: string;
}
export interface VisualConfig {
  v: 1;
  /** Design tokens: CSS custom properties on :root (e.g. '--sun': '#7cb342'). */
  tokens: Record<string, string>;
  /** Global component styles, keyed by GLOBAL_TARGETS. */
  rules: Record<string, StyleBuckets>;
  /** Site-wide CSS (administrators). */
  css: string;
  routes: Record<string, RouteConfig>;
  nodes: Record<string, VNode>;
}

export const EMPTY_VISUAL: VisualConfig = { v: 1, tokens: {}, rules: {}, css: '', routes: {}, nodes: {} };

export const MEDIA: Record<Device, string> = {
  desktop: '(min-width: 1024px)',
  tablet: '(min-width: 640px) and (max-width: 1023px)',
  mobile: '(max-width: 639px)',
};

/** Global component targets the design editor can style (never arbitrary selectors). */
export const GLOBAL_TARGETS: Record<string, { selector: string; labelEn: string }> = {
  body: { selector: 'body', labelEn: 'Page body' },
  headings: { selector: 'h1, h2, h3, h4', labelEn: 'All headings' },
  h1: { selector: 'h1', labelEn: 'Heading 1' },
  h2: { selector: 'h2', labelEn: 'Heading 2' },
  h3: { selector: 'h3', labelEn: 'Heading 3' },
  text: { selector: 'p, li', labelEn: 'Paragraphs and lists' },
  links: { selector: 'main a:not(.btn)', labelEn: 'Links' },
  buttons: { selector: '.btn', labelEn: 'All buttons' },
  buttonPrimary: { selector: '.btn.sun', labelEn: 'Primary button' },
  buttonSecondary: { selector: '.btn.ghost', labelEn: 'Secondary button' },
  buttonWhatsapp: { selector: '.btn.wa', labelEn: 'WhatsApp button' },
  cards: { selector: '.seg, .cms-card, .cms-feature', labelEn: 'Cards' },
  header: { selector: 'header.top', labelEn: 'Header' },
  headerLinks: { selector: 'header.top nav.main a, header.top .navDropTrigger', labelEn: 'Header menu links' },
  footer: { selector: 'footer', labelEn: 'Footer' },
  footerLinks: { selector: 'footer a:not(.btn)', labelEn: 'Footer links' },
  forms: { selector: 'input, select, textarea', labelEn: 'Form fields' },
  container: { selector: '.wrap', labelEn: 'Page container' },
  sections: { selector: 'section.band', labelEn: 'Sections' },
};

/** CSS properties the editor may set (camelCase). Anything else is ignored everywhere. */
export const STYLE_PROPS = [
  'color', 'fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing', 'textAlign', 'textDecoration', 'textTransform', 'whiteSpace',
  'width', 'maxWidth', 'minWidth', 'height', 'maxHeight', 'minHeight',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignSelf', 'gap', 'rowGap', 'columnGap', 'gridTemplateColumns', 'order', 'flexGrow',
  'position', 'top', 'right', 'bottom', 'left', 'zIndex', 'overflow',
  'backgroundColor', 'backgroundImage', 'backgroundSize', 'backgroundPosition', 'backgroundRepeat',
  'borderWidth', 'borderStyle', 'borderColor', 'borderRadius', 'borderTopWidth', 'borderBottomWidth',
  'boxShadow', 'opacity', 'transform', 'transition', 'objectFit', 'objectPosition', 'aspectRatio', 'filter',
] as const;
const STYLE_SET = new Set<string>(STYLE_PROPS);

/** Properties that are per device (sizes, spacing, layout); the rest apply everywhere. */
export const RESPONSIVE_PROPS = new Set<string>([
  'fontSize', 'lineHeight', 'letterSpacing', 'textAlign', 'whiteSpace',
  'width', 'maxWidth', 'minWidth', 'height', 'maxHeight', 'minHeight',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
  'display', 'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignSelf', 'gap', 'rowGap', 'columnGap', 'gridTemplateColumns', 'order', 'flexGrow',
  'position', 'top', 'right', 'bottom', 'left', 'objectPosition', 'aspectRatio', 'backgroundPosition', 'backgroundSize',
]);

const kebab = (p: string) => p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/** A safe CSS value: no rule/declaration break-outs, no scripts, urls only https or site paths. */
export function safeCssValue(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s || s.length > 600) return null;
  if (/[;{}<>\\]|\/\*|expression\s*\(|javascript:|@import/i.test(s)) return null;
  const urls = [...s.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi)];
  for (const m of urls) {
    const u = m[2];
    if (!(/^https:\/\//i.test(u) || (/^\/(?!\/)/.test(u)) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(u))) return null;
  }
  if (/url\(/i.test(s) && !urls.length) return null;
  return s;
}

const TOKEN_NAME = /^--[a-z0-9-]{1,60}$/i;
const ID_OK = /^[A-Za-z0-9_./:@~*-]{1,400}$/;
const ROUTE_OK = /^(\*|\/[a-z0-9\-/]*)$/;

function decls(map: StyleMap | undefined): string {
  if (!map) return '';
  const out: string[] = [];
  for (const [k, v] of Object.entries(map)) {
    if (!STYLE_SET.has(k)) continue;
    const val = safeCssValue(v);
    if (val !== null) out.push(`${kebab(k)}:${val} !important`);
  }
  return out.join(';');
}

/** CSS selector(s) for an element id ('X.3@*' = every instance of that list item). */
export function elSelector(id: string): string {
  const m = id.match(/^(.*?)@\*(.*)$/);
  if (!m) return `[data-ed="${id}"]`;
  const [, prefix, suffix] = m;
  const end = suffix ? `[data-ed$="${suffix}"]` : '';
  return `[data-ed^="${prefix}@"]${end},[data-ed^="${prefix}~"]${end}`;
}

const scoped = (route: string, sel: string) =>
  route === '*'
    ? sel
    : sel
        .split(',')
        .map((s) => `body[data-route="${route}"] ${s}`)
        .join(',');

/** Strips anything that could close the <style> element or import remote CSS. */
export function safeCustomCss(css: unknown): string {
  if (typeof css !== 'string') return '';
  if (/<\/?style|<script|@import|javascript:|expression\s*\(/i.test(css)) return '';
  return css.slice(0, 100_000);
}

function ruleBlock(selector: string, b: StyleBuckets | undefined, extraHidden?: Partial<Record<Device, boolean>>): string {
  if (!b && !extraHidden) return '';
  let out = '';
  const all = decls(b?.all);
  if (all) out += `${selector}{${all}}`;
  const hover = decls(b?.hover);
  if (hover)
    out += `${selector
      .split(',')
      .map((s) => `${s}:hover`)
      .join(',')}{${hover}}`;
  for (const d of ['desktop', 'tablet', 'mobile'] as Device[]) {
    let body = decls(b?.[d]);
    if (extraHidden?.[d]) body = body ? `${body};display:none !important` : 'display:none !important';
    if (body) out += `@media ${MEDIA[d]}{${selector}{${body}}}`;
  }
  return out;
}

/** The whole stylesheet for a configuration (design tokens, global rules, element overrides, custom CSS). */
export function buildVisualCss(config: VisualConfig | null | undefined): string {
  if (!config) return '';
  let css = '';
  // Light theme tokens ('--x') and dark theme tokens ('dark:--x'); the selectors outrank the
  // site's own `:root` / `:root[data-theme='dark']` declarations wherever the stylesheet loads.
  const tok = (dark: boolean) =>
    Object.entries(config.tokens || {})
      .filter(([k]) => (dark ? k.startsWith('dark:') : !k.startsWith('dark:')))
      .map(([k, v]) => [dark ? k.slice(5) : k, safeCssValue(v)] as const)
      .filter(([k, v]) => TOKEN_NAME.test(k) && v !== null)
      .map(([k, v]) => `${k}:${v}`);
  const light = tok(false);
  const dark = tok(true);
  if (light.length) css += `html:root:not([data-theme='dark']){${light.join(';')}}`;
  if (dark.length) css += `html:root[data-theme='dark']{${dark.join(';')}}`;
  for (const [key, b] of Object.entries(config.rules || {})) {
    const t = GLOBAL_TARGETS[key];
    if (t) css += ruleBlock(t.selector, b);
  }
  // global ('*') first so page-specific rules (higher specificity) win
  const routes = Object.entries(config.routes || {}).sort(([a], [b]) => (a === '*' ? -1 : b === '*' ? 1 : 0));
  for (const [route, rc] of routes) {
    if (!ROUTE_OK.test(route)) continue;
    for (const [id, ov] of Object.entries(rc.el || {})) {
      if (!ID_OK.test(id) || !ov) continue;
      const sel = scoped(route, elSelector(id));
      css += ruleBlock(sel, ov.styles, ov.hidden);
      if (ov.attrs?.mobileSrc && safeCssValue(`url("${ov.attrs.mobileSrc}")`)) css += `@media ${MEDIA.mobile}{${sel}{content:url("${ov.attrs.mobileSrc}") !important}}`;
      if (ov.order?.length) {
        if (ov.flexify) css += `${sel}{display:flex !important;flex-direction:column !important}`;
        ov.order.forEach((child, i) => {
          if (ID_OK.test(child)) css += `${scoped(route, `[data-ed="${id}"] > [data-ed="${child}"]`)}{order:${i + 1} !important}`;
        });
      }
    }
  }
  const custom = safeCustomCss(config.css);
  if (custom) css += `\n${custom}`;
  for (const [route, rc] of routes) {
    if (route === '*' || !ROUTE_OK.test(route)) continue;
    const pc = safeCustomCss(rc.css);
    if (pc) css += `\nbody[data-route="${route}"]{${pc}}`;
  }
  return css;
}

/** '/en/about' or '' -> '/about' / '/' (the route key overrides are stored under). */
export const routeKey = (path: string) => {
  const p = path.replace(/^\/(en|ar)(?=\/|$)/, '').replace(/\/+$/, '');
  return p || '/';
};

/** Validates a configuration coming from the feed or the preview API; drops anything malformed. */
export function cleanVisual(raw: unknown): VisualConfig {
  if (!raw || typeof raw !== 'object') return EMPTY_VISUAL;
  const r = raw as Partial<VisualConfig>;
  const obj = <T,>(v: unknown, d: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : d);
  const routes: Record<string, RouteConfig> = {};
  for (const [k, v] of Object.entries(obj(r.routes, {} as Record<string, RouteConfig>))) {
    if (!ROUTE_OK.test(k) || !v) continue;
    const el: Record<string, ElOverride> = {};
    for (const [id, ov] of Object.entries(obj(v.el, {} as Record<string, ElOverride>))) if (ID_OK.test(id) && ov && typeof ov === 'object') el[id] = ov;
    routes[k] = { el, css: typeof v.css === 'string' ? v.css : '' };
  }
  const nodes: Record<string, VNode> = {};
  for (const [id, n] of Object.entries(obj(r.nodes, {} as Record<string, VNode>))) if (/^[a-z0-9]{4,24}$/i.test(id) && n && typeof n === 'object' && typeof n.type === 'string') nodes[id] = { type: n.type, props: obj(n.props, {}), children: Array.isArray(n.children) ? n.children.filter((c) => typeof c === 'string') : undefined };
  return { v: 1, tokens: obj(r.tokens, {}), rules: obj(r.rules, {}), css: typeof r.css === 'string' ? r.css : '', routes, nodes };
}
