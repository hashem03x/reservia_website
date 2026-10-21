import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { BillWaLink } from '../ui/WaLink';
import type { Segment } from '../../config/navigation';

/**
 * The template's closing `.cta-band` ("Send us your last 12 electricity
 * bills..."). `segment` picks the WhatsApp message and `contactType` the
 * contact-form preselection, so the closing band matches the page it ends.
 * The bill-to-WhatsApp button appears only where the client rule allows it.
 */
export function CtaBand({ segment = 'general', contactType }: { segment?: Segment; contactType?: string }) {
  const { t, language } = useLanguage();

  return (
    <div className="cta-band">
      <div>
        <h2>{t.cta_band_t}</h2>
        <p>{t.cta_band_d}</p>
      </div>
      <div className="cta-row">
        <Link className="btn sun" to={`/${language}/contact${contactType ? `?type=${contactType}` : ''}`}>
          {t.quote}
        </Link>
        {/* Shown only on the homepage and Residential & Commercial pages (BillWaLink enforces the rule). */}
        <BillWaLink segment={segment} />
      </div>
    </div>
  );
}
