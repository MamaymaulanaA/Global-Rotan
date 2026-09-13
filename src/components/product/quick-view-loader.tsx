'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useQuickView } from './use-quick-view';

const loadQuickView = () => import('./quick-view');

const QuickViewHost = dynamic(() => loadQuickView().then((mod) => mod.QuickViewHost), { ssr: false });

/** Warm the Quick View bundle when a visitor hovers or focuses a trigger. */
export function preloadQuickView() {
  void loadQuickView();
}

/**
 * Quick View (gallery, options, quantity…) is only downloaded the first time a visitor
 * opens it, instead of shipping with every page.
 */
export function QuickViewLoader() {
  const requested = useQuickView((s) => s.slug !== null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (requested) setMounted(true);
  }, [requested]);

  return mounted ? <QuickViewHost /> : null;
}
