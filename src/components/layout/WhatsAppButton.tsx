import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { env } from '../../config/env';
import { trackCallClick } from '../../services/analytics';
import { WaLink } from '../ui/WaLink';
import { WhatsAppIcon } from '../icons/SegmentIcons';
import { pageWaSegment } from '../../config/navigation';

/** Floating WhatsApp button (and the landing-page sticky bar): follows the current page's language and segment. */
export function WhatsAppButton() {
  const { t } = useLanguage();
  const location = useLocation();
  const segment = pageWaSegment(location.pathname);

  return (
    <>
      <WaLink segment={segment} className="wafab" ariaLabel={t.wa_aria}>
        <WhatsAppIcon />
      </WaLink>
      <div className="lpbar">
        <a className="btn ghost" href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`} onClick={() => trackCallClick(location.pathname)}>
          {t.lp_call}
        </a>
        <WaLink segment={segment}>{t.lp_wa}</WaLink>
      </div>
    </>
  );
}
