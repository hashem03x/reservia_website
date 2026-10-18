/** Hand-drawn to match the project's existing icon approach (see SegmentIcons.tsx, ChevronIcon.tsx) -- no icon library in this project. */
export function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
      <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M10 1.5v2.3M10 16.2v2.3M18.5 10h-2.3M3.8 10H1.5M15.66 4.34l-1.63 1.63M5.97 14.03l-1.63 1.63M15.66 15.66l-1.63-1.63M5.97 5.97 4.34 4.34" />
      </g>
    </svg>
  );
}

export function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" width="18" height="18" fill="none" aria-hidden="true">
      <path
        d="M17.2 11.6A7.3 7.3 0 0 1 8.4 2.8a7.3 7.3 0 1 0 8.8 8.8z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
