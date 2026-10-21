import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';

export default function NotFound() {
  const { t, language } = useLanguage();

  return (
    <>
      <Seo page="notfound" path="" noindex />
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
