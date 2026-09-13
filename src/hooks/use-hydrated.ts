'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** `false` during SSR and hydration, `true` afterwards — avoids mismatches for localStorage-backed UI. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
