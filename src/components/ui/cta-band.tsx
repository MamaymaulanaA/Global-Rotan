import type { ReactNode } from 'react';

export function CtaBand({ title, text, actions }: { title: string; text?: string; actions: ReactNode }) {
  return (
    <section className="section-y">
      <div className="container-page">
        <div className="on-dark flex flex-col gap-8 rounded-lg bg-espresso px-6 py-12 text-canvas/80 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          <div className="max-w-xl">
            <h2 className="text-h2 !text-canvas" data-reveal>
              {title}
            </h2>
            {text && (
              <p className="text-lead mt-3" data-reveal>
                {text}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row" data-reveal>
            {actions}
          </div>
        </div>
      </div>
    </section>
  );
}
