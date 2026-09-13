'use client';

import { create } from 'zustand';

/** Single shared Quick View modal controlled from any product card. */
export const useQuickView = create<{
  slug: string | null;
  open: (slug: string) => void;
  close: () => void;
}>((set) => ({
  slug: null,
  open: (slug) => set({ slug }),
  close: () => set({ slug: null }),
}));
