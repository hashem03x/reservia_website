import { useEffect, useRef, useState } from 'react';
import { useIsClient } from '../../hooks/useIsClient';
import logo from '../../assets/brand/logo.webp';

// Shortened (was 900 / 2500 ms) so the overlay never holds content back for long;
// with prefers-reduced-motion there is no minimum at all.
const MIN_VISIBLE_MS = 500;
const MAX_WAIT_MS = 1500;
const EXIT_MS = 550;

/**
 * Full-screen branded boot sequence: deep-navy background, the real
 * Reservia logo, a cyan light sweep, a couple of spark accents, an
 * expanding ring pulse, and a thin indeterminate progress line --
 * "an energy system powering up."
 *
 * Lifecycle: mounted once in main.tsx, outside the router, so client-side
 * navigation never remounts or replays it. It waits for web fonts to be
 * ready (document.fonts.ready) so it never hands off to a page that still
 * flashes unstyled text, but never blocks longer than MAX_WAIT_MS even if
 * that promise never settles. A short MIN_VISIBLE_MS keeps the sequence
 * from feeling like a flicker on a fast connection, without padding it
 * out further than that -- actual readiness drives the timing, not a
 * fixed delay.
 */
export function AppLoader() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);
  // Empty in the prerendered HTML and during hydration; the localized label once hydrated.
  const isClient = useIsClient();
  const label = !isClient ? '' : document.documentElement.lang === 'ar' ? 'جارٍ تحميل ريزيرفيا' : 'Loading Reservia';
  const startedAt = useRef<number>(0);

  useEffect(() => {
    startedAt.current = performance.now();
    let finished = false;
    let settleTimer: number | undefined;
    let exitTimer: number | undefined;
    let hideTimer: number | undefined;

    const fontsReady =
      typeof document !== 'undefined' && document.fonts && document.fonts.ready
        ? document.fonts.ready.catch(() => undefined)
        : Promise.resolve();
    const timeoutP = new Promise<void>((resolve) => {
      settleTimer = window.setTimeout(resolve, MAX_WAIT_MS);
    });

    Promise.race([fontsReady, timeoutP]).then(() => {
      if (finished) return;
      window.clearTimeout(settleTimer);
      const elapsed = performance.now() - startedAt.current;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const remaining = reduced ? 0 : Math.max(0, MIN_VISIBLE_MS - elapsed);
      exitTimer = window.setTimeout(() => {
        if (finished) return;
        setExiting(true);
        hideTimer = window.setTimeout(() => {
          if (!finished) setVisible(false);
        }, EXIT_MS);
      }, remaining);
    });

    return () => {
      finished = true;
      window.clearTimeout(settleTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={exiting ? 'appLoader exiting' : 'appLoader'} role="status" aria-live="polite">
      <div className="appLoaderGlow" aria-hidden="true" />
      <div className="appLoaderSparks" aria-hidden="true">
        <span className="loaderSpark ls-a" />
        <span className="loaderSpark ls-b" />
        <span className="loaderSpark ls-c" />
      </div>
      <div className="appLoaderMark">
        <img src={logo} alt="" className="appLoaderLogo" />
        <span className="appLoaderSweep" aria-hidden="true" />
      </div>
      <div className="appLoaderBrand">Reservia</div>
      <div className="appLoaderSub">Integrated Energy Solutions</div>
      <div className="appLoaderBar" aria-hidden="true">
        <span />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
