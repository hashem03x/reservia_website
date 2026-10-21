import type { CSSProperties, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { waHref } from '../../services/whatsapp';
import { trackWhatsappClick } from '../../services/analytics';
import type { Segment } from '../../config/navigation';

/**
 * One WhatsApp link implementation for the whole site: prefilled message
 * in the current page language, the right segment, a tracked click, and
 * safe external-link attributes. Renders nothing when no valid WhatsApp
 * number is configured.
 *
 * `segment` picks the message; `trackSegment` (defaults to `segment`)
 * is what analytics records -- they differ for the calculator, whose
 * message is the 'calc' summary but whose lead belongs to a real segment.
 */
export function WaLink({
  segment,
  trackSegment,
  extra,
  systemSizeKwp,
  className = 'btn wa',
  style,
  ariaLabel,
  children,
}: {
  segment: Segment;
  trackSegment?: Segment;
  extra?: string;
  systemSizeKwp?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { language, t } = useLanguage();
  const location = useLocation();
  const href = waHref(language, segment, extra);
  if (!href) return null;

  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={style}
      aria-label={ariaLabel}
      title={ariaLabel ? undefined : t.new_tab}
      onClick={() => trackWhatsappClick(trackSegment ?? segment, location.pathname, systemSizeKwp)}
    >
      {children}
    </a>
  );
}
