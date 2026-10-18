import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { ResidentialIcon, AgricultureIcon, IndustrialIcon, ServiceIcon } from '../icons/SegmentIcons';

/** Ported from the template's "Pick your site" `.cards4` segment picker. */
export function SegmentPicker() {
  const { language, t } = useLanguage();
  const segments = [
    { path: 'residential', Icon: ResidentialIcon, title: t.seg_res_t, desc: t.seg_res_d },
    { path: 'agriculture', Icon: AgricultureIcon, title: t.seg_agri_t, desc: t.seg_agri_d },
    { path: 'industrial', Icon: IndustrialIcon, title: t.seg_ind_t, desc: t.seg_ind_d },
    { path: 'service', Icon: ServiceIcon, title: t.seg_svc_t, desc: t.seg_svc_d },
  ] as const;

  return (
    <div className="cards4">
      {segments.map((s) => (
        <Link key={s.path} className="seg" to={`/${language}/${s.path}`}>
          <s.Icon />
          <h3>{s.title}</h3>
          <p>{s.desc}</p>
          <span className="more">{t.seg_more}</span>
        </Link>
      ))}
    </div>
  );
}
