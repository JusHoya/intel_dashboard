import { create } from 'zustand'
import type { IntelSignal, SignalCategory } from '../signals/types.ts'

interface SignalState {
  signals: IntelSignal[]
  selectedSignal: IntelSignal | null
  filterCategory: SignalCategory | null
  setSignals: (signals: IntelSignal[]) => void
  addSignals: (signals: IntelSignal[]) => void
  selectSignal: (signal: IntelSignal | null) => void
  setFilterCategory: (category: SignalCategory | null) => void
  resolveSignal: (id: string) => void
}

export const useSignalStore = create<SignalState>((set) => ({
  signals: [],
  selectedSignal: null,
  filterCategory: null,

  setSignals: (signals) => set({ signals }),

  addSignals: (newSignals) =>
    set((state) => {
      // Deduplicate by id
      const existingIds = new Set(state.signals.map((s) => s.id))
      const unique = newSignals.filter((s) => !existingIds.has(s.id))
      if (unique.length === 0) return state

      // Merge and keep sorted by timestamp (newest first), cap at 200 signals
      const merged = [...unique, ...state.signals]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 200)

      return { signals: merged }
    }),

  selectSignal: (signal) => set({ selectedSignal: signal }),

  setFilterCategory: (category) => set({ filterCategory: category }),

  resolveSignal: (id) =>
    set((state) => ({
      signals: state.signals.map((s) =>
        s.id === id ? { ...s, status: 'resolved' as const } : s,
      ),
      // Clear selection if resolved signal was selected
      selectedSignal:
        state.selectedSignal?.id === id
          ? { ...state.selectedSignal, status: 'resolved' as const }
          : state.selectedSignal,
    })),
}))
