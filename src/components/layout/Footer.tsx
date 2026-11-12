import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { CAMPAIGN_PAGES } from '../../config/navigation';
import { env, isLeadsApiConfigured } from '../../config/env';
import { trackCallClick, trackEmailClick } from '../../services/analytics';
import { WaLink } from '../ui/WaLink';
import { WhatsAppIcon } from '../icons/SegmentIcons';
import logo from '../../assets/brand/logo.webp';
import { cmsFeed } from '../../content/cmsFeed';
import { footerColumns } from '../../cms/nav';

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
  const s = cmsFeed.settings;
  const ar = language === 'ar';
  const description = (ar ? s?.descriptionAr || s?.descriptionEn : s?.descriptionEn || s?.descriptionAr) || t.foot_desc;
  const copyright = (ar ? s?.footerCopyrightAr || s?.footerCopyrightEn : s?.footerCopyrightEn || s?.footerCopyrightAr) || t.foot1;
  const columns = footerColumns(cmsFeed, language);
  const socials = s?.footer.showSocial !== false ? Object.entries(s?.socialLinks ?? {}) : [];
  const SOCIAL: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', youtube: 'YouTube', tiktok: 'TikTok', x: 'X' };
  const address = s?.contact ? (ar ? s.contact.addressAr || s.contact.addressEn : s.contact.addressEn || s.contact.addressAr) || t.ct_addr : t.ct_addr;

  return (
    <footer>
      <div className="wrap">
        <div className="footerGrid">
          <div className="footerBrand">
            <div className="footerBrandMark">
              <img src={logo} alt={`${t.brand} ${t.brand_sub}`} width={40} height={40} />
              <div>
                <b>{t.brand}</b>
                <small>{t.brand_legal}</small>
              </div>
            </div>
            <p>{description}</p>
            {socials.length > 0 && (
              <div className="footerSocial">
                {socials.map(([k, href]) => (
                  <a key={k} href={href} target="_blank" rel="noopener noreferrer">
                    {SOCIAL[k] ?? k}
                  </a>
                ))}
              </div>
            )}
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

          {columns.map((c, i) => (
            <div className="footerCol footerCmsCol" key={i}>
              <h2 className="footerHeading">{c.title}</h2>
              <ul>
                {c.items.map((l) => (
                  <li key={l.to}>
                    {l.external ? (
                      <a href={l.to} target={l.target === '_blank' ? '_blank' : undefined} rel={l.target === '_blank' ? 'noopener noreferrer' : undefined}>
                        {l.label}
                      </a>
                    ) : (
                      <Link to={l.to}>{l.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {s?.footer.showContact !== false && (
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
                <small>{t.foot_bemail}</small>
                <a href={`mailto:${env.businessEmail}`} dir="ltr" onClick={() => trackEmailClick(location.pathname)}>
                  {env.businessEmail}
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
                <span>{address}</span>
              </li>
            </ul>
          </div>
          )}
        </div>

        <div className="footerBottom">
          <span>{copyright}</span>
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
