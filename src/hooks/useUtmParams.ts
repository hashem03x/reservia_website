import { useEffect, useState } from 'react';

const STORAGE_KEY = 'rsv_utm';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'] as const;

export type UtmParams = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Captures campaign params on first load of a session; ported from the template's UTM capture block. */
function captureUtm(): UtmParams {
  let utm: UtmParams = {};
  try {
    utm = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    const q = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach((key) => {
      const value = q.get(key);
      if (value) utm[key] = value;
    });
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
  } catch {
    // sessionStorage unavailable (private mode, etc.) -- proceed without UTM context
  }
  return utm;
}

/** Non-hook accessor for use outside components (analytics click handlers). */
export function getStoredUtm(): UtmParams {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function useUtmParams(): UtmParams {
  const [utm, setUtm] = useState<UtmParams>({});
  useEffect(() => {
    setUtm(captureUtm());
  }, []);
  return utm;
}
