import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { PROFILE_SLIDES } from '../../content/profileSlides';
import { ChevronIcon } from '../icons/ChevronIcon';

const AUTOPLAY_MS = 5000;
const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReduced(onChange: () => void) {
  const mq = window.matchMedia?.(REDUCED_QUERY);
  mq?.addEventListener('change', onChange);
  return () => mq?.removeEventListener('change', onChange);
}
const getReduced = () => window.matchMedia?.(REDUCED_QUERY).matches ?? false;

/**
 * Company-profile slide carousel (About page).
 *
 * One slide per view in a fixed 16:9 frame (object-fit: contain -- slides
 * are never stretched or cropped). Native horizontal scrolling with
 * scroll-snap gives touch swipe and trackpad support; previous/next
 * buttons (mirrored in RTL), clickable indicators and Arrow/Home/End keys
 * on the focused track move between slides.
 *
 * Autoplay: advances every 5 s and loops from the last slide to the first.
 * It pauses while the carousel is hovered, focused or touched, while it is
 * off-screen, and when the visitor presses Pause (WCAG 2.2.2); it starts
 * paused under prefers-reduced-motion. Any slide change restarts the
 * countdown, so manual navigation is never overridden. The "Slide n of N"
 * live region only announces while autoplay is not running.
 * Renders nothing until the exported slide images exist (see
 * content/profileSlides.ts).
 */
export function SlidesCarousel() {
  const { t, dir, language } = useLanguage();
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const total = PROFILE_SLIDES.length;
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, () => false);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null); // null = not chosen yet
  const playing = userPlaying ?? !reduced;
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [inView, setInView] = useState(false);
  const autoplayActive = playing && !hovered && !focused && !touching && inView && total > 1;

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || !el.clientWidth) return;
    setIndex(Math.min(total - 1, Math.max(0, Math.round(Math.abs(el.scrollLeft) / el.clientWidth))));
  }, [total]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onScroll]);

  const goTo = useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el) return;
      const target = Math.min(total - 1, Math.max(0, i));
      // scrollLeft runs 0..max in LTR and 0..-max in RTL.
      el.scrollTo({ left: (dir === 'rtl' ? -1 : 1) * target * el.clientWidth, behavior: getReduced() ? 'auto' : 'smooth' });
      setIndex(target);
    },
    [dir, total],
  );

  // Only advance while the slideshow is actually on screen.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, [total]);

  // One timer per slide: re-armed on every slide change, cleared on pause and unmount.
  useEffect(() => {
    if (!autoplayActive) return;
    const id = window.setTimeout(() => goTo(index >= total - 1 ? 0 : index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [autoplayActive, index, total, goTo]);

  if (total === 0) return null;

  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
    const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    let next: number | null = null;
    if (e.key === forward) next = index + 1;
    else if (e.key === back) next = index - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = total - 1;
    if (next === null) return;
    e.preventDefault();
    goTo(next);
  }

  const fill = (s: string, n: number) => s.replace('{n}', String(n)).replace('{total}', String(total));

  return (
    <section
      ref={sectionRef}
      className="band slides"
      aria-labelledby="slides-t"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      // Keyboard focus inside the carousel pauses it (not mouse clicks, which would otherwise leave it
      // paused until something else is focused, and not the Play/Pause button itself).
      onFocus={(e) => {
        const el = e.target as HTMLElement;
        setFocused(!el.classList.contains('slides-play') && el.matches(':focus-visible'));
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <div className="wrap">
        <div className="slides-head">
          <h2 id="slides-t">{t.ab_profile_t}</h2>
          <div className="partners-nav">
            <button
              type="button"
              className="partners-btn slides-play"
              onClick={() => setUserPlaying(!playing)}
              aria-label={playing ? t.slides_pause : t.slides_play}
              data-playing={playing ? 'true' : 'false'}
            >
              {playing ? (
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
                  <rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
                  <path d="M4 2.2v11.6a.7.7 0 0 0 1.06.6l9.2-5.8a.7.7 0 0 0 0-1.2l-9.2-5.8A.7.7 0 0 0 4 2.2Z" fill="currentColor" />
                </svg>
              )}
            </button>
            <button type="button" className="partners-btn prev" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label={t.slides_prev}>
              <ChevronIcon />
            </button>
            <button type="button" className="partners-btn next" onClick={() => goTo(index + 1)} disabled={index === total - 1} aria-label={t.slides_next}>
              <ChevronIcon />
            </button>
          </div>
        </div>
        <ul ref={trackRef} className="slides-track" tabIndex={0} aria-label={t.slides_aria}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          onPointerDown={() => setTouching(true)}
          onPointerUp={() => setTouching(false)}
          onPointerCancel={() => setTouching(false)}
          onPointerLeave={() => setTouching(false)}
        >
          {PROFILE_SLIDES.map((s, i) => (
            <li key={s.src} className="slide" aria-label={fill(t.slides_status, i + 1)} aria-hidden={i !== index ? true : undefined}>
              <img src={s.src} alt={s.alt[language]} width={1920} height={1080} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            </li>
          ))}
        </ul>
        <div className="slides-dots" role="group" aria-label={t.slides_aria}>
          {PROFILE_SLIDES.map((s, i) => (
            <button key={s.src} type="button" className="slides-dot" aria-label={fill(t.slides_goto, i + 1)} aria-current={i === index ? 'true' : undefined} onClick={() => goTo(i)} />
          ))}
        </div>
        <p className="sr-only" role="status" aria-live={autoplayActive ? 'off' : 'polite'}>
          {fill(t.slides_status, index + 1)}
        </p>
      </div>
    </section>
  );
}
