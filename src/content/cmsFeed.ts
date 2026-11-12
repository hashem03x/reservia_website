import feed from 'virtual:cms-feed';
import type { CmsFeed } from './cms';

/**
 * The CMS feed this build was made with (see content/cms.ts). Provided by vite.config.ts's
 * `virtual:cms-feed` module: the validated snapshot scripts/build-site.mjs fetched, or an empty
 * feed (the site's own text everywhere) when no CMS is configured. Prerendering and the browser
 * bundle embed the same value, so hydration never sees different head tags.
 */
export const cmsFeed: CmsFeed = feed;
