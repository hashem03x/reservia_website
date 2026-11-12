import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { instrument } from '../../editor-plugin/editorIds';
import { buildVisualCss, cleanVisual, elSelector, routeKey, safeCssValue, type VisualConfig } from './visual';
import { visualStore, setRenderContext, contentOverride } from './store';
import { jsx, jsxs } from './jsx-runtime';

// Visual editor: element identity (build time), the stylesheet generated from a configuration,
// and the content overrides applied while the real components render.

describe('editor ids (build-time instrumentation)', () => {
  const src = `
import { Card } from './Card';
import { Link } from 'react-router-dom';
export default function Home({ items }) {
  return (
    <>
      <section className="hero"><h1>{t.title}</h1><Link to="/x">Go</Link></section>
      <ul>{items.map((it) => <li key={it.id}><Card title={it.t} /></li>)}</ul>
      <svg><path d="M0" /></svg>
    </>
  );
}
export function Card({ title }) {
  return <div className="card"><h3>{title}</h3></div>;
}`;
  const out = instrument(src, '/repo/src/pages/Home.tsx') as string;

  it('gives DOM elements an id prefixed with the rendering component chain', () => {
    expect(out).toContain('<section data-ed={(__edo ? __edo + "/" : "") + "Home.1"}');
    expect(out).toContain('<h1 data-ed={(__edo ? __edo + "/" : "") + "Home.2"}');
    expect(out).toContain('<Link data-ed={(__edo ? __edo + "/" : "") + "Home.3"}');
    expect(out).toContain('function Home({ items, __edk: __edo = "" })');
  });

  it('list items get the map index (added when the callback has none)', () => {
    expect(out).toContain('items.map((it, __edi0) =>');
    expect(out).toContain('"Home.5" + "@" + __edi0');
    expect(out).toContain('<Card __edk={(__edo ? __edo + "/" : "") + "Home.6" + "@" + __edi0}');
  });

  it('svg internals and head tags are not instrumented; the svg itself is', () => {
    expect(out).toContain('<svg data-ed=');
    expect(out).not.toMatch(/<path data-ed/);
  });

  it('components read their owner prefix from __edk', () => {
    expect(out).toContain('export function Card({ title, __edk: __edo = "" })');
  });
});

describe('visual stylesheet', () => {
  const config: VisualConfig = cleanVisual({
    v: 1,
    tokens: { '--sun': '#ff6600', 'dark:--sun': '#663300', '--bad': 'red;}body{display:none' },
    rules: { h1: { all: { color: '#111111' } } },
    css: '.promo{color:red}',
    routes: {
      '*': { el: { 'LangLayout.8/Header.5': { styles: { all: { backgroundColor: '#000000' } } } } },
      '/': {
        el: {
          'Home.9': { styles: { desktop: { fontSize: '64px' }, mobile: { fontSize: '30px' }, hover: { color: '#ff0000' } }, hidden: { tablet: true } },
          'Home.6@*': { styles: { all: { borderRadius: '12px' } } },
          'LangLayout.4': { order: ['Home.20', 'Home.2'], flexify: true },
        },
        css: 'h2{color:blue}',
      },
    },
    nodes: {},
  });
  const css = buildVisualCss(config);

  it('tokens per theme, unsafe values dropped', () => {
    expect(css).toContain("html:root:not([data-theme='dark']){--sun:#ff6600}");
    expect(css).toContain("html:root[data-theme='dark']{--sun:#663300}");
    expect(css).not.toContain('--bad');
  });

  it('element styles are scoped to their page and device, with hover', () => {
    expect(css).toContain('@media (min-width: 1024px){body[data-route="/"] [data-ed="Home.9"]{font-size:64px !important}}');
    expect(css).toContain('@media (max-width: 639px){body[data-route="/"] [data-ed="Home.9"]{font-size:30px !important}}');
    expect(css).toContain('body[data-route="/"] [data-ed="Home.9"]:hover{color:#ff0000 !important}');
    expect(css).toContain('@media (min-width: 640px) and (max-width: 1023px){body[data-route="/"] [data-ed="Home.9"]{display:none !important}}');
    expect(css).toContain('[data-ed="LangLayout.8/Header.5"]{background-color:#000000 !important}');
  });

  it('"all similar items" and reordering', () => {
    expect(elSelector('Home.6@*')).toBe('[data-ed^="Home.6@"],[data-ed^="Home.6~"]');
    expect(elSelector('Home.5@*/Card.1')).toBe('[data-ed^="Home.5@"][data-ed$="/Card.1"],[data-ed^="Home.5~"][data-ed$="/Card.1"]');
    expect(css).toContain('body[data-route="/"] [data-ed="LangLayout.4"]{display:flex !important;flex-direction:column !important}');
    expect(css).toContain('body[data-route="/"] [data-ed="LangLayout.4"] > [data-ed="Home.20"]{order:1 !important}');
  });

  it('global component rules and custom CSS (page CSS nested under its route)', () => {
    expect(css).toContain('h1{color:#111111 !important}');
    expect(css).toContain('.promo{color:red}');
    expect(css).toContain('body[data-route="/"]{h2{color:blue}}');
  });

  it('values cannot break out of a declaration or load scripts', () => {
    expect(safeCssValue('red; } body {')).toBeNull();
    expect(safeCssValue('url(javascript:alert(1))')).toBeNull();
    expect(safeCssValue('url("https://res.cloudinary.com/x.jpg")')).toBe('url("https://res.cloudinary.com/x.jpg")');
    expect(safeCssValue('expression(alert(1))')).toBeNull();
    expect(routeKey('/en/about')).toBe('/about');
    expect(routeKey('/ar')).toBe('/');
  });
});

describe('content overrides at render time', () => {
  it('replaces text per language, image source, link target, removes deleted elements and adds new ones', () => {
    visualStore.set(
      cleanVisual({
        v: 1,
        tokens: {},
        rules: {},
        css: '',
        nodes: { abcd1234: { type: 'button', props: { label: { en: 'Call us', ar: 'اتصل بنا' }, href: '/contact', style: 'primary' } } },
        routes: {
          '/': {
            el: {
              'Home.2': { text: { en: 'New heading', ar: 'عنوان جديد' } },
              'Home.3': { attrs: { src: 'https://res.cloudinary.com/demo/new.jpg', alt: { en: 'Solar farm' } } },
              'Home.4': { deleted: true },
              'Home.1': { insert: ['abcd1234'] },
              'Home.7@*': { text: { en: 'Every card' } },
            },
          },
        },
      }),
    );
    setRenderContext('/', 'en');
    const el = jsxs('section', { 'data-ed': 'Home.1', children: [jsx('h1', { 'data-ed': 'Home.2', children: 'Old heading' }), jsx('img', { 'data-ed': 'Home.3', src: '/old.jpg', srcSet: '/old-2x.jpg 2x', alt: 'x' }), jsx('p', { 'data-ed': 'Home.4', children: 'gone' }), jsx('h3', { 'data-ed': 'Home.7@2', children: 'card' })] });
    // a router is needed for the added internal-link button
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, el as never));
    expect(html).toMatch(/<a [^>]*data-ed="ins:abcd1234"[^>]*href="\/en\/contact"[^>]*>Call us<\/a>/);
    expect(html).toContain('<h1 data-ed="Home.2">New heading</h1>');
    expect(html).toContain('src="https://res.cloudinary.com/demo/new.jpg"');
    expect(html).not.toContain('srcSet');
    expect(html).toContain('alt="Solar farm"');
    expect(html).not.toContain('gone');
    expect(html).toContain('<h3 data-ed="Home.7@2">Every card</h3>');
    setRenderContext('/', 'ar');
    expect(contentOverride('Home.2')?.text?.ar).toBe('عنوان جديد');
    setRenderContext('/about', 'en');
    expect(contentOverride('Home.2')).toBeUndefined();
  });

  it('a React key completes the id of list items without a map index; __edk never reaches the DOM', () => {
    visualStore.set(cleanVisual({ v: 1, tokens: {}, rules: {}, css: '', routes: {}, nodes: {} }));
    const html = renderToStaticMarkup(jsx('a', { 'data-ed': 'Header.2', __edk: 'leak', href: '/en/about', children: 'About' }, '/en/about') as never);
    expect(html).toContain('data-ed="Header.2~_about"');
    expect(html).not.toContain('__edk');
  });
});
