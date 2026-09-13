import { Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { Notice } from './misc';
import { PageHeader } from './page-header';
import type { Locale } from '@/types/domain';

/** Long-form information page (policies, terms, shipping). */
export async function DocumentPage({
  locale,
  crumb,
  eyebrow,
  title,
  intro,
  updated,
  sections,
  note,
  footer,
}: {
  locale: Locale;
  crumb: string;
  eyebrow?: string;
  title: string;
  intro: string;
  updated: string;
  sections: { title: string; body: string }[];
  note?: string;
  footer?: ReactNode;
}) {
  return (
    <>
      <PageHeader locale={locale} crumbs={[{ label: crumb }]} eyebrow={eyebrow} title={title} description={intro}>
        <p className="mt-4 text-[0.875rem] text-muted">{updated}</p>
      </PageHeader>
      <div className="container-narrow py-12 lg:py-16">
        {note && (
          <Notice tone="info" icon={<Info className="size-4" aria-hidden />} className="mb-10">
            {note}
          </Notice>
        )}
        <nav aria-label={title} className="mb-10 rounded-md border border-line bg-surface p-5">
          <ol className="grid gap-1 text-[0.9375rem] sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.title}>
                <a href={`#section-${index + 1}`} className="inline-flex min-h-11 items-center gap-2 text-ink-soft hover:text-ink">
                  <span className="text-[0.8125rem] tabular-nums text-muted">{String(index + 1).padStart(2, '0')}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="space-y-10">
          {sections.map((section, index) => (
            <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-40">
              <h2 className="text-h3">
                <span className="mr-2 text-gold-ink">{index + 1}.</span>
                {section.title}
              </h2>
              <p className="mt-3 leading-relaxed">{section.body}</p>
            </section>
          ))}
        </div>
        {footer}
      </div>
    </>
  );
}
