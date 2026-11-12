import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { env } from '../config/env';
import { validatePreviewPage, type CmsPage } from '../content/cms';
import { PageRenderer } from '../cms/PageRenderer';
import '../cms/cms.css';

/**
 * Draft preview: /<lang>/__preview?token=... renders ONE page's current draft with the website's
 * real section components. The token is a short-lived signed grant minted by an authenticated
 * dashboard user (backend utils/website/previewToken.js); without a valid one the API returns
 * nothing. The page is never prerendered, never cached, never indexed (noindex + robots.txt).
 */
type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; page: CmsPage; expiresAt: string | null };

export default function CmsPreview() {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<State>({ status: 'loading' });
  const ar = language === 'ar';

  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: ar ? 'رابط المعاينة غير مكتمل.' : 'This preview link is incomplete.' });
      return;
    }
    if (!env.cmsApiUrl) {
      setState({ status: 'error', message: ar ? 'المعاينة غير متاحة في هذا الإصدار من الموقع.' : 'Previews are not available on this build of the website.' });
      return;
    }
    const ctrl = new AbortController();
    fetch(`${env.cmsApiUrl}/website/public/preview/${encodeURIComponent(token)}`, { signal: ctrl.signal, credentials: 'omit', cache: 'no-store' })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.message || `HTTP ${res.status}`);
        const v = validatePreviewPage(body);
        setState({ status: 'ready', page: v.page, expiresAt: v.expiresAt });
      })
      .catch((err: unknown) => {
        if ((err as Error)?.name === 'AbortError') return;
        setState({ status: 'error', message: (err as Error)?.message || (ar ? 'تعذر تحميل المعاينة.' : 'Could not load the preview.') });
      });
    return () => ctrl.abort();
  }, [token, ar]);

  return (
    <>
      <Helmet>
        <title>{ar ? 'معاينة مسودة | ريزيرفيا' : 'Draft preview | Reservia'}</title>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <div className="cms-preview-bar" role="status" data-testid="preview-banner">
        {ar ? 'معاينة مسودة - هذه الصفحة ليست منشورة بهذا الشكل.' : 'Draft preview - this is not what visitors see until it is published.'}
        {state.status === 'ready' && state.expiresAt && (
          <span>
            {' '}
            · {ar ? 'ينتهي الرابط' : 'Link expires'} {new Date(state.expiresAt).toLocaleTimeString(ar ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      {state.status === 'loading' && (
        <section className="band">
          <div className="wrap" style={{ minHeight: '40vh' }}>
            <h1>{ar ? 'جاري تحميل المعاينة…' : 'Loading preview…'}</h1>
          </div>
        </section>
      )}
      {state.status === 'error' && (
        <section className="band">
          <div className="wrap" style={{ maxWidth: 620 }}>
            <h1>{ar ? 'تعذر عرض المعاينة' : 'The preview could not be shown'}</h1>
            <p className="lead" data-testid="preview-error">
              {state.message}
            </p>
            <Link className="btn ghost" to={`/${language}`}>
              {ar ? 'الصفحة الرئيسية' : 'Home page'}
            </Link>
          </div>
        </section>
      )}
      {state.status === 'ready' &&
        (state.page.pageType === 'managed' ? (
          state.page.locales.includes(language) ? (
            <PageRenderer page={state.page} lang={language} />
          ) : (
            <section className="band">
              <div className="wrap">
                <h1>{ar ? 'هذه الصفحة غير متاحة بهذه اللغة' : 'This page has no version in this language'}</h1>
                <Link className="btn sun" to={`/${language === 'ar' ? 'en' : 'ar'}/__preview?token=${encodeURIComponent(token)}`}>
                  {ar ? 'عرض النسخة الإنجليزية' : 'Show the Arabic version'}
                </Link>
              </div>
            </section>
          )
        ) : (
          <section className="band">
            <div className="wrap" style={{ maxWidth: 680 }}>
              <h1>{state.page.seo[language]?.title || state.page.slug}</h1>
              <p className="lead">{state.page.seo[language]?.description}</p>
              <p>{ar ? 'هذه صفحة مدمجة في الموقع؛ محتواها لا يتغير من لوحة التحكم. يظهر أعلاه عنوانها ووصفها في محركات البحث كما في المسودة.' : 'This is a built-in website page; its body is not edited in the dashboard. Shown above: its search title and description as in the draft.'}</p>
            </div>
          </section>
        ))}
    </>
  );
}
