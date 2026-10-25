import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { PROFILE_SLIDES } from '../../content/profileSlides';
import { ChevronIcon } from '../icons/ChevronIcon';

/**
 * Company-profile slide carousel (About page).
 *
 * One slide per view in a fixed 16:9 frame (object-fit: contain -- slides
 * are never stretched or cropped). Native horizontal scrolling with
 * scroll-snap gives touch swipe and trackpad support; previous/next
 * buttons (mirrored in RTL), clickable indicators and Arrow/Home/End keys
 * on the focused track move between slides; a polite live region
 * announces "Slide n of N". No autoplay. Renders nothing until the
 * exported slide images exist (see content/profileSlides.ts).
 */
export function SlidesCarousel() {
  const { t, dir, language } = useLanguage();
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const total = PROFILE_SLIDES.length;

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

  if (total === 0) return null;

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    const target = Math.min(total - 1, Math.max(0, i));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // scrollLeft runs 0..max in LTR and 0..-max in RTL.
    el.scrollTo({ left: (dir === 'rtl' ? -1 : 1) * target * el.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
    setIndex(target);
  }

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
    <section className="band slides" aria-labelledby="slides-t">
      <div className="wrap">
        <div className="slides-head">
          <h2 id="slides-t">{t.ab_profile_t}</h2>
          <div className="partners-nav">
            <button type="button" className="partners-btn prev" onClick={() => goTo(index - 1)} disabled={index === 0} aria-label={t.slides_prev}>
              <ChevronIcon />
            </button>
            <button type="button" className="partners-btn next" onClick={() => goTo(index + 1)} disabled={index === total - 1} aria-label={t.slides_next}>
              <ChevronIcon />
            </button>
          </div>
        </div>
        <ul ref={trackRef} className="slides-track" tabIndex={0} aria-label={t.slides_aria} onScroll={onScroll} onKeyDown={onKeyDown}>
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
        <p className="sr-only" role="status" aria-live="polite">
          {fill(t.slides_status, index + 1)}
        </p>
      </div>
    </section>
  );
}
