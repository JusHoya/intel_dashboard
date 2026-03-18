import { create } from 'zustand'
import type { GlobeEntity } from '../types'

type ViewMode = 'terminal' | 'photorealistic'

interface GlobeState {
  selectedEntity: GlobeEntity | null
  globeReady: boolean
  hoveredFlightId: string | null
  hoveredFlightCallsign: string | null
  viewMode: ViewMode
  selectEntity: (entity: GlobeEntity) => void
  clearSelection: () => void
  setGlobeReady: (ready: boolean) => void
  setHoveredFlight: (id: string | null, callsign: string | null) => void
  toggleViewMode: () => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  selectedEntity: null,
  globeReady: false,
  hoveredFlightId: null,
  hoveredFlightCallsign: null,
  viewMode: 'terminal',
  selectEntity: (entity) => set({ selectedEntity: entity }),
  clearSelection: () => set({ selectedEntity: null }),
  setGlobeReady: (ready) => set({ globeReady: ready }),
  setHoveredFlight: (id, callsign) =>
    set({ hoveredFlightId: id, hoveredFlightCallsign: callsign }),
  toggleViewMode: () =>
    set((s) => ({
      viewMode: s.viewMode === 'terminal' ? 'photorealistic' : 'terminal',
    })),
}))
