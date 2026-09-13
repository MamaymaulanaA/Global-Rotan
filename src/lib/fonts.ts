import { Fraunces, Work_Sans } from 'next/font/google';

// Only the `latin` subset is preloaded (English + Indonesian need nothing more); other
// scripts still get their @font-face and download on demand. WONK is left out because the
// design pins it to its default (0), which keeps the display font noticeably smaller.
export const fraunces = Fraunces({
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});
