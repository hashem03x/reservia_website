import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const SHOW_AFTER_PX = 600;
const LAUNCH_MS = 650;

/**
 * Floating "Back to top" button, stacked above the WhatsApp button.
 *
 * - Springs in once the visitor has scrolled past SHOW_AFTER_PX, with a
 *   one-off energy ping; hidden (and unfocusable) near the top.
 * - A cyan-to-amber ring fills with scroll progress. Progress is written
 *   to a CSS variable on scroll (rAF-throttled), so scrolling never
 *   re-renders React; state changes only when visibility flips.
 * - At rest the arrow gives a periodic upward nudge; on hover it bounces
 *   with a glow; on click it "launches" with a spark burst while the page
 *   scrolls smoothly to the top. Keyboard focus then moves to the header
 *   logo, so the next Tab continues from the top of the page.
 * - prefers-reduced-motion: no animation, and the jump to the top is instant.
 */
export function ScrollTopButton() {
  const { t } = useLanguage();
  const ref = useRef<HTMLButtonElement>(null);
  const [visible, setVisible] = useState(false);
  const [launching, setLaunching] = useState(false);

  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      ref.current?.style.setProperty('--p', String(max > 0 ? Math.min(1, y / max) : 0));
      setVisible(y > SHOW_AFTER_PX);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  function goTop() {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      setLaunching(true);
      window.setTimeout(() => setLaunching(false), LAUNCH_MS);
    }
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    (document.querySelector('header .brand') as HTMLElement | null)?.focus({ preventScroll: true });
  }

  return (
    <button
      ref={ref}
      type="button"
      className={`totop${visible ? ' show' : ''}${launching ? ' launch' : ''}`}
      onClick={goTop}
      aria-label={t.totop}
      title={t.totop}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <svg className="totop-ring" viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="totopGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--cyan-bright)" />
            <stop offset="1" stopColor="var(--sun)" />
          </linearGradient>
        </defs>
        <circle className="totop-track" cx="24" cy="24" r="22" />
        <circle className="totop-progress" cx="24" cy="24" r="22" stroke="url(#totopGrad)" />
      </svg>
      <svg className="totop-arrow" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="totop-sparks" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  );
}
