import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { CAMPAIGN_PAGES } from '../../config/navigation';
import { env, isLeadsApiConfigured } from '../../config/env';
import { trackCallClick, trackEmailClick } from '../../services/analytics';
import { WaLink } from '../ui/WaLink';
import { WhatsAppIcon } from '../icons/SegmentIcons';
import logo from '../../assets/brand/logo.webp';

/** Document icon for the footer quote CTA, drawn to match the WhatsApp icon's size and weight. */
function QuoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 3h7l5 5v13H7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v5h5M10 13h6M10 17h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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
            {/* Two footer CTAs with identical typography and shape (client request); each keeps its own destination. */}
            <div className="footerCtas">
              <Link className="btn sun footerCta" to={`/${language}/contact`}>
                <QuoteIcon />
                <span>{t.foot_quote}</span>
              </Link>
              {/* General WhatsApp chat (not the bill CTA). */}
              <WaLink segment="general" className="btn wa footerCta">
                <WhatsAppIcon />
                <span>{t.wa_chat}</span>
              </WaLink>
            </div>
          </div>

          <div className="footerCol">
            <h2 className="footerHeading">{t.ct_eyebrow}</h2>
            {/* Contact details as supplied by the client (October 2026): sales email (mailto), mobile and landline (tel). */}
            <ul className="footerContacts">
              <li>
                <small>{t.foot_email}</small>
                <a href={`mailto:${env.salesEmail}`} dir="ltr" onClick={() => trackEmailClick(location.pathname)}>
                  {env.salesEmail}
                </a>
              </li>
              <li>
                <small>{t.foot_mobile}</small>
                <a href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`} dir="ltr" onClick={() => trackCallClick(location.pathname)}>
                  {env.mobilePhone}
                </a>
              </li>
              <li>
                <small>{t.foot_landline}</small>
                <a href={`tel:${env.officePhone.replace(/[^\d+]/g, '')}`} dir="ltr" onClick={() => trackCallClick(location.pathname)}>
                  {env.officePhone}
                </a>
              </li>
              <li>
                <small>{t.ct_addr_l}</small>
                <span>{t.ct_addr}</span>
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
