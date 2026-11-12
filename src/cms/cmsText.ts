import type { Lang } from '../content/seoHead';

/**
 * Bilingual field access for CMS section content. Every text field has an English key (`headingEn`)
 * and an Arabic twin (`headingAr`). The current language wins; the other is the fallback so a
 * section filled in one language still renders something meaningful in the other.
 */
export function pick(content: Record<string, unknown> | undefined, base: string, lang: Lang): string {
  if (!content) return '';
  const own = content[`${base}${lang === 'ar' ? 'Ar' : 'En'}`];
  const other = content[`${base}${lang === 'ar' ? 'En' : 'Ar'}`];
  if (typeof own === 'string' && own.trim()) return own;
  return typeof other === 'string' ? other : '';
}

export const str = (v: unknown) => (typeof v === 'string' ? v : '');
export const num = (v: unknown, def: number) => (typeof v === 'number' && Number.isFinite(v) ? v : def);
export const list = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object') : []);

export interface CmsImage {
  url: string;
  altEn?: string;
  altAr?: string;
  width?: number;
  height?: number;
}
export function image(v: unknown): CmsImage | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  return typeof o.url === 'string' && o.url ? { url: o.url, altEn: str(o.altEn), altAr: str(o.altAr), width: typeof o.width === 'number' ? o.width : undefined, height: typeof o.height === 'number' ? o.height : undefined } : null;
}
export const alt = (img: CmsImage | null, lang: Lang, fallback = '') => (img ? (lang === 'ar' ? img.altAr || img.altEn : img.altEn || img.altAr) || fallback : fallback);

/** A video field: a URL string or { url }. Returns an embeddable description. */
export function video(v: unknown): { kind: 'youtube' | 'vimeo' | 'file'; src: string } | null {
  const url = typeof v === 'string' ? v : v && typeof v === 'object' ? str((v as Record<string, unknown>).url) : '';
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = u.searchParams.get('v') || (u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : u.pathname.startsWith('/shorts/') ? u.pathname.split('/')[2] : '');
      return id && /^[\w-]{6,20}$/.test(id) ? { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      return /^[\w-]{6,20}$/.test(id) ? { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop() || '';
      return /^\d{4,15}$/.test(id) ? { kind: 'vimeo', src: `https://player.vimeo.com/video/${id}` } : null;
    }
    if (u.protocol === 'https:' || ((u.hostname === 'localhost' || u.hostname === '127.0.0.1') && u.protocol === 'http:')) return { kind: 'file', src: url };
  } catch {
    return null;
  }
  return null;
}

/** Splits multi-line text into paragraphs (CMS text is always plain text, never HTML). */
export const paragraphs = (text: string) =>
  text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
