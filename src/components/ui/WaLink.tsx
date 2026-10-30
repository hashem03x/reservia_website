import type { CSSProperties, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { waHref } from '../../services/whatsapp';
import { trackWhatsappClick } from '../../services/analytics';
import { trackWhatsappClicked } from '../../analytics/amplitude';
import { offersBillWhatsapp, type Segment } from '../../config/navigation';
import type { QuoteFields } from '../../content/whatsappMessages';

/**
 * "Send your bill to WhatsApp". Renders only where the client's visibility
 * rule allows it (homepage and Residential & Commercial, see
 * offersBillWhatsapp in config/navigation.ts), so no page can show it by
 * mistake. `children` defaults to the standard label.
 */
export function BillWaLink(props: Omit<Parameters<typeof WaLink>[0], 'children'> & { children?: ReactNode }) {
  const { t } = useLanguage();
  if (!offersBillWhatsapp(props.trackSegment ?? props.segment)) return null;
  return <WaLink {...props}>{props.children ?? t.h_cta_wa}</WaLink>;
}

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
  fields,
  systemSizeKwp,
  className = 'btn wa',
  style,
  ariaLabel,
  children,
}: {
  segment: Segment;
  trackSegment?: Segment;
  /** Values for the prefilled quote message (location, monthly bill/consumption, extra lines). */
  fields?: QuoteFields;
  systemSizeKwp?: number;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const { language, t } = useLanguage();
  const location = useLocation();
  const href = waHref(language, segment, fields);
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
      onClick={() => {
        const effectiveSegment = trackSegment ?? segment;
        trackWhatsappClick(effectiveSegment, location.pathname, systemSizeKwp);
        // Note: this codebase's Segment vocabulary calls the farm/agriculture vertical
        // 'agriculture', not 'farm' - the Developer Brief's "segment=farm" example maps to this
        // existing value (not renamed, to avoid touching every other call site/test using it).
        trackWhatsappClicked(effectiveSegment, location.pathname);
      }}
    >
      {children}
    </a>
  );
}
