import { createElement, Fragment, type ReactNode } from 'react';
import { contentOverride, visualStore } from './store';
import { renderNode } from './nodes';

/**
 * The visual editor's hook into React's JSX runtime (jsx-runtime.ts / jsx-dev-runtime.ts wrap
 * React's own functions with this). For each element the site's components create:
 *   1. instance identity: a list item's React `key` completes its editor id when the build-time
 *      map index is not available (e.g. items rendered through a helper function);
 *   2. content overrides saved in the visual editor: text (per language), image source/alt,
 *      link destination/target, removal, and newly added elements appended inside it.
 * Styles are not applied here - they are a stylesheet (visual.ts#buildVisualCss).
 * Elements without an editor id, and every element when nothing was edited, pass straight through.
 */
type Props = Record<string, unknown> | null | undefined;
type Real = (type: unknown, props: Props, key?: unknown, ...rest: unknown[]) => unknown;

const keyPart = (key: unknown) =>
  String(key)
    .replace(/^\/(en|ar)(?=\/|$)/, '')
    .replace(/[^A-Za-z0-9_-]/g, '_')
    .slice(0, 40) || '_';

function textChildren(text: string): ReactNode {
  const lines = text.split('\n');
  if (lines.length === 1) return text;
  return lines.flatMap((l, i) => (i ? [createElement('br', { key: `br${i}` }), l] : [l]));
}

export function applyEditor(real: Real, realMany: Real, type: unknown, props: Props, key: unknown, rest: unknown[]): unknown {
  if (!props) return real(type, props, key, ...rest);
  let p = props;
  const dom = typeof type === 'string';
  if (dom && '__edk' in p) {
    p = { ...p };
    delete p.__edk;
  }
  if (key !== undefined && key !== null) {
    const ed = p['data-ed'];
    if (typeof ed === 'string' && !ed.includes('@')) p = { ...p, 'data-ed': `${ed}~${keyPart(key)}` };
    else if (!dom && typeof p.__edk === 'string' && !(p.__edk as string).includes('@')) p = { ...p, __edk: `${p.__edk}~${keyPart(key)}` };
  }
  const id = p['data-ed'];
  if (typeof id !== 'string' || !visualStore.hasContent) return real(type, p, key, ...rest);
  const ov = contentOverride(id);
  if (!ov) return real(type, p, key, ...rest);
  if (ov.deleted) return null;

  const lang = visualStore.lang;
  const next: Record<string, unknown> = { ...p };
  const text = ov.text?.[lang];
  if (typeof text === 'string') next.children = textChildren(text);
  const a = ov.attrs;
  if (a) {
    if (a.src && (type === 'img' || type === 'video' || type === 'source')) {
      next.src = a.src;
      delete next.srcSet;
      delete next.sizes;
    }
    const alt = a.alt?.[lang];
    if (typeof alt === 'string' && type === 'img') next.alt = alt;
    if (a.href) {
      if (type === 'a') next.href = a.href;
      else if ('to' in next) next.to = a.href.startsWith('/') && !/^\/(en|ar)(\/|$)/.test(a.href) ? `/${lang}${a.href === '/' ? '' : a.href}` : a.href;
    }
    if (a.target) {
      next.target = a.target === '_blank' ? '_blank' : undefined;
      if (a.target === '_blank') next.rel = 'noopener noreferrer';
    }
  }
  if (ov.insert?.length) {
    const own = next.children;
    const list = Array.isArray(own) ? own : own === undefined || own === null ? [] : [own];
    next.children = [...list, ...ov.insert.map((nid) => renderNode(nid))];
    return realMany(type, next, key, ...rest);
  }
  return real(type, next, key, ...rest);
}

export { Fragment };
