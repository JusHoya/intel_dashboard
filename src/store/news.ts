import { create } from 'zustand'
import type { NewsItem, NewsViewMode, NewsFilter } from '../types/news'

interface NewsState {
  /** All fetched news items */
  items: NewsItem[]
  /** Active filter (country/topic) */
  filter: NewsFilter
  /** Current view mode */
  viewMode: NewsViewMode
  /** Selected YouTube channel ID */
  selectedChannelId: string | null
  /** Whether a fetch is in progress */
  loading: boolean

  // Actions
  setItems: (items: NewsItem[]) => void
  setFilter: (filter: Partial<NewsFilter>) => void
  clearFilter: () => void
  setViewMode: (mode: NewsViewMode) => void
  selectChannel: (channelId: string) => void
  setLoading: (loading: boolean) => void
}

export const useNewsStore = create<NewsState>((set) => ({
  items: [],
  filter: { country: null, topic: null },
  viewMode: 'feed',
  selectedChannelId: null,
  loading: false,

  setItems: (items) => set({ items }),

  setFilter: (partial) =>
    set((state) => ({
      filter: { ...state.filter, ...partial },
    })),

  clearFilter: () => set({ filter: { country: null, topic: null } }),

  setViewMode: (viewMode) => set({ viewMode }),

  selectChannel: (selectedChannelId) => set({ selectedChannelId }),

  setLoading: (loading) => set({ loading }),
}))
