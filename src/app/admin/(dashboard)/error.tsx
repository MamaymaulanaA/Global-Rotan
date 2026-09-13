'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="flex flex-col items-center rounded-lg border border-line bg-surface px-4 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle className="size-5" aria-hidden />
      </span>
      <h1 className="mt-4 font-sans text-lg font-semibold text-ink">This page could not be loaded</h1>
      <p className="mt-1 max-w-md text-[0.9375rem] text-muted">A temporary problem stopped the data from loading. Your saved data is not affected.</p>
      {error.digest && <p className="mt-2 font-mono text-[0.75rem] text-muted">Ref: {error.digest}</p>}
      <Button variant="dark" size="sm" className="mt-6" icon={<RefreshCw className="size-4" aria-hidden />} onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
