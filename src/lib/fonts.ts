import { Fraunces, Work_Sans } from 'next/font/google';

export const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  axes: ['SOFT', 'WONK', 'opsz'],
  variable: '--font-fraunces',
  display: 'swap',
});

export const workSans = Work_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-work-sans',
  display: 'swap',
});
