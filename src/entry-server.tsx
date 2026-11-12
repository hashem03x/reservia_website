/* eslint-disable react/only-export-components -- build-time server entry, never hot-reloaded in a browser */
import type { ReactNode } from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import { Shell } from './Shell.tsx';

import { allRoutes } from './content/seoHead.ts';
import { cmsFeed } from './content/cmsFeed.ts';

export { ROUTES, routeLangs, sitemapXml, robotsTxt, HEAD_START, HEAD_END } from './content/seoHead.ts';
export { injectForPage } from './content/cmsInject.ts';
/** Every page to prerender: the built-in routes plus the CMS-only pages of this build's feed. */
export const BUILD_ROUTES = allRoutes(cmsFeed);
/** The validated CMS feed this build was made with (page-scoped custom code, landing layouts). */
export const CMS_FEED = cmsFeed;

/**
 * Build-time render of one URL (used only by scripts/prerender.mjs, never
 * shipped to browsers). prerenderToNodeStream waits for every lazy route
 * chunk and Suspense boundary, so the result is the complete page. React 19
 * hoists the page's <title>/<meta>/<link> tags to the start of the output;
 * the prerender script moves them into <head>.
 */
export async function render(url: string): Promise<string> {
  const Router = ({ children }: { children: ReactNode }) => <StaticRouter location={url}>{children}</StaticRouter>;
  const { prelude } = await prerenderToNodeStream(<Shell router={Router} />, {
    // By default React outlines any completed Suspense boundary larger than ~12 KB
    // (fallback + hidden content + inline swap script) for progressive streaming. For a
    // static file that only causes a layout shift and hides content from non-JS crawlers,
    // so every boundary is written inline.
    progressiveChunkSize: Number.POSITIVE_INFINITY,
    onError(error) {
      throw error instanceof Error ? error : new Error(String(error));
    },
  });
  let html = '';
  const decoder = new TextDecoder();
  // prerenderToNodeStream returns a Node Readable (async-iterable); typed here without Node types.
  for await (const chunk of prelude as unknown as AsyncIterable<string | Uint8Array>) html += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
  html += decoder.decode();
  return html;
}
