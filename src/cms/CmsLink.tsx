import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Lang } from '../content/seoHead';

/**
 * A link from CMS content: a site path ('/contact') becomes a language-prefixed router link
 * ('/en/contact'), '#anchor' stays on the page, anything else (https, mailto:, tel:) is a plain
 * anchor - external ones open safely in a new tab when asked.
 */
export function CmsLink({ href, lang, className, children, target, onClick }: { href: string; lang: Lang; className?: string; children: ReactNode; target?: '_self' | '_blank'; onClick?: () => void }) {
  if (href.startsWith('#')) {
    return (
      <a className={className} href={href} onClick={onClick}>
        {children}
      </a>
    );
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    const already = /^\/(en|ar)(\/|$)/.test(href);
    const to = already ? href : `/${lang}${href === '/' ? '' : href}`;
    return (
      <Link className={className} to={to} target={target === '_blank' ? '_blank' : undefined} onClick={onClick}>
        {children}
      </Link>
    );
  }
  const external = /^https?:/i.test(href);
  return (
    <a className={className} href={href} target={target === '_blank' || (external && target !== '_self') ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} onClick={onClick}>
      {children}
    </a>
  );
}

const BUTTON_CLASS: Record<string, string> = { primary: 'btn sun', secondary: 'btn ghost', outline: 'btn ghost', whatsapp: 'btn wa' };

/** One CMS button (label + link + style) - nothing renders without both a label and a link. */
export function CmsButton({ label, href, style, lang }: { label: string; href: string; style?: string; lang: Lang }) {
  if (!label || !href) return null;
  return (
    <CmsLink href={href} lang={lang} className={BUTTON_CLASS[style || 'primary'] || BUTTON_CLASS.primary}>
      {label}
    </CmsLink>
  );
}
