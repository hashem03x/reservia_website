import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';

export default function NotFound() {
  const { t, language } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t.nf_title}</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <section className="band" style={{ textAlign: 'center' }}>
        <div className="wrap" style={{ maxWidth: 560 }}>
          <h1>{t.nf_title}</h1>
          <p className="lead" style={{ margin: '16px auto 28px' }}>{t.nf_body}</p>
          <Link className="btn sun" to={`/${language}`}>{t.nf_cta}</Link>
        </div>
      </section>
    </>
  );
}
