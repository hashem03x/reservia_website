/**
 * Whether this page load is the dashboard's Visual Editor (`?__ve=<token>`, inside the dashboard's
 * iframe) or a signed draft preview (`?__vp=<token>`, a normal tab). Both are opt-in by a signed,
 * short-lived token minted by an authenticated dashboard user; neither changes anything for
 * visitors. A draft preview keeps its token for the tab so in-site navigation stays in preview.
 */
export interface EditorMode {
  kind: 'edit' | 'preview';
  token: string;
}

let mode: EditorMode | null | undefined;

export function detectEditorMode(): EditorMode | null {
  if (mode !== undefined) return mode;
  mode = null;
  if (typeof window === 'undefined') return mode;
  const params = new URLSearchParams(window.location.search);
  const ve = params.get('__ve');
  const vp = params.get('__vp');
  try {
    if (vp) window.sessionStorage.setItem('reservia_vp', vp);
  } catch {
    /* private mode */
  }
  let stored: string | null = null;
  try {
    stored = window.sessionStorage.getItem('reservia_vp');
  } catch {
    stored = null;
  }
  if (ve && window.parent !== window) mode = { kind: 'edit', token: ve };
  else if (vp || stored) mode = { kind: 'preview', token: (vp || stored) as string };
  return mode;
}

export const isEditorMode = () => !!detectEditorMode();

export function leavePreview() {
  try {
    window.sessionStorage.removeItem('reservia_vp');
  } catch {
    /* ignore */
  }
  const url = new URL(window.location.href);
  url.searchParams.delete('__vp');
  window.location.replace(url.toString());
}

/**
 * Editor canvas status beacon. The dashboard pings the canvas iframe until it is ready; the page
 * answers with its boot stage only (no content, no tokens - so it can answer any parent), which lets
 * the dashboard tell "this website build has no editor", "the draft could not be loaded" and
 * "redirected to another domain" apart instead of waiting forever.
 */
type Stage = 'booting' | 'loading-draft' | 'rendering' | 'ready' | 'error';
let stage: Stage = 'booting';
let stageDetail = '';
let beacon = false;

function announce() {
  if (typeof window === 'undefined' || window.parent === window) return;
  window.parent.postMessage({ type: 've:pong', editor: 1, stage, detail: stageDetail, page: window.location.pathname }, '*');
}

export function setEditorStage(next: Stage, detail = '') {
  stage = next;
  stageDetail = detail.slice(0, 300);
  announce();
}

export function installEditorBeacon() {
  if (beacon || typeof window === 'undefined') return;
  beacon = true;
  window.addEventListener('message', (e) => {
    if (e.source === window.parent && e.data && e.data.type === 've:ping') announce();
  });
  announce();
}
