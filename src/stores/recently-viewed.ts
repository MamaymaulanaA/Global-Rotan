'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface RecentlyViewedState {
  ids: string[];
  push: (id: string) => void;
}

export const useRecentlyViewed = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      ids: [],
      push: (id) => set({ ids: [id, ...get().ids.filter((x) => x !== id)].slice(0, 12) }),
    }),
    { name: 'gr-recently-viewed', storage: createJSONStorage(() => localStorage) },
  ),
);
