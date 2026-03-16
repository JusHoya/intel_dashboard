/** Panel identifiers for the tiling layout */
export type PanelId = 'globe' | 'financial' | 'news' | 'signals'

/** Layout preset configurations */
export type LayoutPreset = 'default' | 'fullGlobe' | 'tradingFloor' | 'analystDesk' | 'newsRoom'

/** Data feed health status */
export type FeedStatus = 'online' | 'degraded' | 'offline'

/** Feed health indicator */
export interface FeedHealth {
  name: string
  status: FeedStatus
  lastUpdate: Date | null
}

/** Globe entity types that can be selected */
export type GlobeEntityType = 'country' | 'city' | 'flight' | 'satellite'

/** A selected entity on the globe */
export interface GlobeEntity {
  id: string
  type: GlobeEntityType
  name: string
  coordinates: {
    latitude: number
    longitude: number
  }
  metadata?: Record<string, unknown>
}
