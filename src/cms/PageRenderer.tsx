import type { CSSProperties } from 'react';
import type { CmsPage, CmsSection } from '../content/cms';
import type { Lang } from '../content/seoHead';
import { SECTION_COMPONENTS } from './sections';
import './cms.css';

/**
 * Renders a CMS ("managed") page from its sections, in order, through the section registry
 * (sections.tsx). Each section is wrapped with its presentation settings: device visibility,
 * background, spacing, alignment, width and an optional #anchor. The page always has exactly one
 * <h1>: the first section renders it; when that section has no heading of its own (e.g. a gallery),
 * a page-title header is rendered first instead.
 */

const HEADING_FIRST = new Set(['hero', 'imageText', 'text', 'cta', 'about', 'contact']);

function sectionHasOwnHeading(s: CmsSection, lang: Lang) {
  const c = s.content || {};
  const h = (lang === 'ar' ? c.headingAr || c.headingEn : c.headingEn || c.headingAr) as string | undefined;
  return typeof h === 'string' && h.trim().length > 0;
}

export function SectionShell({ section, lang, isFirst }: { section: CmsSection; lang: Lang; isFirst: boolean }) {
  const Component = SECTION_COMPONENTS[section.type];
  if (!Component) return null;
  const s = section.settings;
  const bg = s.background;
  const classes = ['cms-section', `t-${section.type}`, `pt-${s.spacing.top}`, `pb-${s.spacing.bottom}`, `al-${s.align}`, `ct-${s.container}`, `bg-${bg.type}`];
  if (!s.devices.desktop) classes.push('hide-desktop');
  if (!s.devices.tablet) classes.push('hide-tablet');
  if (!s.devices.mobile) classes.push('hide-mobile');
  const onDark = bg.type === 'dark' || bg.type === 'brand' || bg.type === 'image';
  if (onDark) classes.push('on-dark');
  const style: CSSProperties = {};
  if (bg.type === 'color' && bg.color) style.background = bg.color;
  return (
    <section className={classes.join(' ')} id={s.anchorId || undefined} style={style} data-cms-section={section.type}>
      {bg.type === 'image' && bg.image && (
        <>
          <img className="cms-bg-img" src={bg.image.url} alt="" aria-hidden="true" loading={isFirst ? 'eager' : 'lazy'} />
          <div className="cms-bg-shade" style={{ opacity: Math.max(bg.overlay, 30) / 100 }} />
        </>
      )}
      <div className="cms-section-inner">
        <Component content={section.content} lang={lang} isFirst={isFirst} onDark={onDark} />
      </div>
    </section>
  );
}

export function PageRenderer({ page, lang }: { page: CmsPage; lang: Lang }) {
  const sections = page.sections.filter((s) => SECTION_COMPONENTS[s.type]);
  const first = sections[0];
  const firstRendersH1 = !!first && HEADING_FIRST.has(first.type) && sectionHasOwnHeading(first, lang);
  const title = (lang === 'ar' ? page.titleAr || page.titleEn : page.titleEn || page.titleAr) || page.seo[lang]?.title || '';
  return (
    <div className={`cms-page layout-${page.layout}`} data-cms-page={page.slug}>
      {!firstRendersH1 && (
        <header className="page-hero">
          <div className="wrap">
            <h1>{title}</h1>
          </div>
        </header>
      )}
      {sections.map((s, i) => (
        <SectionShell key={i} section={s} lang={lang} isFirst={i === 0 && firstRendersH1} />
      ))}
      {sections.length === 0 && (
        <div className="wrap cms-empty">
          <p>{lang === 'ar' ? 'لا يوجد محتوى في هذه الصفحة بعد.' : 'This page has no content yet.'}</p>
        </div>
      )}
    </div>
  );
}
