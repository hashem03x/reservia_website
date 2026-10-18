import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { CAMPAIGN_PAGES, NAV_ENTRIES } from '../../config/navigation';
import { env } from '../../config/env';
import { trackCallClick, trackEmailClick } from '../../services/analytics';
import logo from '../../assets/brand/logo.webp';

export function Footer() {
  const { language, t } = useLanguage();
  const location = useLocation();

  return (
    <footer>
      <div className="wrap">
        <div className="footerGrid">
          <div className="footerBrand">
            <div className="footerBrandMark">
              <img src={logo} alt="" width={34} height={36} />
              <div>
                <b>{t.brand}</b>
                <small>{t.brand_sub}</small>
              </div>
            </div>
            <p>{t.h_lead}</p>
          </div>

          <div className="footerCol">
            <h3>{t.nav_aria}</h3>
            <ul>
              {NAV_ENTRIES.map((entry) =>
                entry.type === 'link' ? (
                  <li key={entry.path}>
                    <Link to={`/${language}${entry.path === '/' ? '' : entry.path}`}>{t[entry.labelKey]}</Link>
                  </li>
                ) : (
                  entry.items.map((item) => (
                    <li key={item.path}>
                      <Link to={`/${language}${item.path}`}>{t[item.labelKey]}</Link>
                    </li>
                  ))
                ),
              )}
            </ul>
          </div>

          <div className="footerCol">
            <h3>{t.ct_eyebrow}</h3>
            <ul>
              <li>
                <a href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`} dir="ltr" onClick={() => trackCallClick(location.pathname)}>
                  {env.mobilePhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${env.businessEmail}`} onClick={() => trackEmailClick(location.pathname)}>
                  {env.businessEmail}
                </a>
              </li>
              <li>
                <span>{t.ct_addr}</span>
              </li>
              <li>
                <Link to={`/${language}/contact`}>{t.quote}</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="footerBottom">
          <span>{t.foot1}</span>
          <span>{t.foot2}</span>
          <div className="lplinks">
            <span>{t.foot_lp}</span>
            {CAMPAIGN_PAGES.map((lp) => (
              <Link key={lp.path} to={`/${language}${lp.path}`}>
                {t[lp.eyebrowKey]}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
