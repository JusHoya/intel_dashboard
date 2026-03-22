/** Raw TLE (Two-Line Element) data from CelesTrak */
export interface TLE {
  name: string
  line1: string
  line2: string
}

/** Propagated satellite position at a given instant */
export interface SatellitePosition {
  id: string
  name: string
  latitude: number
  longitude: number
  altitude: number  // km
  velocity: number  // km/s
  category: SatelliteCategory
}

/** CelesTrak satellite group categories */
export type SatelliteCategory =
  | 'space-stations'
  | 'gps-ops'
  | 'weather'
  | 'science'
  | 'resource'

/** Server response shape for /api/satellites */
export interface SatelliteTLEResponse {
  tles: TLE[]
  fetchedAt: number
}
