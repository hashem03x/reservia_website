import { useLanguage } from '../../i18n/LanguageContext';

/** Ported from the template's "Where we work" inline SVG map (same path/point data). */
export function EgyptMap() {
  const { t } = useLanguage();

  return (
    <div className="map">
      <svg viewBox="0 0 390 310" role="img" aria-labelledby="mapT">
        <title id="mapT">{t.map_alt}</title>
        <polygon
          className="land"
          points="15,6 15,294 372,294 333,237 300,180 282,138 258,102 243,57 252,72 273,105 292.5,121.5 303,96 312,69 291,15 255,21 234,15.9 219,9 195,6 177,10.5 162,18 150,25.5 133.5,29 102,21 81,12 42,6"
        />
        <path className="nile" d="M205.5,297 C230,270 248,245 252,231 L253,220 L244,183 L246.6,169 L216,157 L200,139 L187,111 L198,82 L202,53" />
        <path className="nile" d="M202,53 C192,35 184,22 177,10.5 M202,53 C210,35 215,22 219,11.4" />
        <text className="sea" x="330" y="200">{t.m_red}</text>
        <g>
          <circle cx="175.5" cy="42" r="5" fill="var(--leaf)" />
          <text x="120" y="56">{t.m_natrun}</text>
          <circle cx="133.5" cy="29" r="5" fill="var(--leaf)" />
          <text x="105" y="44">{t.m_alamein}</text>
          <circle cx="200" cy="139" r="5" fill="var(--leaf)" />
          <circle cx="244" cy="183" r="5" fill="var(--leaf)" />
          <text x="148" y="166">{t.m_upper}</text>
          <circle cx="181.5" cy="190.5" r="5" fill="var(--leaf)" />
          <text x="140" y="208">{t.m_nv}</text>
          <circle cx="99" cy="63" r="5" fill="var(--navy)" />
          <text x="58" y="80">{t.m_wd}</text>
          <circle cx="257.4" cy="103" r="5" fill="var(--navy)" />
          <text x="266" y="100">{t.m_gos}</text>
          <circle cx="235.5" cy="66" r="4.5" fill="var(--navy)" />
          <text x="244" y="70">{t.m_sokhna}</text>
          <circle cx="217.5" cy="45" r="4.5" fill="var(--navy)" />
          <text x="226" y="44">{t.m_10r}</text>
          <circle cx="203" cy="55" r="6.5" fill="var(--sun)" stroke="var(--surface)" strokeWidth={2} />
          <text x="186" y="74" style={{ fontWeight: 600 }}>{t.m_cairo}</text>
        </g>
      </svg>
    </div>
  );
}
