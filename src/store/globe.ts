import { create } from 'zustand'
import type { GlobeEntity } from '../types'

interface GlobeState {
  selectedEntity: GlobeEntity | null
  globeReady: boolean
  selectEntity: (entity: GlobeEntity) => void
  clearSelection: () => void
  setGlobeReady: (ready: boolean) => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  selectedEntity: null,
  globeReady: false,
  selectEntity: (entity) => set({ selectedEntity: entity }),
  clearSelection: () => set({ selectedEntity: null }),
  setGlobeReady: (ready) => set({ globeReady: ready }),
}))
