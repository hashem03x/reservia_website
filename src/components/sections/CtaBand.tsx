import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { waHref } from '../../services/whatsapp';
import { trackWhatsappClick } from '../../services/analytics';
import { segmentGroup } from '../../services/leadService';

/** Ported from the template's `.cta-band` ("Send us your last 12 electricity bills..."). */
export function CtaBand() {
  const { t, language } = useLanguage();
  const location = useLocation();

  return (
    <div className="cta-band">
      <div>
        <h2>{t.cta_band_t}</h2>
        <p>{t.cta_band_d}</p>
      </div>
      <div className="cta-row">
        <Link className="btn sun" to={`/${language}/contact`}>
          {t.quote}
        </Link>
        <a
          className="btn wa"
          href={waHref(language, 'general')}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackWhatsappClick('general', segmentGroup('general'), location.pathname)}
        >
          {t.h_cta_wa}
        </a>
      </div>
    </div>
  );
}
