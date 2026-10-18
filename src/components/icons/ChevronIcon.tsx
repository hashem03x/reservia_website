/** Small dropdown-indicator chevron, hand-drawn to match the template's existing SVG icons (no icon library in this project -- see SegmentIcons.tsx). */
export function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 8" width="10" height="7" fill="none" aria-hidden="true">
      <path d="M1 1.5 6 6.5 11 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
