import { create } from 'zustand'
import type { GlobeEntity } from '../types'

type ViewMode = 'terminal' | 'photorealistic'

/** Camera fly-to target set by the command bar or location search */
export interface FlyToTarget {
  latitude: number
  longitude: number
  label: string
}

const MAX_HISTORY = 20

interface GlobeState {
  selectedEntity: GlobeEntity | null
  globeReady: boolean
  hoveredFlightId: string | null
  hoveredFlightCallsign: string | null
  viewMode: ViewMode
  flyToTarget: FlyToTarget | null
  /** Recent locations visited via search/goto */
  locationHistory: FlyToTarget[]
  /** Pin markers dropped on the globe */
  pins: FlyToTarget[]
  /** Show OSM detail overlay (roads, borders, labels) */
  showDetailOverlay: boolean
  /** Show US state capital markers */
  showStateCapitals: boolean
  selectEntity: (entity: GlobeEntity) => void
  clearSelection: () => void
  setGlobeReady: (ready: boolean) => void
  setHoveredFlight: (id: string | null, callsign: string | null) => void
  setViewMode: (mode: ViewMode) => void
  toggleViewMode: () => void
  setFlyToTarget: (lat: number, lon: number, label: string) => void
  clearFlyToTarget: () => void
  toggleDetailOverlay: () => void
  toggleStateCapitals: () => void
}

export const useGlobeStore = create<GlobeState>((set) => ({
  selectedEntity: null,
  globeReady: false,
  hoveredFlightId: null,
  hoveredFlightCallsign: null,
  viewMode: 'terminal',
  flyToTarget: null,
  locationHistory: [],
  pins: [],
  showDetailOverlay: true,
  showStateCapitals: true,
  selectEntity: (entity) => set({ selectedEntity: entity }),
  clearSelection: () => set({ selectedEntity: null }),
  setGlobeReady: (ready) => set({ globeReady: ready }),
  setHoveredFlight: (id, callsign) =>
    set({ hoveredFlightId: id, hoveredFlightCallsign: callsign }),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleViewMode: () =>
    set((s) => ({
      viewMode: s.viewMode === 'terminal' ? 'photorealistic' : 'terminal',
    })),
  setFlyToTarget: (latitude, longitude, label) =>
    set((s) => {
      const entry = { latitude, longitude, label }
      // Deduplicate: remove if same label already in history
      const filtered = s.locationHistory.filter((h) => h.label !== label)
      const history = [entry, ...filtered].slice(0, MAX_HISTORY)
      // Add pin if not already present at these coords
      const hasPin = s.pins.some(
        (p) => Math.abs(p.latitude - latitude) < 0.0001 && Math.abs(p.longitude - longitude) < 0.0001,
      )
      return {
        flyToTarget: entry,
        locationHistory: history,
        pins: hasPin ? s.pins : [...s.pins, entry],
        viewMode: 'photorealistic', // Auto-engage 3D photo mode
      }
    }),
  clearFlyToTarget: () => set({ flyToTarget: null }),
  toggleDetailOverlay: () => set((s) => ({ showDetailOverlay: !s.showDetailOverlay })),
  toggleStateCapitals: () => set((s) => ({ showStateCapitals: !s.showStateCapitals })),
}))
