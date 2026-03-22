import { useState, useEffect, useRef, useCallback } from 'react'
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js'
import type { SatRec } from 'satellite.js'
import type { TLE, SatellitePosition, SatelliteCategory, SatelliteTLEResponse } from '../types/satellites.ts'

const SATELLITES_API = 'http://localhost:3001/api/satellites'
const PROPAGATION_INTERVAL_MS = 2_000 // Update positions every 2 seconds
const TLE_POLL_INTERVAL_MS = 4 * 60 * 60 * 1000 // Re-fetch TLEs every 4 hours

// ── Types ────────────────────────────────────────────────────────────

/** Internal record pairing TLE metadata with a parsed satrec for propagation */
interface SatelliteRecord {
  id: string
  displayName: string
  category: SatelliteCategory
  satrec: SatRec
}

// ── TLE Fetching ─────────────────────────────────────────────────────

/** Fetch TLE data from the backend proxy */
async function fetchTLEs(): Promise<TLE[]> {
  try {
    const response = await fetch(SATELLITES_API)
    if (!response.ok) {
      throw new Error(`Satellite API returned status ${response.status}`)
    }
    const data = (await response.json()) as SatelliteTLEResponse
    return data.tles
  } catch (error) {
    console.warn('[satellites] Failed to fetch TLE data:', error)
    return []
  }
}

// ── Propagation ──────────────────────────────────────────────────────

/** Parse TLE name field which encodes "NAME|category" */
function parseTLEName(tle: TLE): { displayName: string; category: SatelliteCategory } {
  const parts = tle.name.split('|')
  const displayName = parts[0].trim()
  const category = (parts[1] ?? 'science') as SatelliteCategory
  return { displayName, category }
}

/** Convert TLE array into SatelliteRecord array with parsed satrecs */
function buildSatelliteRecords(tles: TLE[]): SatelliteRecord[] {
  const records: SatelliteRecord[] = []

  for (const tle of tles) {
    try {
      const satrec = twoline2satrec(tle.line1, tle.line2)
      const { displayName, category } = parseTLEName(tle)

      // Use NORAD catalog number from line1 as stable ID
      const noradId = tle.line1.substring(2, 7).trim()

      records.push({
        id: `sat-${noradId}`,
        displayName,
        category,
        satrec,
      })
    } catch {
      // Skip TLEs that fail to parse
    }
  }

  return records
}

/** Propagate all satellite records to current positions */
function propagatePositions(records: SatelliteRecord[]): SatellitePosition[] {
  const now = new Date()
  const gmst = gstime(now)
  const positions: SatellitePosition[] = []

  for (const rec of records) {
    try {
      const result = propagate(rec.satrec, now)
      if (!result || typeof result.position === 'boolean') continue

      const positionEci = result.position
      const velocityEci = result.velocity

      // Convert ECI to geodetic (lat/lon/alt)
      const geodetic = eciToGeodetic(positionEci, gmst)

      const latitude = degreesLat(geodetic.latitude)
      const longitude = degreesLong(geodetic.longitude)
      const altitude = geodetic.height // already in km

      // Compute velocity magnitude in km/s
      const velocity = typeof velocityEci === 'boolean'
        ? 0
        : Math.sqrt(
            velocityEci.x ** 2 +
            velocityEci.y ** 2 +
            velocityEci.z ** 2,
          )

      // Skip invalid propagations
      if (
        !isFinite(latitude) ||
        !isFinite(longitude) ||
        !isFinite(altitude) ||
        altitude < 0
      ) {
        continue
      }

      positions.push({
        id: rec.id,
        name: rec.displayName,
        latitude,
        longitude,
        altitude,
        velocity,
        category: rec.category,
      })
    } catch {
      // Skip satellites that fail to propagate
    }
  }

  return positions
}

// ── React hook ─────────────────────────────────────────────────────────

export function useSatelliteFeed(): {
  satellites: SatellitePosition[]
  loading: boolean
  lastUpdate: Date | null
} {
  const [satellites, setSatellites] = useState<SatellitePosition[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const recordsRef = useRef<SatelliteRecord[]>([])

  /** Fetch TLEs and build satellite records */
  const loadTLEs = useCallback(async () => {
    const tles = await fetchTLEs()
    if (tles.length > 0) {
      recordsRef.current = buildSatelliteRecords(tles)
      // Immediately propagate after loading
      const positions = propagatePositions(recordsRef.current)
      setSatellites(positions)
      setLoading(false)
      setLastUpdate(new Date())
      console.log(`[satellites] Loaded ${recordsRef.current.length} satellite records`)
    } else if (recordsRef.current.length === 0) {
      setLoading(false)
    }
  }, [])

  // TLE fetch on mount + periodic re-fetch
  useEffect(() => {
    void loadTLEs()

    const id = setInterval(() => {
      void loadTLEs()
    }, TLE_POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [loadTLEs])

  // Propagation loop — update positions every 2 seconds
  useEffect(() => {
    const id = setInterval(() => {
      if (recordsRef.current.length === 0) return

      const positions = propagatePositions(recordsRef.current)
      setSatellites(positions)
      setLastUpdate(new Date())
    }, PROPAGATION_INTERVAL_MS)

    return () => clearInterval(id)
  }, [])

  return { satellites, loading, lastUpdate }
}
