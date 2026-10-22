import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { STEP_IMAGES, STEP_IMAGE_SIZES } from '../content/stepImages';

export default function HowWeWork() {
  const { t } = useLanguage();

  return (
    <>
      <Seo page="how" path="/how-we-work" />

      <section className="page-hero">
        <div className="wrap">
          <Breadcrumbs path="/how-we-work" />
          <span className="eyebrow">{t.how_eyebrow}</span>
          <h1>{t.how_title}</h1>
          <p className="lead">{t.how_lead}</p>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          {/* Each card (photo included) rises in as it enters the viewport, staggered by its position in the row, so the eight steps read in order. */}
          {/* LazyMotion + domAnimation keeps this page's chunk small (only the features used here). */}
          <LazyMotion features={domAnimation} strict>
            <ol className="steps">
              {STEP_IMAGES.map((img, i) => {
                const n = i + 1;
                return (
                  <m.li
                    key={n}
                    // Same initial style in the prerendered HTML and the first client render. Reduced
                    // motion (and no-JS) is handled in CSS, which overrides these inline styles.
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1], delay: (i % 4) * 0.08 }}
                  >
                    {img && (
                      <div className="step-media">
                        <img
                          src={img.src960}
                          srcSet={`${img.src480} 480w, ${img.src960} 960w`}
                          sizes={STEP_IMAGE_SIZES}
                          width={960}
                          height={600}
                          alt={t[`s${n}_img`]}
                          // The first row can be above the fold on wide screens; the rest load as they approach.
                          loading={i < 4 ? 'eager' : 'lazy'}
                          decoding="async"
                          style={{ objectPosition: img.position }}
                        />
                      </div>
                    )}
                    <div className="step-body">
                      <h2 className="h3">{t[`s${n}t`]}</h2>
                      <p>{t[`s${n}d`]}</p>
                    </div>
                  </m.li>
                );
              })}
            </ol>
          </LazyMotion>

        </div>
      </section>
    </>
  );
}
