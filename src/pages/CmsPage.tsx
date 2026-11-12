import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Seo } from '../components/layout/Seo';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { cmsFeed } from '../content/cmsFeed';
import { cmsPageFor } from '../content/cms';
import { findRoute } from '../content/seoHead';
import { PageRenderer } from '../cms/PageRenderer';
import { faqPairs } from '../cms/sections';
import NotFound from './NotFound';

/**
 * A page built in the Website CMS, rendered from its PUBLISHED sections (the build-time feed -
 * drafts never reach this bundle). Used both for CMS-only pages and for a built-in path whose
 * page an editor rebuilt in the CMS. A language the page was not published in is a 404.
 */
export default function CmsPage({ path }: { path: string }) {
  const { language } = useLanguage();
  const page = cmsPageFor(cmsFeed, path);
  const landing = page?.layout === 'landing';

  useEffect(() => {
    if (!landing) return;
    document.body.dataset.lp = '1';
    return () => {
      document.body.dataset.lp = '0';
    };
  }, [landing]);

  if (!page || page.pageType !== 'managed' || !page.locales.includes(language)) return <NotFound />;
  const route = findRoute(path, cmsFeed);
  const faq = page.sections.filter((s) => s.type === 'faq').flatMap((s) => faqPairs(s.content, language));

  return (
    <>
      <Seo page={route?.page ?? 'cms'} path={path} faq={faq.length ? faq : undefined} />
      {!landing && page.seo[language]?.breadcrumbs?.length !== 0 && (
        <div className="wrap cms-crumbs">
          <Breadcrumbs path={path} />
        </div>
      )}
      <PageRenderer page={page} lang={language} />
    </>
  );
}
