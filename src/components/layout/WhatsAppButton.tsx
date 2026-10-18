import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { env } from '../../config/env';
import { waHref } from '../../services/whatsapp';
import { trackCallClick, trackWhatsappClick } from '../../services/analytics';
import { segmentGroup } from '../../services/leadService';
import { WhatsAppIcon } from '../icons/SegmentIcons';
import type { Segment } from '../../config/navigation';

/** Ported from the template's `route()`: which WhatsApp segment the floating button/sticky bar uses, by current page. */
function pageWaSegment(pathname: string): Segment {
  if (pathname.includes('/lp/villas')) return 'villas';
  if (pathname.includes('/lp/compounds')) return 'compounds';
  if (pathname.includes('/lp/agriculture')) return 'agriculture';
  if (pathname.includes('/lp/industrial')) return 'industrial';
  if (pathname.includes('/lp/service')) return 'service';
  if (pathname.includes('/residential')) return 'villas';
  if (pathname.includes('/agriculture')) return 'agriculture';
  if (pathname.includes('/industrial')) return 'industrial';
  if (pathname.includes('/service')) return 'service';
  return 'general';
}

export function WhatsAppButton() {
  const { language, t } = useLanguage();
  const location = useLocation();
  const segment = pageWaSegment(location.pathname);

  function onWaClick() {
    trackWhatsappClick(segment, segmentGroup(segment), location.pathname);
  }

  return (
    <>
      <a
        className="wafab"
        href={waHref(language, segment)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t.wa_aria}
        onClick={onWaClick}
      >
        <WhatsAppIcon />
      </a>
      <div className="lpbar">
        <a className="btn ghost" href={`tel:${env.mobilePhone.replace(/[^\d+]/g, '')}`} onClick={() => trackCallClick(location.pathname)}>
          {t.lp_call}
        </a>
        <a className="btn wa" href={waHref(language, segment)} target="_blank" rel="noopener noreferrer" onClick={onWaClick}>
          {t.lp_wa}
        </a>
      </div>
    </>
  );
}
