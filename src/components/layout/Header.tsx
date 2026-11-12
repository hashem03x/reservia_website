import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { siteNav, linkTo, type SiteNavLink } from '../../cms/nav';
import { cmsFeed } from '../../content/cmsFeed';
import { findRoute, routeLangs, splitPath } from '../../content/seoHead';
import { env } from '../../config/env';
import { trackCallClick, trackLanguageChange } from '../../services/analytics';
import { NavDropdown } from './NavDropdown';
import { ThemeToggle } from './ThemeToggle';
import { ChevronIcon } from '../icons/ChevronIcon';
import logo from '../../assets/brand/logo.webp';
import wordmark from '../../assets/brand/wordmark.webp';
import wordmarkDark from '../../assets/brand/wordmark-dark.webp';

export function Header() {
  const { language, t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroups, setOpenMobileGroups] = useState<Set<string>>(new Set());
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const nextLang = language === 'ar' ? 'en' : 'ar';

  // A real href for the language switch, computed on every render (not just on click), so it's a
  // genuine crawlable <a href> rather than a JS-only action. Keeps the query (e.g. ?tab=farm) so
  // the visitor stays on the same view. A page that doesn't exist in the other language (the
  // Arabic irrigation guide) falls back to its parent route.
  const { path: currentPath } = splitPath(location.pathname);
  const currentRoute = findRoute(currentPath, cmsFeed);
  const entries = siteNav(cmsFeed, language, t);
  const hs = cmsFeed.settings?.header;
  const showCta = hs?.showCta !== false;
  const ctaLabel = (language === 'ar' ? hs?.ctaLabelAr || hs?.ctaLabelEn : hs?.ctaLabelEn || hs?.ctaLabelAr) || t.quote;
  const cta = hs?.ctaHref ? linkTo(hs.ctaHref, language) : { to: `/${language}/contact`, external: false };
  const navItem = (item: SiteNavLink) =>
    item.external ? (
      <a key={item.to} href={item.to} target={item.target === '_blank' ? '_blank' : undefined} rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}>
        {item.label}
      </a>
    ) : (
      <NavLink key={item.to} to={item.to} end={item.end} target={item.target === '_blank' ? '_blank' : undefined}>
        {item.label}
      </NavLink>
    );
  const ctaEl = (className: string) =>
    cta.external ? (
      <a className={className} href={cta.to}>
        {ctaLabel}
      </a>
    ) : (
      <Link className={className} to={cta.to}>
        {ctaLabel}
      </Link>
    );
  const targetPath = currentRoute && !routeLangs(currentRoute).includes(nextLang) ? (currentRoute.parent ?? '') : currentPath;
  const langHref = `/${nextLang}${targetPath}${location.search}`;

  useEffect(() => {
    setOpen(false);
    setOpenGroup(null);
    setOpenMobileGroups(new Set());
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) {
        setOpen(false);
        menuBtnRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  function toggleMobileGroup(label: string) {
    setOpenMobileGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }

  return (
    <header className="top">
      <div className="wrap">
        {/* Accessible name = the brand name plus ", Home" (label-in-name, WCAG 2.5.3). The name is the
            official wordmark from the company profile (battery "i", round "a"), with a light variant for dark mode. */}
        <Link className="brand" to={`/${language}`}>
          <img src={logo} alt={`${t.brand} ${t.brand_sub}`} width={60} height={60} decoding="async" />
          <span>
            <b>
              <img className="wordmark wm-light" src={wordmark} alt={t.brand} width={539} height={96} decoding="async" />
              <img className="wordmark wm-dark" src={wordmarkDark} alt={t.brand} width={539} height={96} decoding="async" />
            </b>{' '}
            <small>{t.brand_sub}</small>
            <span className="sr-only">, {t.nav_home}</span>
          </span>
        </Link>

        <button
          ref={menuBtnRef}
          className="btn ghost menu-btn"
          type="button"
          aria-expanded={open}
          aria-controls="nav"
          onClick={() => setOpen((o) => !o)}
        >
          {t.menu}
        </button>

        <nav className={open ? 'main open' : 'main'} id="nav" aria-label={t.nav_aria}>
          {entries.map((entry) =>
            entry.type === 'link' ? (
              navItem(entry)
            ) : (
              <div className="navMobileGroup" key={entry.key}>
                {/* Desktop: hover/click dropdown */}
                <NavDropdown label={entry.label} items={entry.items} isOpen={openGroup === entry.key} onOpenChange={(isOpen) => setOpenGroup(isOpen ? entry.key : null)} />
                {/* Mobile: accordion */}
                <button type="button" className="navMobileGroupTrigger" aria-expanded={openMobileGroups.has(entry.key)} onClick={() => toggleMobileGroup(entry.key)}>
                  {entry.label}
                  <ChevronIcon className={openMobileGroups.has(entry.key) ? 'navDropChevron open' : 'navDropChevron'} />
                </button>
                {/* Always rendered -- including in the prerendered HTML -- so these links are
                    crawlable without a click; CSS (.open) controls visibility, not mounting. */}
                <div className={openMobileGroups.has(entry.key) ? 'navMobileSubList open' : 'navMobileSubList'}>{entry.items.map(navItem)}</div>
              </div>
            ),
          )}
          {showCta && ctaEl('btn sun navMobileCta')}
        </nav>

        <div className="tools">
          {hs?.showPhone !== false && (
          <a
            className="btn ghost lp-phone"
            href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`}
            dir="ltr"
            onClick={() => trackCallClick(location.pathname)}
          >
            {env.mobilePhone}
          </a>
          )}
          <ThemeToggle />
          {/* A real <a href>, not a button, so crawlers can follow it directly and it works with
              no JS (right-click/open-in-new-tab, etc.). Visible text is the target language's own
              name; the accessible name adds what the link does, in the current language. */}
          <Link className="lang" to={langHref} onClick={() => trackLanguageChange(location.pathname, language, nextLang)}>
            <span lang={nextLang}>{language === 'ar' ? 'English' : 'عربي'}</span>
            <span className="sr-only">: {t.lang_switch_sr}</span>
          </Link>
          {showCta && ctaEl('btn sun')}
        </div>
      </div>
    </header>
  );
}
