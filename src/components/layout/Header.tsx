import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { NAV_ENTRIES } from '../../config/navigation';
import { env } from '../../config/env';
import { trackCallClick, trackLanguageChange } from '../../services/analytics';
import { NavDropdown } from './NavDropdown';
import { ChevronIcon } from '../icons/ChevronIcon';
import logo from '../../assets/brand/logo.webp';

export function Header() {
  const { language, t, buildPath } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [openMobileGroups, setOpenMobileGroups] = useState<Set<string>>(new Set());
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const nextLang = language === 'ar' ? 'en' : 'ar';

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

  function switchLanguage() {
    trackLanguageChange(location.pathname, nextLang);
    navigate(buildPath(nextLang, location.pathname));
  }

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
        <Link className="brand" to={`/${language}`} aria-label={t.home_aria}>
          <img src={logo} alt="" width={40} height={42} decoding="async" />
          <span>
            <b>{t.brand}</b>
            <small>{t.brand_sub}</small>
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
          {NAV_ENTRIES.map((entry) =>
            entry.type === 'link' ? (
              <NavLink key={entry.path} to={`/${language}${entry.path === '/' ? '' : entry.path}`} end={entry.path === '/'}>
                {t[entry.labelKey]}
              </NavLink>
            ) : (
              <div className="navMobileGroup" key={entry.labelKey}>
                {/* Desktop: hover/click dropdown */}
                <NavDropdown
                  label={t[entry.labelKey]}
                  items={entry.items}
                  language={language}
                  t={t}
                  isOpen={openGroup === entry.labelKey}
                  onOpenChange={(isOpen) => setOpenGroup(isOpen ? entry.labelKey : null)}
                />
                {/* Mobile: accordion */}
                <button
                  type="button"
                  className="navMobileGroupTrigger"
                  aria-expanded={openMobileGroups.has(entry.labelKey)}
                  onClick={() => toggleMobileGroup(entry.labelKey)}
                >
                  {t[entry.labelKey]}
                  <ChevronIcon className={openMobileGroups.has(entry.labelKey) ? 'navDropChevron open' : 'navDropChevron'} />
                </button>
                {openMobileGroups.has(entry.labelKey) && (
                  <div className="navMobileSubList">
                    {entry.items.map((item) => (
                      <NavLink key={item.path} to={`/${language}${item.path}`}>
                        {t[item.labelKey]}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ),
          )}
          <Link className="btn sun navMobileCta" to={`/${language}/contact`}>
            {t.quote}
          </Link>
        </nav>

        <div className="tools">
          <a
            className="btn ghost lp-phone"
            href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`}
            dir="ltr"
            onClick={() => trackCallClick(location.pathname)}
          >
            {env.mobilePhone}
          </a>
          <button className="lang" type="button" lang={nextLang} onClick={switchLanguage}>
            {language === 'ar' ? 'English' : 'عربي'}
          </button>
          <Link className="btn sun" to={`/${language}/contact`}>
            {t.quote}
          </Link>
        </div>
      </div>
    </header>
  );
}
