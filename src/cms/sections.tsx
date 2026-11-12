import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Lang } from '../content/seoHead';
import { env } from '../config/env';
import { cmsFeed } from '../content/cmsFeed';
import { LeadForm } from '../components/forms/LeadForm';
import { useLanguage } from '../i18n/LanguageContext';
import { alt, image, list, num, paragraphs, pick, str, video } from './cmsText';
import { CmsButton, CmsLink } from './CmsLink';

/**
 * The website's renderer for every CMS section type (backend utils/website/sectionTypes.js).
 * One component per type, each in the site's own visual language (reservia.css classes + cms.css).
 * All CMS text is rendered as React text - never as HTML - except the administrator-only
 * Custom HTML section.
 */

export interface SectionProps {
  content: Record<string, unknown>;
  lang: Lang;
  /** The first visible section of the page renders the page's <h1>. */
  isFirst: boolean;
  /** Dark or image background: text switches to the light-on-dark palette. */
  onDark: boolean;
}

function Heading({ content, lang, isFirst, center, as }: { content: Record<string, unknown>; lang: Lang; isFirst: boolean; center?: boolean; as?: 'h1' | 'h2' }) {
  const eyebrow = pick(content, 'eyebrow', lang);
  const heading = pick(content, 'heading', lang);
  const description = pick(content, 'description', lang);
  if (!eyebrow && !heading && !description) return null;
  const H = as ?? (isFirst ? 'h1' : 'h2');
  return (
    <header className={center ? 'cms-head center' : 'cms-head'}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {heading && <H>{heading}</H>}
      {description && <Paras text={description} className="lead" />}
    </header>
  );
}

function Paras({ text, className }: { text: string; className?: string }) {
  const ps = paragraphs(text);
  return (
    <>
      {ps.map((p, i) => (
        <p key={i} className={className}>
          {p}
        </p>
      ))}
    </>
  );
}

function Img({ value, lang, className, eager, sizes }: { value: unknown; lang: Lang; className?: string; eager?: boolean; sizes?: string }) {
  const img = image(value);
  if (!img) return null;
  return <img className={className} src={img.url} alt={alt(img, lang)} width={img.width} height={img.height} loading={eager ? 'eager' : 'lazy'} decoding="async" sizes={sizes} />;
}

function Buttons({ content, lang, prefixes = ['cta', 'cta2'] }: { content: Record<string, unknown>; lang: Lang; prefixes?: string[] }) {
  const buttons = prefixes.map((p) => ({ label: pick(content, `${p}Label`, lang), href: str(content[`${p}Href`]), style: str(content[`${p}Style`]) })).filter((b) => b.label && b.href);
  if (!buttons.length) return null;
  return (
    <div className="cta-row">
      {buttons.map((b, i) => (
        <CmsButton key={i} lang={lang} {...b} />
      ))}
    </div>
  );
}

const gridStyle = (cols: number) => ({ ['--cms-cols' as string]: String(Math.min(6, Math.max(1, cols))) });

// ---------------------------------------------------------------------------------------------

export function HeroSection({ content, lang, isFirst }: SectionProps) {
  const img = image(content.image);
  const vid = video(content.video);
  const overlay = num(content.overlay, 40);
  const height = str(content.height) || 'large';
  const align = str(content.align) || 'start';
  const H = isFirst ? 'h1' : 'h2';
  const heading = pick(content, 'heading', lang);
  const textColor = str(content.textColor);
  return (
    <div className={`cms-hero h-${height} a-${align}${img || vid ? ' has-media' : ''}`} style={textColor ? { ['--cms-hero-ink' as string]: textColor } : undefined}>
      {vid?.kind === 'file' ? (
        <video className="cms-hero-media" src={vid.src} autoPlay muted loop playsInline poster={img?.url} aria-hidden="true" />
      ) : img ? (
        <img className="cms-hero-media" src={img.url} alt="" aria-hidden="true" loading={isFirst ? 'eager' : 'lazy'} fetchPriority={isFirst ? 'high' : undefined} />
      ) : null}
      {(img || vid) && <div className="cms-hero-shade" style={{ opacity: overlay / 100 }} />}
      <div className="wrap cms-hero-body">
        {pick(content, 'eyebrow', lang) && <span className="eyebrow">{pick(content, 'eyebrow', lang)}</span>}
        {heading && <H>{heading}</H>}
        {pick(content, 'subheading', lang) && <p className="cms-hero-sub">{pick(content, 'subheading', lang)}</p>}
        {pick(content, 'body', lang) && <Paras text={pick(content, 'body', lang)} className="lead" />}
        <Buttons content={content} lang={lang} />
      </div>
    </div>
  );
}

export function ImageTextSection({ content, lang, isFirst }: SectionProps) {
  const bullets = list(content.bullets);
  const end = str(content.imagePosition) !== 'start';
  return (
    <div className={`wrap cms-split${end ? '' : ' img-start'}`}>
      <div className="cms-split-text">
        <Heading content={content} lang={lang} isFirst={isFirst} />
        {pick(content, 'body', lang) && <Paras text={pick(content, 'body', lang)} />}
        {bullets.length > 0 && (
          <ul className="cms-bullets">
            {bullets.map((b, i) => (
              <li key={i}>{pick(b, 'text', lang)}</li>
            ))}
          </ul>
        )}
        <Buttons content={content} lang={lang} prefixes={['cta']} />
      </div>
      <div className="cms-split-media">
        <Img value={content.image} lang={lang} eager={isFirst} />
      </div>
    </div>
  );
}

export function TextSection({ content, lang, isFirst }: SectionProps) {
  const width = str(content.width) || 'normal';
  return (
    <div className={`wrap cms-text w-${width}`}>
      <Heading content={content} lang={lang} isFirst={isFirst} />
      <div className="cms-prose">
        <Paras text={pick(content, 'body', lang)} />
      </div>
    </div>
  );
}

function CardGrid({ content, lang, isFirst, defCols, renderItem }: SectionProps & { defCols: number; renderItem: (item: Record<string, unknown>, i: number) => ReactNode }) {
  const items = list(content.items);
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} />
      {items.length > 0 && (
        <div className="cms-grid" style={gridStyle(num(content.columns, defCols))}>
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
}

export function ServicesSection(p: SectionProps) {
  return (
    <CardGrid
      {...p}
      defCols={3}
      renderItem={(item, i) => {
        const href = str(item.linkHref);
        const label = pick(item, 'linkLabel', p.lang);
        return (
          <article key={i} className="cms-card">
            <Img value={item.image} lang={p.lang} className="cms-card-img" />
            <div className="cms-card-body">
              <h3>{pick(item, 'title', p.lang)}</h3>
              {pick(item, 'description', p.lang) && <p>{pick(item, 'description', p.lang)}</p>}
              {href && (
                <CmsLink href={href} lang={p.lang} className="more">
                  {label || (p.lang === 'ar' ? 'اعرف المزيد' : 'Learn more')}
                </CmsLink>
              )}
            </div>
          </article>
        );
      }}
    />
  );
}

export function SolutionsSection(p: SectionProps) {
  return (
    <CardGrid
      {...p}
      defCols={4}
      renderItem={(item, i) => {
        const href = str(item.linkHref);
        const inner = (
          <>
            <Img value={item.image} lang={p.lang} className="cms-sol-img" />
            <h3>{pick(item, 'title', p.lang)}</h3>
            {pick(item, 'description', p.lang) && <p>{pick(item, 'description', p.lang)}</p>}
          </>
        );
        return href ? (
          <CmsLink key={i} href={href} lang={p.lang} className="seg cms-sol">
            {inner}
          </CmsLink>
        ) : (
          <div key={i} className="seg cms-sol">
            {inner}
          </div>
        );
      }}
    />
  );
}

export function FeaturesSection(p: SectionProps) {
  return (
    <CardGrid
      {...p}
      defCols={3}
      renderItem={(item, i) => (
        <div key={i} className="cms-feature">
          <Img value={item.icon} lang={p.lang} className="cms-feature-icon" />
          <h3>{pick(item, 'title', p.lang)}</h3>
          {pick(item, 'description', p.lang) && <p>{pick(item, 'description', p.lang)}</p>}
        </div>
      )}
    />
  );
}

function CountUp({ value, animate }: { value: number; animate: boolean }) {
  const [shown, setShown] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!animate || typeof IntersectionObserver === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      obs.disconnect();
      const start = performance.now();
      const step = (t: number) => {
        const k = Math.min(1, (t - start) / 1200);
        setShown(Math.round(value * (1 - Math.pow(1 - k, 3))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, animate]);
  return <span ref={ref}>{shown.toLocaleString('en-US')}</span>;
}

export function StatisticsSection({ content, lang, isFirst }: SectionProps) {
  const items = list(content.items);
  const animate = content.animate !== false;
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} center />
      <dl className="cms-stats">
        {items.map((s, i) => (
          <div key={i} className="cms-stat">
            <dt>{pick(s, 'label', lang)}</dt>
            <dd>
              <span className="cms-stat-num" dir="ltr">
                {str(s.prefix)}
                <CountUp value={num(s.value, 0)} animate={animate} />
                {pick(s, 'suffix', lang) && <small> {pick(s, 'suffix', lang)}</small>}
              </span>
              {pick(s, 'description', lang) && <span className="cms-stat-desc">{pick(s, 'description', lang)}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function TestimonialsSection({ content, lang, isFirst }: SectionProps) {
  const items = list(content.items);
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} />
      <div className="cms-grid" style={gridStyle(Math.min(3, items.length || 1))}>
        {items.map((t, i) => {
          const rating = Math.round(num(t.rating, 0));
          return (
            <figure key={i} className="cms-quote">
              {rating > 0 && (
                <div className="cms-stars" role="img" aria-label={`${rating}/5`}>
                  {'★'.repeat(rating)}
                  <span aria-hidden="true">{'★'.repeat(5 - rating)}</span>
                </div>
              )}
              <blockquote>
                <Paras text={pick(t, 'quote', lang)} />
              </blockquote>
              <figcaption>
                <Img value={t.image} lang={lang} className="cms-avatar" />
                <span>
                  <b>{pick(t, 'author', lang)}</b>
                  {pick(t, 'role', lang) && <small>{pick(t, 'role', lang)}</small>}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export function PartnersSection({ content, lang, isFirst }: SectionProps) {
  const items = list(content.items);
  const carousel = str(content.style) === 'carousel';
  const logos = items.map((p, i) => {
    const img = image(p.image);
    if (!img) return null;
    const name = pick(p, 'name', lang);
    const el = <img src={img.url} alt={alt(img, lang, name)} loading="lazy" decoding="async" />;
    const href = str(p.linkHref);
    return (
      <li key={i} className="cms-logo">
        {href ? (
          <CmsLink href={href} lang={lang} target="_blank">
            {el}
          </CmsLink>
        ) : (
          el
        )}
      </li>
    );
  });
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} center />
      <ul className={carousel ? 'cms-logos carousel' : 'cms-logos'}>{logos}</ul>
    </div>
  );
}

export function GallerySection({ content, lang, isFirst }: SectionProps) {
  const items = list(content.items);
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} />
      <div className="cms-grid cms-gallery" style={gridStyle(num(content.columns, 3))}>
        {items.map((g, i) => {
          const img = image(g.image);
          if (!img) return null;
          const caption = pick(g, 'caption', lang);
          return (
            <figure key={i}>
              <a href={img.url} target="_blank" rel="noopener noreferrer">
                <img src={img.url} alt={alt(img, lang, caption)} loading="lazy" decoding="async" />
              </a>
              {caption && <figcaption>{caption}</figcaption>}
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export function VideoSection({ content, lang, isFirst }: SectionProps) {
  const v = video(content.video);
  const poster = image(content.poster);
  const title = pick(content, 'heading', lang) || 'Video';
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} />
      {v && (
        <div className="cms-video">
          {v.kind === 'file' ? (
            <video src={v.src} controls playsInline poster={poster?.url} autoPlay={content.autoplay === true} muted={content.autoplay === true} preload="metadata" />
          ) : (
            <iframe src={`${v.src}${content.autoplay === true ? '?autoplay=1&mute=1' : ''}`} title={title} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          )}
        </div>
      )}
    </div>
  );
}

export function CtaSection({ content, lang, isFirst }: SectionProps) {
  const H = isFirst ? 'h1' : 'h2';
  return (
    <div className="wrap">
      <div className="cms-cta">
        <div>
          <H>{pick(content, 'heading', lang)}</H>
          {pick(content, 'description', lang) && <Paras text={pick(content, 'description', lang)} />}
        </div>
        <Buttons content={content} lang={lang} />
      </div>
    </div>
  );
}

export function FaqSection({ content, lang, isFirst }: SectionProps) {
  const items = list(content.items);
  return (
    <div className="wrap cms-text w-normal">
      <Heading content={content} lang={lang} isFirst={isFirst} />
      <div className="cms-faq">
        {items.map((q, i) => (
          <details key={i}>
            <summary>{pick(q, 'question', lang)}</summary>
            <div>
              <Paras text={pick(q, 'answer', lang)} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}

/** [question, answer] pairs of a FAQ section, for FAQPage structured data (exactly the visible text). */
export function faqPairs(content: Record<string, unknown>, lang: Lang): Array<[string, string]> {
  if (content.emitSchema === false) return [];
  return list(content.items)
    .map((q) => [pick(q, 'question', lang), pick(q, 'answer', lang)] as [string, string])
    .filter(([q, a]) => q && a);
}

export function ProcessSection({ content, lang, isFirst }: SectionProps) {
  const items = list(content.items);
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} />
      <ol className="cms-steps">
        {items.map((s, i) => (
          <li key={i}>
            <span className="cms-step-n" aria-hidden="true">
              {i + 1}
            </span>
            <div>
              <h3>{pick(s, 'title', lang)}</h3>
              {pick(s, 'description', lang) && <p>{pick(s, 'description', lang)}</p>}
              <Img value={s.image} lang={lang} className="cms-step-img" />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function TeamSection(p: SectionProps) {
  return (
    <CardGrid
      {...p}
      defCols={4}
      renderItem={(m, i) => (
        <article key={i} className="cms-person">
          <Img value={m.image} lang={p.lang} className="cms-person-img" />
          <h3>{pick(m, 'name', p.lang)}</h3>
          {pick(m, 'role', p.lang) && <span className="cms-person-role">{pick(m, 'role', p.lang)}</span>}
          {pick(m, 'bio', p.lang) && <p>{pick(m, 'bio', p.lang)}</p>}
          {str(m.linkedin) && (
            <CmsLink href={str(m.linkedin)} lang={p.lang} target="_blank" className="more">
              LinkedIn
            </CmsLink>
          )}
        </article>
      )}
    />
  );
}

const telHref = (v: string) => `tel:${v.replace(/[^\d+]/g, '')}`;

export function ContactInfoSection({ content, lang, isFirst }: SectionProps) {
  const { t } = useLanguage();
  const lines: Array<{ label: string; value: string; href?: string }> = [];
  if (content.useSiteContacts !== false) {
    const address = cmsFeed.settings?.contact ? (lang === 'ar' ? cmsFeed.settings.contact.addressAr : cmsFeed.settings.contact.addressEn) : t.ct_addr;
    lines.push({ label: t.foot_mobile, value: env.mobilePhone, href: telHref(env.mobilePhone) });
    lines.push({ label: t.foot_landline, value: env.officePhone, href: telHref(env.officePhone) });
    lines.push({ label: t.foot_bemail, value: env.businessEmail, href: `mailto:${env.businessEmail}` });
    lines.push({ label: 'WhatsApp', value: env.whatsappNumber, href: `https://wa.me/${env.whatsappNumber.replace(/\D/g, '')}` });
    if (address) lines.push({ label: t.ct_addr_l, value: address });
  }
  for (const item of list(content.items)) {
    const kind = str(item.kind);
    const value = pick(item, 'value', lang);
    if (!value) continue;
    const href = kind === 'phone' ? telHref(value) : kind === 'email' ? `mailto:${value}` : kind === 'whatsapp' ? `https://wa.me/${value.replace(/\D/g, '')}` : undefined;
    lines.push({ label: pick(item, 'label', lang), value, href });
  }
  const hours = cmsFeed.settings?.businessHours ?? [];
  const DAY: Record<string, [string, string]> = { sat: ['Saturday', 'السبت'], sun: ['Sunday', 'الأحد'], mon: ['Monday', 'الإثنين'], tue: ['Tuesday', 'الثلاثاء'], wed: ['Wednesday', 'الأربعاء'], thu: ['Thursday', 'الخميس'], fri: ['Friday', 'الجمعة'] };
  return (
    <div className={`wrap${content.showQuoteForm === true ? ' cms-split' : ''}`}>
      <div>
        <Heading content={content} lang={lang} isFirst={isFirst} />
        <ul className="cms-contacts">
          {lines.map((l, i) => (
            <li key={i}>
              {l.label && <small>{l.label}</small>}
              {l.href ? (
                <a href={l.href} dir={/^(tel|mailto|https)/.test(l.href) ? 'ltr' : undefined}>
                  {l.value}
                </a>
              ) : (
                <span>{l.value}</span>
              )}
            </li>
          ))}
        </ul>
        {hours.length > 0 && (
          <table className="cms-hours">
            <tbody>
              {hours.map((h) => (
                <tr key={h.day}>
                  <th scope="row">{DAY[h.day]?.[lang === 'ar' ? 1 : 0] ?? h.day}</th>
                  <td dir="ltr">{h.closed ? (lang === 'ar' ? 'مغلق' : 'Closed') : `${h.open} – ${h.close}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {content.showQuoteForm === true && (
        <div className="cms-form">
          <LeadForm segment="general" extraLabel={lang === 'ar' ? 'قيمة فاتورة الكهرباء الشهرية (جنيه)' : 'Monthly electricity bill (EGP)'} extraKind="billEgp" idPrefix="cms_contact" />
        </div>
      )}
    </div>
  );
}

const MAP_HOSTS = /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i;

export function MapSection({ content, lang, isFirst }: SectionProps) {
  const embed = str(content.embedUrl) || cmsFeed.settings?.contact?.mapEmbedUrl || '';
  const height = { small: 280, medium: 400, large: 560 }[str(content.height) || 'medium'] ?? 400;
  const address = pick(content, 'address', lang);
  return (
    <div className="wrap">
      <Heading content={content} lang={lang} isFirst={isFirst} />
      {MAP_HOSTS.test(embed) && (
        <div className="cms-map" style={{ height }}>
          <iframe src={embed} title={pick(content, 'heading', lang) || (lang === 'ar' ? 'الخريطة' : 'Map')} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
        </div>
      )}
      {address && <p className="cms-map-address">{address}</p>}
    </div>
  );
}

/** Administrator-only raw HTML (backend restricts it to the code.manage capability). */
export function CustomHtmlSection({ content }: SectionProps) {
  const html = str(content.html);
  if (!html) return null;
  return <div className="wrap cms-html" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ---- earlier section types, still rendered ----
export function AboutSection({ content, lang, isFirst, onDark }: SectionProps) {
  return <ImageTextSection content={{ ...content, imagePosition: 'end' }} lang={lang} isFirst={isFirst} onDark={onDark} />;
}
export function ProjectsSection(p: SectionProps) {
  return (
    <CardGrid
      {...p}
      defCols={3}
      renderItem={(item, i) => (
        <article key={i} className="cms-card">
          <Img value={item.image} lang={p.lang} className="cms-card-img" />
          <div className="cms-card-body">
            <h3>{pick(item, 'title', p.lang)}</h3>
            {pick(item, 'description', p.lang) && <p>{pick(item, 'description', p.lang)}</p>}
          </div>
        </article>
      )}
    />
  );
}
export function BenefitsSection(p: SectionProps) {
  return <FeaturesSection {...p} />;
}
export function ContactSection({ content, lang, isFirst, onDark }: SectionProps) {
  return <ContactInfoSection content={{ headingEn: content.headingEn, headingAr: content.headingAr, descriptionEn: content.bodyEn, descriptionAr: content.bodyAr, useSiteContacts: true }} lang={lang} isFirst={isFirst} onDark={onDark} />;
}

export const SECTION_COMPONENTS: Record<string, (p: SectionProps) => ReactNode> = {
  hero: HeroSection,
  imageText: ImageTextSection,
  text: TextSection,
  services: ServicesSection,
  solutions: SolutionsSection,
  features: FeaturesSection,
  statistics: StatisticsSection,
  testimonials: TestimonialsSection,
  partners: PartnersSection,
  gallery: GallerySection,
  video: VideoSection,
  cta: CtaSection,
  faq: FaqSection,
  process: ProcessSection,
  team: TeamSection,
  contactInfo: ContactInfoSection,
  map: MapSection,
  customHtml: CustomHtmlSection,
  about: AboutSection,
  projects: ProjectsSection,
  benefits: BenefitsSection,
  contact: ContactSection,
};
