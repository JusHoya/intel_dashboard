import { create } from 'zustand'
import type { FeedHealth } from '../types'

interface AppState {
  sessionStart: Date
  feedHealth: FeedHealth[]
  scanlinesEnabled: boolean
  toggleScanlines: () => void
  updateFeedHealth: (feedHealth: FeedHealth[]) => void
}

export const useAppStore = create<AppState>((set) => ({
  sessionStart: new Date(),
  feedHealth: [],
  scanlinesEnabled: true,
  toggleScanlines: () => set((state) => ({ scanlinesEnabled: !state.scanlinesEnabled })),
  updateFeedHealth: (feedHealth) => set({ feedHealth }),
}))
