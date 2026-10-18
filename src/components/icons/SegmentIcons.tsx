/**
 * Segment-picker and WhatsApp icons, ported verbatim (same paths) from
 * the reference template's inline <svg> markup -- these are illustrative
 * marks specific to Reservia's four segments, not generic icon-set
 * glyphs, so they are kept as their own hand-authored SVGs rather than
 * routed through the generic Icon abstraction.
 */

export function ResidentialIcon() {
  return (
    <svg viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M8 28 28 12l20 16" stroke="var(--navy)" />
      <path d="M14 24v22h28V24" stroke="var(--navy)" />
      <path d="M19 22l9-7 9 7" stroke="var(--sun)" strokeWidth={5} strokeLinejoin="round" />
      <rect x="24" y="34" width="8" height="12" stroke="var(--navy)" />
    </svg>
  );
}

export function AgricultureIcon() {
  return (
    <svg viewBox="0 0 56 56" fill="none" strokeWidth={2} aria-hidden="true">
      <circle cx="40" cy="14" r="6" stroke="var(--sun)" />
      <path d="M6 46h44" stroke="var(--navy)" />
      <path d="M10 46c2-6 6-8 6-8M18 46c2-6 6-8 6-8M26 46c2-6 6-8 6-8" stroke="var(--leaf)" />
      <path d="M42 46V28h6M42 34h-6v12" stroke="var(--navy)" />
      <path d="M8 30l12-4 12 4-12 4z" stroke="var(--teal)" />
    </svg>
  );
}

export function IndustrialIcon() {
  return (
    <svg viewBox="0 0 56 56" fill="none" strokeWidth={2} aria-hidden="true">
      <path d="M14 48 22 10l8 38M17 34h10M19 24h6" stroke="var(--navy)" />
      <path d="M32 48V30l8 5v-5l8 5v13z" stroke="var(--teal)" />
      <path d="M6 48h46" stroke="var(--navy)" />
      <circle cx="44" cy="14" r="5" stroke="var(--sun)" />
    </svg>
  );
}

export function ServiceIcon() {
  return (
    <svg viewBox="0 0 56 56" fill="none" strokeWidth={2} aria-hidden="true">
      <path d="M10 48V16h24v32M34 48V26h12v22M6 48h44" stroke="var(--navy)" />
      <path d="M22 21v11M16.5 26.5h11" stroke="var(--sun)" />
      <path d="M15 39h4M25 39h4M39 33h2M39 40h2" stroke="var(--teal)" />
    </svg>
  );
}

export function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.9 5 2.3 7L4.5 28l6.3-1.7c1.9 1 4 1.6 6.2 1.6 6.6 0 12-5.3 12-11.9S22.6 3 16 3zm0 21.8c-2 0-3.9-.6-5.6-1.6l-.4-.2-3.7 1 1-3.6-.3-.4a9.7 9.7 0 0 1-1.8-5.1C5.2 9.5 10 4.9 16 4.9s10.8 4.6 10.8 10.1S22 24.8 16 24.8zm5.4-7.3c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.3.3-.6.1-.2 0-.4 0-.6l-1-2.4c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1.1-1.1 2.7s1.2 3.1 1.3 3.3c.2.2 2.3 3.6 5.7 5 .8.3 1.4.5 1.9.7.8.2 1.5.2 2.1.1.6-.1 1.8-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.4z" />
    </svg>
  );
}
