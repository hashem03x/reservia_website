import { createElement, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { visualStore } from './store';
import type { Lang, VNode } from './visual';

/**
 * Elements ADDED in the visual editor (headings, text, images, buttons, containers, columns,
 * grids, cards, lists, FAQ, video, icons, spacers, dividers, custom HTML). They are rendered with
 * the site's own classes (btn, eyebrow, lead, ...) plus a small `ve-*` stylesheet (editor.css),
 * inside the real page, server-side and in the browser, and carry `data-ed="ins:<id>"` so they are
 * selectable and styleable exactly like the existing elements.
 */
const loc = (v: unknown, lang: Lang): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const own = o[lang];
    const other = o[lang === 'ar' ? 'en' : 'ar'];
    return typeof own === 'string' && own ? own : typeof other === 'string' ? other : '';
  }
  return '';
};

const SAFE_HREF = /^(https?:\/\/[^\s<>"']+|mailto:[^\s<>"']+|tel:[+0-9 ()-]+|\/[^\s<>"']*|#[A-Za-z0-9_-]*)$/i;
const SAFE_SRC = /^(https:\/\/[^\s<>"']+|\/(?!\/)[^\s<>"']*|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[^\s<>"']*)$/i;

const ICONS: Record<string, string> = {
  sun: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7l1-8z',
  leaf: 'M5 21c8 0 14-6 14-16-6 0-14 2-14 10 0 2 1 4 2 5m0 0c2-4 5-7 9-9',
  check: 'm5 12 5 5L20 7',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  mail: 'M4 6h16v12H4zM4 6l8 7 8-7',
  star: 'm12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.7l6.2-.9z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  water: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  factory: 'M3 21V10l6 4V10l6 4V6h6v15z',
};

function videoEmbed(url: string): { kind: 'iframe' | 'file'; src: string } | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtube.com' || host === 'youtu.be') {
      const id = host === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v') || u.pathname.split('/').pop() || '';
      return /^[\w-]{6,20}$/.test(id) ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop() || '';
      return /^\d{4,15}$/.test(id) ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}` } : null;
    }
    return SAFE_SRC.test(url) ? { kind: 'file', src: url } : null;
  } catch {
    return null;
  }
}

export function renderNode(id: string, depth = 0): ReactNode {
  const node: VNode | undefined = visualStore.config.nodes[id];
  if (!node || depth > 8) return null;
  const lang = visualStore.lang;
  const p = node.props || {};
  const edId = `ins:${id}`;
  const base = { key: edId, 'data-ed': edId, className: `ve-node ve-${node.type}` };
  const kids = () => (node.children || []).map((c) => renderNode(c, depth + 1));
  switch (node.type) {
    case 'heading': {
      const level = Math.min(6, Math.max(2, Number(p.level) || 2));
      return createElement(`h${level}`, base, loc(p.text, lang));
    }
    case 'text':
      return createElement('p', base, loc(p.text, lang));
    case 'image': {
      const src = typeof p.src === 'string' && SAFE_SRC.test(p.src) ? p.src : '';
      return src ? createElement('img', { ...base, src, alt: loc(p.alt, lang), loading: 'lazy', decoding: 'async' }) : createElement('div', { ...base, className: `${base.className} ve-empty` });
    }
    case 'video': {
      const v = typeof p.url === 'string' ? videoEmbed(p.url) : null;
      if (!v) return createElement('div', { ...base, className: `${base.className} ve-empty` });
      return createElement(
        'div',
        base,
        v.kind === 'file'
          ? createElement('video', { src: v.src, controls: true, playsInline: true, preload: 'metadata' })
          : createElement('iframe', { src: v.src, title: loc(p.title, lang) || 'Video', loading: 'lazy', allowFullScreen: true, allow: 'encrypted-media; picture-in-picture' }),
      );
    }
    case 'button': {
      const href = typeof p.href === 'string' && SAFE_HREF.test(p.href) ? p.href : '';
      const style = p.style === 'secondary' ? 'ghost' : p.style === 'whatsapp' ? 'wa' : 'sun';
      const props = { ...base, className: `${base.className} btn ${style}` };
      const label = loc(p.label, lang);
      if (href.startsWith('/') && !href.startsWith('//')) {
        const to = /^\/(en|ar)(\/|$)/.test(href) ? href : `/${lang}${href === '/' ? '' : href}`;
        return createElement(Link, { ...props, to, target: p.target === '_blank' ? '_blank' : undefined }, label);
      }
      return createElement('a', { ...props, href: href || '#', target: p.target === '_blank' ? '_blank' : undefined, rel: p.target === '_blank' ? 'noopener noreferrer' : undefined }, label);
    }
    case 'icon': {
      const d = ICONS[String(p.name)] || ICONS.star;
      return createElement('svg', { ...base, viewBox: '0 0 24 24', width: 40, height: 40, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, createElement('path', { d }));
    }
    case 'box': {
      const variant = ['container', 'columns', 'grid', 'card', 'cta', 'stack', 'section'].includes(String(p.variant)) ? String(p.variant) : 'stack';
      const cols = Math.min(6, Math.max(1, Number(p.columns) || (variant === 'columns' ? 2 : 3)));
      const tag = variant === 'section' ? 'section' : 'div';
      return createElement(tag, { ...base, className: `${base.className} ve-box-${variant}`, style: { ['--ve-cols' as string]: String(cols) } }, ...kids());
    }
    case 'spacer':
      return createElement('div', { ...base, 'aria-hidden': true, style: { height: typeof p.height === 'string' ? p.height : '40px' } });
    case 'divider':
      return createElement('hr', base);
    case 'list': {
      const items = Array.isArray(p.items) ? p.items : [];
      return createElement('ul', base, ...items.map((it, i) => createElement('li', { key: i }, loc(it, lang))));
    }
    case 'faq': {
      const items = Array.isArray(p.items) ? (p.items as Array<Record<string, unknown>>) : [];
      return createElement(
        'div',
        base,
        ...items.map((it, i) => createElement('details', { key: i }, createElement('summary', null, loc(it.q, lang)), createElement('p', null, loc(it.a, lang)))),
      );
    }
    case 'html':
      // Administrator-only (backend: code.manage); scripts inside never run (innerHTML).
      return createElement('div', { ...base, dangerouslySetInnerHTML: { __html: typeof p.html === 'string' ? p.html : '' } });
    default:
      return null;
  }
}
