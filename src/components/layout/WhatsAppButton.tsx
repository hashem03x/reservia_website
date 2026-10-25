import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { env } from '../../config/env';
import { trackCallClick } from '../../services/analytics';
import { WaLink } from '../ui/WaLink';
import { WhatsAppIcon } from '../icons/SegmentIcons';
import { pageWaSegment } from '../../config/navigation';
import { useWaPrefill } from '../../services/waPrefill';

/**
 * Floating WhatsApp button (and the landing-page sticky bar): follows the current page's language
 * and segment, and fills in any location / monthly figure the visitor has entered on this page.
 */
export function WhatsAppButton() {
  const { t } = useLanguage();
  const location = useLocation();
  const segment = pageWaSegment(location.pathname);
  const fields = useWaPrefill() ?? undefined;

  return (
    <>
      <WaLink segment={segment} fields={fields} className="wafab" ariaLabel={t.wa_aria}>
        <WhatsAppIcon />
      </WaLink>
      <div className="lpbar">
        <a className="btn ghost" href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`} onClick={() => trackCallClick(location.pathname)}>
          {t.lp_call}
        </a>
        <WaLink segment={segment} fields={fields}>
          {t.lp_wa}
        </WaLink>
      </div>
    </>
  );
}
