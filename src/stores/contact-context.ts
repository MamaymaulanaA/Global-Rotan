'use client';

import { create } from 'zustand';

/** Lets the product page hand a prefilled WhatsApp message to the floating contact button. */
export const useContactContext = create<{
  productMessage: string | null;
  setProductMessage: (message: string | null) => void;
}>((set) => ({
  productMessage: null,
  setProductMessage: (productMessage) => set({ productMessage }),
}));
