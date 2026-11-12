import { useEffect, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { cmsFeed } from '../content/cmsFeed';
import { consentChoice, setConsent } from './consent';
import { CmsLink } from './CmsLink';

/** The cookie notice configured in Website Settings; nothing renders when it is switched off. */
export function CookieNotice() {
  const { language } = useLanguage();
  const c = cmsFeed.settings?.cookieConsent;
  // Rendered only after mount: the choice lives in the browser, never in the prerendered HTML.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (c?.enabled && !consentChoice()) setVisible(true);
  }, [c?.enabled]);
  if (!c?.enabled || !visible) return null;
  const ar = language === 'ar';
  const message = (ar ? c.messageAr || c.messageEn : c.messageEn || c.messageAr) || '';
  const accept = (ar ? c.acceptLabelAr || c.acceptLabelEn : c.acceptLabelEn || c.acceptLabelAr) || (ar ? 'موافق' : 'Accept');
  return (
    <div className="cms-cookie" role="dialog" aria-live="polite" aria-label={ar ? 'ملفات تعريف الارتباط' : 'Cookies'}>
      <p>
        {message}{' '}
        {c.policyUrl && (
          <CmsLink href={c.policyUrl} lang={language}>
            {ar ? 'سياسة الخصوصية' : 'Privacy policy'}
          </CmsLink>
        )}
      </p>
      <div className="cta-row" style={{ marginTop: 0 }}>
        {c.blockTrackingUntilConsent !== false && (
          <button
            type="button"
            className="btn ghost"
            onClick={() => {
              setConsent('declined');
              setVisible(false);
            }}
          >
            {ar ? 'رفض' : 'Decline'}
          </button>
        )}
        <button
          type="button"
          className="btn sun"
          onClick={() => {
            setConsent('accepted');
            setVisible(false);
          }}
        >
          {accept}
        </button>
      </div>
    </div>
  );
}
