import { cmsFeed } from '../content/cmsFeed';

/**
 * Cookie consent (Website Settings > Cookie notice). When an administrator turned the notice on
 * with "load analytics only after the visitor accepts", tracking (GA4 / GTM / Meta Pixel / Google
 * Ads) starts only once the visitor accepts - on that page view or a later one. Otherwise it starts
 * immediately, as before. The choice is remembered in localStorage.
 */
const KEY = 'reservia_cookie_consent';
const EVENT = 'reservia:consent';

export const consentRequired = () => {
  const c = cmsFeed.settings?.cookieConsent;
  return !!c?.enabled && c.blockTrackingUntilConsent !== false;
};

export function consentChoice(): 'accepted' | 'declined' | null {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'accepted' || v === 'declined' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: 'accepted' | 'declined') {
  try {
    window.localStorage.setItem(KEY, choice);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: choice }));
}

export function startAnalyticsWhenAllowed(start: () => void) {
  if (!consentRequired() || consentChoice() === 'accepted') {
    start();
    return;
  }
  const onChoice = (e: Event) => {
    if ((e as CustomEvent).detail === 'accepted') {
      window.removeEventListener(EVENT, onChoice);
      start();
    }
  };
  window.addEventListener(EVENT, onChoice);
}
