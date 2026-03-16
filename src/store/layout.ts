import { create } from 'zustand'
import type { LayoutPreset } from '../types'

interface LayoutState {
  preset: LayoutPreset
  setPreset: (preset: LayoutPreset) => void
}

export const useLayoutStore = create<LayoutState>((set) => ({
  preset: 'default',
  setPreset: (preset) => set({ preset }),
}))
