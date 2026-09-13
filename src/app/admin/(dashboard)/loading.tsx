/** Admin route skeleton: header, toolbar and content blocks with a quiet pulse. */
export default function AdminLoading() {
  const block = 'animate-pulse rounded-md bg-sand/80';
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 flex flex-col gap-4 lg:mb-8 lg:flex-row lg:items-end lg:justify-between" aria-hidden>
        <div className="space-y-2">
          <div className={`${block} h-8 w-48`} />
          <div className={`${block} h-4 w-72 max-w-full`} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <div className={`${block} h-11 sm:w-32`} />
          <div className={`${block} h-11 sm:w-32`} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="min-h-[10.5rem] rounded-lg border border-line bg-surface p-5">
            <div className={`${block} size-10`} />
            <div className={`${block} mt-4 h-3.5 w-24`} />
            <div className={`${block} mt-2 h-7 w-16`} />
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-line bg-surface" aria-hidden>
        <div className="border-b border-line px-5 py-4">
          <div className={`${block} h-4 w-40`} />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className={`${block} size-10 shrink-0`} />
              <div className="flex-1 space-y-2">
                <div className={`${block} h-3.5 w-1/2`} />
                <div className={`${block} h-3 w-1/3`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
