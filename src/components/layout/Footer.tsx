import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { CAMPAIGN_PAGES } from '../../config/navigation';
import { env, flags, isLeadsApiConfigured } from '../../config/env';
import { trackCallClick, trackEmailClick } from '../../services/analytics';
import { WaLink } from '../ui/WaLink';
import { WhatsAppIcon } from '../icons/SegmentIcons';
import logo from '../../assets/brand/logo.webp';

/**
 * Two-column footer: company identity (name with the LLC suffix, the
 * footer description and a general WhatsApp chat button) and contact
 * details. The former "Main menu" link column was removed at the client's
 * request; the header navigation covers every page.
 */
export function Footer() {
  const { language, t } = useLanguage();
  const location = useLocation();

  return (
    <footer>
      <div className="wrap">
        <div className="footerGrid">
          <div className="footerBrand">
            <div className="footerBrandMark">
              <img src={logo} alt="" width={34} height={34} />
              <div>
                <b>{t.brand}</b>
                <small>{t.brand_legal}</small>
              </div>
            </div>
            <p>{t.foot_desc}</p>
            {/* General WhatsApp chat (not the bill CTA). */}
            <WaLink segment="general" className="btn wa footerWa">
              <WhatsAppIcon />
              <span>{t.wa_chat}</span>
            </WaLink>
          </div>

          <div className="footerCol">
            <h2 className="footerHeading">{t.ct_eyebrow}</h2>
            <ul>
              <li>
                <a href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`} dir="ltr" onClick={() => trackCallClick(location.pathname)}>
                  {env.mobilePhone}
                </a>
              </li>
              <li>
                {/* mailto: only once Reservia confirms (client decision 8, VITE_ENABLE_MAILTO_LINKS). */}
                {flags.mailtoLinks ? (
                  <a href={`mailto:${env.businessEmail}`} onClick={() => trackEmailClick(location.pathname)}>
                    {env.businessEmail}
                  </a>
                ) : (
                  <span>{env.businessEmail}</span>
                )}
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
          {!isLeadsApiConfigured && <span>{t.foot2}</span>}
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
