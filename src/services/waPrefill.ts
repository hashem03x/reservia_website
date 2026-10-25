import { useEffect, useSyncExternalStore } from 'react';
import type { QuoteFields } from '../content/whatsappMessages';

/**
 * Values the visitor has already entered on the current page (calculator
 * figure, form location / monthly bill), shared with the page-level WhatsApp
 * buttons (floating button, campaign sticky bar) so every CTA sends the same
 * approved message with whatever is known. Cleared when the page that
 * published it unmounts, so a figure never leaks onto another page.
 */
let current: QuoteFields | null = null;
const listeners = new Set<() => void>();

function publish(fields: QuoteFields | null) {
  current = fields;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Read the current page's prefill (null on the server and when nothing is known). */
export function useWaPrefill(): QuoteFields | null {
  return useSyncExternalStore(subscribe, () => current, () => null);
}

/** Publish this page's known location / monthly figure for the page-level WhatsApp buttons. */
export function usePublishWaPrefill(location = '', monthly = '') {
  useEffect(() => {
    publish(location || monthly ? { location, monthly } : null);
    return () => publish(null);
  }, [location, monthly]);
}
