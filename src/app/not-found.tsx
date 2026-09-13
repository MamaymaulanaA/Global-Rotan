import Link from 'next/link';
import { fraunces, workSans } from '@/lib/fonts';

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable}`}>
      <body className="flex min-h-dvh items-center justify-center bg-canvas px-6 text-center">
        <main>
          <p className="eyebrow">404</p>
          <h1 className="mt-3 text-h1">This page could not be found</h1>
          <p className="mx-auto mt-4 max-w-md">The page may have moved, or the link may be incorrect.</p>
          <Link href="/" className="mt-8 inline-flex min-h-12 items-center rounded-md bg-gold px-6 font-semibold text-ink hover:bg-gold-hover">
            Back to Home
          </Link>
        </main>
      </body>
    </html>
  );
}
