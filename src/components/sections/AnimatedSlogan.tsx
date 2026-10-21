import { useLanguage } from '../../i18n/LanguageContext';

const KEYS = ['slogan_1', 'slogan_2', 'slogan_3', 'slogan_4'] as const;

/**
 * "GENERATE. STORE. OPTIMIZE. SUSTAIN." -- one word at a time.
 *
 * Pure CSS keyframes (see `.slogan` in reservia.css): all four words share
 * one grid cell, so the line never changes size (no layout shift) and
 * React never re-renders on a timer. Each word rises in, holds, and leaves
 * upwards while an energy bar sweeps beneath it; the four staggered delays
 * make one continuous cycle.
 *
 * Screen readers get the whole slogan once (sr-only text; the animated
 * copy is aria-hidden). With prefers-reduced-motion the animated words are
 * replaced by the static full slogan.
 */
export function AnimatedSlogan() {
  const { t } = useLanguage();
  const words = KEYS.map((k) => t[k]);
  const full = words.map((w) => `${w}.`).join(' ');

  return (
    <p className="slogan">
      <span className="sr-only">{full}</span>
      <span className="slogan-anim" aria-hidden="true">
        {words.map((w, i) => (
          <span key={w} className="slogan-word" style={{ animationDelay: `${i * 2.5}s` }}>
            {w}.
          </span>
        ))}
        <span className="slogan-bar" />
      </span>
      <span className="slogan-static" aria-hidden="true">{full}</span>
    </p>
  );
}
