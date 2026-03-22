import { create } from 'zustand'
import type { GlobeEntity } from '../types'

type ViewMode = 'terminal' | 'photorealistic'

/** Camera fly-to target set by the command bar */
interface FlyToTarget {
  latitude: number
  longitude: number
  label: string
}

interface GlobeState {
  selectedEntity: GlobeEntity | null
  globeReady: boolean
  hoveredFlightId: string | null
  hoveredFlightCallsign: string | null
  viewMode: ViewMode
  flyToTarget: FlyToTarget | null
  selectEntity: (entity: GlobeEntity) => void
  clearSelection: () => void
  setGlobeReady: (ready: boolean) => void
  setHoveredFlight: (id: string | null, callsign: string | null) => void
  toggleViewMode: () => void
  setFlyToTarget: (lat: number, lon: number, label: string) => void
  clearFlyToTarget: () => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  selectedEntity: null,
  globeReady: false,
  hoveredFlightId: null,
  hoveredFlightCallsign: null,
  viewMode: 'terminal',
  flyToTarget: null,
  selectEntity: (entity) => set({ selectedEntity: entity }),
  clearSelection: () => set({ selectedEntity: null }),
  setGlobeReady: (ready) => set({ globeReady: ready }),
  setHoveredFlight: (id, callsign) =>
    set({ hoveredFlightId: id, hoveredFlightCallsign: callsign }),
  toggleViewMode: () =>
    set((s) => ({
      viewMode: s.viewMode === 'terminal' ? 'photorealistic' : 'terminal',
    })),
  setFlyToTarget: (latitude, longitude, label) =>
    set({ flyToTarget: { latitude, longitude, label } }),
  clearFlyToTarget: () => set({ flyToTarget: null }),
}))
