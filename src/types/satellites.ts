/** Category of satellite for rendering differentiation */
export type SatelliteCategory = 'station' | 'starlink' | 'general'

/** Raw TLE data from the server */
export interface SatelliteTLE {
  name: string
  line1: string
  line2: string
  noradId: number
  category: SatelliteCategory
}

/** Response from the satellite TLE API endpoint */
export interface SatelliteTLEResponse {
  satellites: SatelliteTLE[]
  fetchedAt: number
}

/** Propagated satellite position at a given time */
export interface SatellitePosition {
  name: string
  noradId: number
  category: SatelliteCategory
  latitude: number   // degrees
  longitude: number  // degrees
  altitude: number   // kilometers
  velocity: number   // km/s magnitude
}

/** Orbit path point for polyline rendering */
export interface OrbitPoint {
  longitude: number  // degrees
  latitude: number   // degrees
  altitude: number   // kilometers (converted to meters for Cesium)
}
