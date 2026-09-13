import type { ReactNode } from 'react';
import './globals.css';

// The <html> element is rendered by the locale layout and the admin layout.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
