'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FavoritesState {
  ids: string[];
  toggle: (id: string) => boolean;
  remove: (id: string) => void;
  clear: () => void;
  prune: (validIds: string[]) => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const exists = get().ids.includes(id);
        set({ ids: exists ? get().ids.filter((x) => x !== id) : [id, ...get().ids].slice(0, 100) });
        return !exists;
      },
      remove: (id) => set({ ids: get().ids.filter((x) => x !== id) }),
      clear: () => set({ ids: [] }),
      prune: (validIds) => set({ ids: get().ids.filter((id) => validIds.includes(id)) }),
    }),
    {
      name: 'gr-favorites',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
