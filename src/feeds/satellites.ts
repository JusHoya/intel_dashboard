import { useState, useEffect, useRef, useCallback } from 'react'
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLong,
  degreesLat,
} from 'satellite.js'
import type { SatRec } from 'satellite.js'
import type {
  SatelliteTLE,
  SatelliteTLEResponse,
  SatellitePosition,
  SatelliteCategory,
  OrbitPoint,
} from '../types/satellites'

const SATELLITES_API = 'http://localhost:3001/api/satellites/tle'
const TLE_REFRESH_MS = 3_600_000 // Re-fetch TLEs every hour
const PROPAGATION_INTERVAL_MS = 2_000 // Re-propagate positions every 2 seconds

// -- Parsed satellite record for propagation ----------------------------------

interface ParsedSatellite {
  name: string
  noradId: number
  category: SatelliteCategory
  satrec: SatRec
}

// -- TLE fetch ----------------------------------------------------------------

async function fetchTLEs(): Promise<SatelliteTLE[]> {
  try {
    const response = await fetch(SATELLITES_API)
    if (!response.ok) {
      throw new Error(`Satellite API returned status ${response.status}`)
    }
    const data = (await response.json()) as SatelliteTLEResponse
    return data.satellites
  } catch (error) {
    console.warn('[satellites] Failed to fetch TLE data:', error)
    return []
  }
}

// -- Propagation helpers ------------------------------------------------------

/**
 * Propagate a satellite to the given date, returning geodetic position.
 * Returns null if propagation fails (e.g., decayed satellite).
 */
function propagateSatellite(
  sat: ParsedSatellite,
  date: Date,
): SatellitePosition | null {
  const result = propagate(sat.satrec, date)
  if (!result) return null

  const positionEci = result.position
  const gmst = gstime(date)
  const geodetic = eciToGeodetic(positionEci, gmst)

  const longitude = degreesLong(geodetic.longitude)
  const latitude = degreesLat(geodetic.latitude)
  const altitude = geodetic.height // km

  // Sanity check — reject obviously invalid positions
  if (
    isNaN(longitude) || isNaN(latitude) || isNaN(altitude) ||
    Math.abs(latitude) > 90 || altitude < 0 || altitude > 100000
  ) {
    return null
  }

  // Velocity magnitude from ECI velocity vector
  const vel = result.velocity
  const velocity = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)

  return {
    name: sat.name,
    noradId: sat.noradId,
    category: sat.category,
    latitude,
    longitude,
    altitude,
    velocity,
  }
}

/**
 * Compute orbit path points for a satellite over a given duration.
 * Propagates at regular intervals, computing GMST for each time step.
 *
 * @param sat - Parsed satellite record
 * @param durationMinutes - How far forward to propagate (default: 90 min ~ 1 LEO orbit)
 * @param stepMinutes - Time between points (default: 1 minute)
 * @returns Array of orbit points in geodetic coordinates
 */
export function computeOrbitPath(
  sat: ParsedSatellite,
  durationMinutes = 90,
  stepMinutes = 1,
): OrbitPoint[] {
  const points: OrbitPoint[] = []
  const now = new Date()

  for (let t = 0; t <= durationMinutes; t += stepMinutes) {
    const date = new Date(now.getTime() + t * 60_000)
    const result = propagate(sat.satrec, date)
    if (!result) continue

    // Compute GMST for THIS specific time step
    const gmst = gstime(date)
    const geodetic = eciToGeodetic(result.position, gmst)

    const lon = degreesLong(geodetic.longitude)
    const lat = degreesLat(geodetic.latitude)
    const alt = geodetic.height

    if (isNaN(lon) || isNaN(lat) || isNaN(alt)) continue

    points.push({ longitude: lon, latitude: lat, altitude: alt })
  }

  return points
}

// -- ISS detection ------------------------------------------------------------

/** NORAD catalog number for ISS (ZARYA) */
const ISS_NORAD_ID = 25544

export function isISS(sat: { name: string; noradId: number }): boolean {
  if (sat.noradId === ISS_NORAD_ID) return true
  const upper = sat.name.toUpperCase()
  return upper.includes('ISS') || upper.includes('ZARYA')
}

// -- React hook ---------------------------------------------------------------

export interface UseSatellitesResult {
  positions: SatellitePosition[]
  loading: boolean
  lastUpdate: Date | null
  /** Get orbit path for a specific satellite by NORAD ID */
  getOrbitPath: (noradId: number) => OrbitPoint[]
}

export function useSatellites(): UseSatellitesResult {
  const [positions, setPositions] = useState<SatellitePosition[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const parsedSatsRef = useRef<ParsedSatellite[]>([])

  // Parse TLEs into satrec objects
  const ingestTLEs = useCallback((tles: SatelliteTLE[]) => {
    const parsed: ParsedSatellite[] = []

    for (const tle of tles) {
      try {
        const satrec = twoline2satrec(tle.line1, tle.line2)
        parsed.push({
          name: tle.name,
          noradId: tle.noradId,
          category: tle.category,
          satrec,
        })
      } catch {
        // Skip satellites with invalid TLEs
      }
    }

    parsedSatsRef.current = parsed
    console.log(`[satellites] Parsed ${parsed.length} satellite TLEs`)
  }, [])

  // Propagate all satellites to current time
  const propagateAll = useCallback(() => {
    const now = new Date()
    const results: SatellitePosition[] = []

    for (const sat of parsedSatsRef.current) {
      const pos = propagateSatellite(sat, now)
      if (pos) results.push(pos)
    }

    setPositions(results)
    setLastUpdate(now)
  }, [])

  // Get orbit path for a specific satellite
  const getOrbitPath = useCallback((noradId: number): OrbitPoint[] => {
    const sat = parsedSatsRef.current.find((s) => s.noradId === noradId)
    if (!sat) return []
    return computeOrbitPath(sat)
  }, [])

  // Initial TLE fetch + periodic refresh
  useEffect(() => {
    let mounted = true

    async function loadTLEs() {
      const tles = await fetchTLEs()
      if (!mounted || tles.length === 0) {
        setLoading(false)
        return
      }
      ingestTLEs(tles)
      propagateAll()
      setLoading(false)
    }

    void loadTLEs()

    const refreshId = setInterval(() => {
      void loadTLEs()
    }, TLE_REFRESH_MS)

    return () => {
      mounted = false
      clearInterval(refreshId)
    }
  }, [ingestTLEs, propagateAll])

  // Periodic propagation (positions update as Earth rotates and sats move)
  useEffect(() => {
    if (parsedSatsRef.current.length === 0) return

    const id = setInterval(propagateAll, PROPAGATION_INTERVAL_MS)
    return () => clearInterval(id)
  }, [propagateAll, positions.length]) // Re-start when sats are loaded

  return { positions, loading, lastUpdate, getOrbitPath }
}
