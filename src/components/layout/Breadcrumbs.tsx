import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { breadcrumbTrail } from '../../content/breadcrumbs';

/** Visible breadcrumb trail (rendered at the top of subpage heroes); BreadcrumbList JSON-LD mirrors it (Seo.tsx). */
export function Breadcrumbs({ path }: { path: string }) {
  const { t, language } = useLanguage();
  const items = breadcrumbTrail(path, t);
  if (items.length < 2) return null;
  return (
    <nav className="crumbs" aria-label={t.crumbs_aria}>
      <ol>
        {items.map((c, i) => (
          <li key={c.path || 'home'}>
            {i < items.length - 1 ? <Link to={`/${language}${c.path}`}>{c.name}</Link> : <span aria-current="page">{c.name}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
