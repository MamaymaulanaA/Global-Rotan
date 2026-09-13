import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { fraunces, workSans } from '@/lib/fonts';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s · Global Rotan Admin' },
  robots: { index: false, follow: false },
  icons: { icon: '/icon.svg' },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${workSans.variable}`}>
      <body className="bg-[#f6f3ee]">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast: '!rounded-md !border-line !bg-surface !text-ink !font-sans !shadow-none',
              description: '!text-muted',
            },
          }}
        />
      </body>
    </html>
  );
}
