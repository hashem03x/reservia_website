import { Fragment, useLayoutEffect, useSyncExternalStore, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Shell } from '../Shell';
import { env } from '../config/env';
import { visualStore } from './store';
import { buildVisualCss, cleanVisual } from './visual';
import { leavePreview, setEditorStage, type EditorMode } from './mode';

/**
 * Boot for the Visual Editor iframe and the signed draft preview. Loads the DRAFT visual
 * configuration through the token (GET <api>/website/public/visual-preview/:token - the token is
 * the only credential; nothing is stored in the page), renders the real site with it, and in the
 * editor starts the selection bridge (bridge.ts) that talks to the dashboard.
 */
let savedScroll = 0;
visualStore.subscribe(() => {
  if (typeof window !== 'undefined') savedScroll = window.scrollY;
});

/** Content edits re-render the site (fresh tree); style edits only swap the stylesheet. */
function Remount({ children }: { children: ReactNode }) {
  const v = useSyncExternalStore(visualStore.subscribe, visualStore.contentVersion, visualStore.contentVersion);
  useLayoutEffect(() => {
    if (v) window.scrollTo(0, savedScroll);
  }, [v]);
  return <Fragment key={v}>{children}</Fragment>;
}

function PreviewBar({ expiresAt }: { expiresAt: string | null }) {
  const ar = document.documentElement.lang === 'ar';
  return (
    <div className="ve-preview-bar" role="status" data-testid="ve-preview-bar">
      <span>{ar ? 'معاينة تصميم المسودة - لا يراها الزوار قبل النشر.' : 'Draft design preview - visitors do not see this until it is published.'}</span>
      {expiresAt && <span> · {new Date(expiresAt).toLocaleTimeString(ar ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}</span>}
      <button type="button" onClick={leavePreview}>
        {ar ? 'إنهاء المعاينة' : 'Exit preview'}
      </button>
    </div>
  );
}

function fail(container: HTMLElement, message: string, mode: EditorMode) {
  container.innerHTML = '';
  const box = document.createElement('div');
  box.className = 've-boot-error';
  box.setAttribute('data-testid', 've-boot-error');
  box.textContent = message;
  container.appendChild(box);
  if (mode.kind === 'edit') setEditorStage('error', message);
}

export async function bootEditor(mode: EditorMode, container: HTMLElement) {
  if (!env.cmsApiUrl) return fail(container, 'This website build has no dashboard API address (VITE_CMS_API_URL is not set at build time), so it cannot load the draft.', mode);
  setEditorStage('loading-draft');
  let data: { config: unknown; editorOrigin: string; expiresAt: string | null };
  try {
    const res = await fetch(`${env.cmsApiUrl}/website/public/visual-preview/${encodeURIComponent(mode.token)}`, { cache: 'no-store', credentials: 'omit' });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.data) throw new Error(body?.message || `HTTP ${res.status}`);
    data = body.data;
  } catch (err) {
    const m = (err as Error).message || '';
    // A network/CORS refusal surfaces as a bare TypeError ("Failed to fetch").
    const why = /fetch|network|load failed/i.test(m) ? `The website could not reach the dashboard API at ${env.cmsApiUrl} (offline, or this website address is not allowed by the API's CORS settings).` : m || 'The draft could not be loaded.';
    return fail(container, why, mode);
  }
  setEditorStage('rendering');
  visualStore.set(cleanVisual(data.config));

  // The published stylesheet is replaced by the draft's, kept in sync with every change.
  document.getElementById('ve-css')?.remove();
  const style = document.createElement('style');
  style.id = 've-live';
  document.head.appendChild(style);
  const paint = () => {
    style.textContent = buildVisualCss(visualStore.config);
  };
  paint();
  visualStore.subscribe(paint);

  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex, nofollow';
  document.head.appendChild(robots);

  container.innerHTML = '';
  createRoot(container).render(
    <>
      <Remount>
        <Shell router={BrowserRouter} />
      </Remount>
      {mode.kind === 'preview' && <PreviewBar expiresAt={data.expiresAt} />}
    </>,
  );
  if (mode.kind === 'edit') {
    const { startBridge } = await import('./bridge');
    if (!data.editorOrigin) return fail(container, 'The editor link does not name the dashboard it belongs to. Open the Visual Editor again.', mode);
    startBridge(data.editorOrigin);
    setEditorStage('ready');
  }
}
