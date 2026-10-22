import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false while rendering on the server and during hydration, true right after.
 * Lets a component derive browser-only values (query string, router state,
 * <html lang>) without mismatching the prerendered HTML -- React re-renders
 * with the client snapshot immediately after hydrating, before paint.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
