import { lazy, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { cmsFeed } from '../content/cmsFeed';
import { managedPageFor } from '../content/cms';
import { splitPath } from '../content/seoHead';

const CmsPage = lazy(() => import('../pages/CmsPage'));

/**
 * A built-in route that an editor may have rebuilt in the CMS: when a MANAGED page is published at
 * this path, its sections render instead of the built-in page; otherwise the built-in page does.
 */
export function CmsRoute({ path, fallback }: { path: string; fallback: ReactNode }) {
  return managedPageFor(cmsFeed, path) ? <CmsPage path={path} /> : <>{fallback}</>;
}

/** The catch-all: a CMS-only page at this path, else the not-found page. */
export function CmsCatchAll({ fallback }: { fallback: ReactNode }) {
  const { pathname } = useLocation();
  const { path } = splitPath(pathname);
  return managedPageFor(cmsFeed, path) ? <CmsPage path={path} /> : <>{fallback}</>;
}
