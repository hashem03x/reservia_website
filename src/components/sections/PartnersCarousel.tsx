import { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { PARTNERS, PARTNERS_PREVIEW, PREVIEW_TILE_COUNT, type Partner } from '../../content/partners';
import { ChevronIcon } from '../icons/ChevronIcon';

/**
 * "Our partners" -- a horizontally scrolling row of logos in rounded tiles.
 *
 * Native scrolling with scroll-snap does the heavy lifting: touch swipe,
 * trackpads and keyboard (the list is a focusable region, so arrow keys
 * scroll it) all work without a carousel library. Previous/next buttons
 * scroll by one view, are mirrored in RTL and disable at the ends. No
 * autoplay, so nothing moves on its own (reduced-motion safe by design);
 * button scrolling is instant under prefers-reduced-motion.
 *
 * Renders nothing when there are no partners (see content/partners.ts).
 */
export function PartnersCarousel() {
  const { t, dir } = useLanguage();
  const listRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const items: Array<Partner | null> = PARTNERS.length > 0 ? PARTNERS : PARTNERS_PREVIEW ? Array(PREVIEW_TILE_COUNT).fill(null) : [];

  const updateEdges = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    // scrollLeft is 0..max in LTR and 0..-max in RTL (Chromium, Firefox, Safari).
    const pos = Math.abs(el.scrollLeft);
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: pos <= 2, end: pos >= max - 2 });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = listRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateEdges, dir]);

  if (items.length === 0) return null;

  function scrollByView(direction: 1 | -1) {
    const el = listRef.current;
    if (!el) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: direction * (dir === 'rtl' ? -1 : 1) * el.clientWidth * 0.8, behavior: reduced ? 'auto' : 'smooth' });
  }

  return (
    <section className="band partners" aria-labelledby="partners-t">
      <div className="wrap">
        <div className="partners-head">
          <h2 id="partners-t">{t.partners_t}</h2>
          <div className="partners-nav">
            <button type="button" className="partners-btn prev" onClick={() => scrollByView(-1)} disabled={edges.start} aria-label={t.partners_prev}>
              <ChevronIcon />
            </button>
            <button type="button" className="partners-btn next" onClick={() => scrollByView(1)} disabled={edges.end} aria-label={t.partners_next}>
              <ChevronIcon />
            </button>
          </div>
        </div>
        <ul ref={listRef} className="partners-list" tabIndex={0} aria-label={t.partners_list} onScroll={updateEdges}>
          {items.map((p, i) => (
            <li key={p?.name ?? `pending-${i}`} className={`partner ${p?.shape === 'circle' ? 'circle' : 'rounded'}`}>
              {p ? (
                p.href ? (
                  <a href={p.href} target="_blank" rel="noopener noreferrer">
                    <img src={p.logo} alt={p.name} loading="lazy" decoding="async" />
                  </a>
                ) : (
                  <img src={p.logo} alt={p.name} loading="lazy" decoding="async" />
                )
              ) : (
                <span className="partner-pending">{t.partners_pending}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
