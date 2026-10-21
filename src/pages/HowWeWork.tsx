import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function HowWeWork() {
  const { t } = useLanguage();
  // Reduced motion: cards render in place, no entrance animation.
  const reduce = useReducedMotion();

  return (
    <>
      <Seo page="how" path="/how-we-work" />

      <section className="page-hero">
        <div className="wrap">
          <span className="eyebrow">{t.how_eyebrow}</span>
          <h1>{t.how_title}</h1>
          <p className="lead">{t.how_lead}</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          {/* Each card rises in as it enters the viewport, staggered by its position in the row, so the eight steps read in order. */}
          {/* LazyMotion + domAnimation keeps this page's chunk small (only the features used here). */}
          <LazyMotion features={domAnimation} strict>
            <ol className="steps">
              {STEPS.map((n, i) => (
                <m.li
                  key={n}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1], delay: (i % 4) * 0.08 }}
                >
                  <h2 className="h3">{t[`s${n}t`]}</h2>
                  <p>{t[`s${n}d`]}</p>
                </m.li>
              ))}
            </ol>
          </LazyMotion>
        </div>
      </section>
    </>
  );
}
