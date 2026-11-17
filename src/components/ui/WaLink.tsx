import type { CSSProperties, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { waHref } from '../../services/whatsapp';
import { registerWaRefCode, buildWaRefCode } from '../../services/waRefCode';
import { trackWhatsappClick } from '../../services/analytics';
import { trackWhatsappClicked } from '../../analytics/amplitude';
import { offersBillWhatsapp, type Segment } from '../../config/navigation';
import { useIsClient } from '../../hooks/useIsClient';
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
  // Bug fix (Nov 2026 QA - "WhatsApp reference shows a stale date on first load"): this site is
  // build-time prerendered (scripts/build-site.mjs), so generating the ref code's date stamp
  // unconditionally would freeze whatever day the LAST BUILD ran into the static HTML every
  // visitor gets served until the next deploy (e.g. "WA-1211-..." stuck on 12 Nov). `useIsClient`
  // is the same hydration-safe gate Contact.tsx already uses for its own browser-only values:
  // `false` during prerendering/hydration (so the prerendered and first-hydrated render match,
  // with no misleading ref code), `true` immediately after - and React re-renders right away,
  // before paint, so the real, freshly-dated code appears with no visible flash. A full page
  // load/refresh re-prerenders+re-hydrates the same way; an in-app navigation re-renders an
  // already-hydrated component, so it was never stale there either way - this fix makes the
  // FIRST load behave the same as every subsequent one.
  const isClient = useIsClient();
  const refCode = isClient ? buildWaRefCode(segment) : undefined;
  const wa = waHref(language, fields, refCode);
  if (!wa) return null;

  return (
    <a
      className={className}
      href={wa.href}
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
        trackWhatsappClicked(effectiveSegment, location.pathname, wa.refCode);
        // Change Request 1, Feature 1: register this ref code's attribution with the CRM so the
        // customer's first inbound message can be resolved to a real source. Fire-and-forget --
        // never delays the wa.me navigation that's already happening via the real href above.
        // Only when hydrated (a real click always is - this guard is for completeness, not
        // because a pre-hydration click is expected).
        if (wa.refCode) registerWaRefCode(wa.refCode);
      }}
    >
      {children}
    </a>
  );
}
