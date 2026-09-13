'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PriceDisplayType } from '@/types/domain';

export interface InquiryItem {
  key: string;
  product_id: string;
  slug: string;
  sku: string;
  variant_sku?: string | null;
  name_en: string;
  name_id: string;
  image_url: string | null;
  color_id: string | null;
  color_name_en: string | null;
  color_name_id: string | null;
  color_hex: string | null;
  size_id: string | null;
  size_label_en: string | null;
  size_label_id: string | null;
  finishing: string;
  /** Indonesian label of the chosen finishing (the English label is the key). */
  finishing_id?: string | null;
  quantity: number;
  note: string;
  unit_price_usd: number | null;
  price_idr: number | null;
  price_display_type: PriceDisplayType;
  moq: number;
  added_at: number;
}

export type NewInquiryItem = Omit<InquiryItem, 'key' | 'added_at'>;

export const itemKey = (item: Pick<InquiryItem, 'product_id' | 'color_id' | 'size_id' | 'finishing'>) =>
  [item.product_id, item.color_id ?? '-', item.size_id ?? '-', item.finishing || '-'].join('|');

interface InquiryState {
  items: InquiryItem[];
  add: (item: NewInquiryItem) => 'added' | 'merged';
  update: (key: string, patch: Partial<NewInquiryItem>) => void;
  remove: (key: string) => InquiryItem | undefined;
  restore: (item: InquiryItem, index: number) => void;
  clear: () => void;
}

export const useInquiry = create<InquiryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (incoming) => {
        const key = itemKey(incoming);
        const existing = get().items.find((i) => i.key === key);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.key === key
                ? { ...i, ...incoming, key, quantity: Math.min(i.quantity + incoming.quantity, 100000), note: incoming.note || i.note }
                : i,
            ),
          });
          return 'merged';
        }
        set({ items: [...get().items, { ...incoming, key, added_at: Date.now() }].slice(-50) });
        return 'added';
      },
      update: (key, patch) => {
        const items = get().items;
        const current = items.find((i) => i.key === key);
        if (!current) return;
        const next = { ...current, ...patch };
        next.key = itemKey(next);
        // If the new variant already exists in the list, merge into it.
        const duplicate = items.find((i) => i.key === next.key && i.key !== key);
        if (duplicate) {
          set({
            items: items
              .filter((i) => i.key !== key)
              .map((i) => (i.key === next.key ? { ...i, quantity: Math.min(i.quantity + next.quantity, 100000), note: next.note || i.note } : i)),
          });
          return;
        }
        set({ items: items.map((i) => (i.key === key ? next : i)) });
      },
      remove: (key) => {
        const item = get().items.find((i) => i.key === key);
        set({ items: get().items.filter((i) => i.key !== key) });
        return item;
      },
      restore: (item, index) => {
        if (get().items.some((i) => i.key === item.key)) return;
        const items = [...get().items];
        items.splice(Math.min(index, items.length), 0, item);
        set({ items });
      },
      clear: () => set({ items: [] }),
    }),
    {
      name: 'gr-inquiry-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
