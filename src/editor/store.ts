import { cmsFeed } from '../content/cmsFeed';
import { cleanVisual, EMPTY_VISUAL, type ElOverride, type Lang, type VisualConfig } from './visual';

/**
 * The visual configuration the page is rendered with: the PUBLISHED one from the build's CMS feed,
 * or - in the dashboard's editor / signed draft preview only - the draft loaded at runtime
 * (src/editor/boot.ts). Read synchronously by the JSX runtime (src/editor/jsx-runtime.ts) while
 * the real components render, on the server (prerender) and in the browser alike.
 */
let config: VisualConfig = cleanVisual((cmsFeed as unknown as { visual?: unknown }).visual) ?? EMPTY_VISUAL;
let route = '/';
let lang: Lang = 'ar';
let contentVersion = 0;
let styleVersion = 0;
const listeners = new Set<() => void>();

interface Wild {
  prefix: string;
  suffix: string;
  ov: ElOverride;
}
let wild: Record<string, Wild[]> = {};
let hasContent = false;

function index() {
  wild = {};
  hasContent = false;
  for (const [r, rc] of Object.entries(config.routes)) {
    for (const [id, ov] of Object.entries(rc.el)) {
      if (ov.text || ov.attrs || ov.deleted || ov.insert?.length) hasContent = true;
      const m = id.match(/^(.*?)@\*(.*)$/);
      if (m) (wild[r] ||= []).push({ prefix: m[1], suffix: m[2], ov });
    }
  }
}
index();

/** What a page depends on structurally (not styles): a change here re-renders the page. */
export function contentSignature(c: VisualConfig): string {
  const parts: unknown[] = [c.nodes];
  for (const [r, rc] of Object.entries(c.routes)) for (const [id, ov] of Object.entries(rc.el)) if (ov.text || ov.attrs || ov.deleted || ov.insert) parts.push([r, id, ov.text, ov.attrs?.src, ov.attrs?.alt, ov.attrs?.href, ov.attrs?.target, ov.deleted, ov.insert]);
  return JSON.stringify(parts);
}

export const visualStore = {
  get config() {
    return config;
  },
  get lang() {
    return lang;
  },
  get route() {
    return route;
  },
  get hasContent() {
    return hasContent;
  },
  set(next: VisualConfig) {
    const contentChanged = contentSignature(next) !== contentSignature(config);
    config = next;
    index();
    styleVersion++;
    if (contentChanged) contentVersion++;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  contentVersion: () => contentVersion,
  styleVersion: () => styleVersion,
};

/** Set by the layout while it renders, before any page element is created. */
export function setRenderContext(nextRoute: string, nextLang: Lang) {
  route = nextRoute;
  lang = nextLang;
}

function matchWild(r: string, id: string): ElOverride | undefined {
  for (const w of wild[r] || []) {
    if (!id.startsWith(w.prefix) || !id.endsWith(w.suffix)) continue;
    const mid = id.slice(w.prefix.length, id.length - w.suffix.length);
    if (/^[@~][^/]*$/.test(mid)) return w.ov;
  }
  return undefined;
}

/** The content override for an element on the current page: page-specific beats site-wide, exact beats "all items". */
export function contentOverride(id: string): ElOverride | undefined {
  const layers = [config.routes['*']?.el[id], matchWild('*', id), config.routes[route]?.el[id], matchWild(route, id)].filter(Boolean) as ElOverride[];
  if (!layers.length) return undefined;
  const out: ElOverride = {};
  for (const l of layers.reverse()) {
    // reversed: most specific first; keep the first value found for each field
    if (out.text === undefined && l.text) out.text = l.text;
    if (out.deleted === undefined && l.deleted !== undefined) out.deleted = l.deleted;
    if (l.attrs) out.attrs = { ...l.attrs, ...(out.attrs || {}) };
    if (l.insert?.length) out.insert = [...(l.insert || []), ...(out.insert || [])];
  }
  return out;
}
