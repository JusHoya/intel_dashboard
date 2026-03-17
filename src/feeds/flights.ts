import { useState, useEffect, useRef, useCallback } from 'react'
import type { FlightState, FlightsResponse } from '../types/flights'

const FLIGHTS_API = 'http://localhost:3001/api/flights'
const POLL_INTERVAL_MS = 15_000

// ── Dead-reckoning math ──────────────────────────────────────────────

/**
 * Dead-reckon a position forward in time using velocity and heading.
 * Uses velocity (m/s) and true_track (degrees clockwise from north).
 */
function deadReckon(
  lat: number,
  lon: number,
  velocity: number | null,
  trueTrack: number | null,
  elapsedSeconds: number,
): { lat: number; lon: number } {
  if (!velocity || !trueTrack || elapsedSeconds <= 0) {
    return { lat, lon }
  }

  const headingRad = (trueTrack * Math.PI) / 180
  const distanceMeters = velocity * elapsedSeconds

  // 1 degree latitude ≈ 111,320 m
  const dLat = (Math.cos(headingRad) * distanceMeters) / 111_320
  const cosLat = Math.cos((lat * Math.PI) / 180)
  const dLon = cosLat !== 0
    ? (Math.sin(headingRad) * distanceMeters) / (111_320 * cosLat)
    : 0

  let newLon = lon + dLon
  // Normalise longitude to [-180, 180]
  if (newLon > 180) newLon -= 360
  if (newLon < -180) newLon += 360

  return {
    lat: Math.max(-90, Math.min(90, lat + dLat)),
    lon: newLon,
  }
}

// ── Types ────────────────────────────────────────────────────────────

/**
 * Internal record for a single tracked flight.
 * Stores the base position from the last snapshot and the time it was received
 * so we can dead-reckon forward from it on every frame.
 */
interface FlightRecord {
  state: FlightState
  /** Latitude at time of last snapshot */
  baseLat: number
  /** Longitude at time of last snapshot */
  baseLon: number
  /** Date.now() when this snapshot was received */
  baseTime: number
}

/**
 * An interpolated flight position for rendering.
 * Extends FlightState with dead-reckoned lat/lon.
 */
export interface InterpolatedFlight extends FlightState {
  interpLongitude: number
  interpLatitude: number
}

/** Bounding box for viewport-based queries */
export interface FlightBounds {
  lamin: number
  lomin: number
  lamax: number
  lomax: number
}

// ── Fetch ────────────────────────────────────────────────────────────

/** Fetch current flight data from the backend proxy */
export async function fetchFlights(bounds?: FlightBounds): Promise<FlightState[]> {
  try {
    let url = FLIGHTS_API
    if (bounds) {
      const params = new URLSearchParams({
        lamin: bounds.lamin.toFixed(2),
        lomin: bounds.lomin.toFixed(2),
        lamax: bounds.lamax.toFixed(2),
        lomax: bounds.lomax.toFixed(2),
      })
      url = `${FLIGHTS_API}?${params}`
    }
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Flight API returned status ${response.status}`)
    }
    const data = (await response.json()) as FlightsResponse
    return data.flights
  } catch (error) {
    console.warn('[flights] Failed to fetch flight data:', error)
    return []
  }
}

// ── Interpolation (dead-reckoning) ───────────────────────────────────

/**
 * Linearly interpolate between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolate longitude, handling the ±180° wrap-around.
 */
export function lerpLongitude(a: number, b: number, t: number): number {
  let delta = b - a
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  let result = a + delta * t
  if (result > 180) result -= 360
  if (result < -180) result += 360
  return result
}

// ── React hook ─────────────────────────────────────────────────────────

export function useFlights(bounds?: FlightBounds): {
  flights: InterpolatedFlight[]
  loading: boolean
  lastUpdate: Date | null
} {
  const [interpolated, setInterpolated] = useState<InterpolatedFlight[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Current tracked flights — keyed by icao24
  const flightsMapRef = useRef<Map<string, FlightRecord>>(new Map())
  const animFrameRef = useRef<number>(0)
  const boundsRef = useRef<FlightBounds | undefined>(bounds)
  boundsRef.current = bounds

  /** Ingest a new snapshot: update base positions for dead-reckoning */
  const ingestSnapshot = useCallback((flights: FlightState[]) => {
    const now = Date.now()
    const oldMap = flightsMapRef.current
    const newMap = new Map<string, FlightRecord>()

    for (const f of flights) {
      if (f.latitude == null || f.longitude == null) continue
      if (f.on_ground) continue // Skip grounded aircraft

      const old = oldMap.get(f.icao24)

      if (old) {
        // Existing flight — smooth correction:
        // Blend from the current dead-reckoned position to the new snapshot
        // over a short period, by setting the base to a point between
        // old dead-reckoned and new actual position
        const elapsed = (now - old.baseTime) / 1000
        const dr = deadReckon(old.baseLat, old.baseLon, old.state.velocity, old.state.true_track, elapsed)

        // Blend 70% new snapshot, 30% dead-reckoned (reduces pop-in)
        const blendedLat = lerp(dr.lat, f.latitude, 0.7)
        const blendedLon = lerpLongitude(dr.lon, f.longitude, 0.7)

        newMap.set(f.icao24, {
          state: f,
          baseLat: blendedLat,
          baseLon: blendedLon,
          baseTime: now,
        })
      } else {
        // New flight — use raw position
        newMap.set(f.icao24, {
          state: f,
          baseLat: f.latitude,
          baseLon: f.longitude,
          baseTime: now,
        })
      }
    }

    flightsMapRef.current = newMap
  }, [])

  // Animation loop — dead-reckon every flight forward on every frame
  useEffect(() => {
    let running = true

    function tick() {
      if (!running) return

      const now = Date.now()
      const map = flightsMapRef.current
      const results: InterpolatedFlight[] = []

      for (const [, record] of map) {
        const elapsedSec = (now - record.baseTime) / 1000

        // Cap dead-reckoning at 60 seconds to avoid flights drifting
        // absurdly if the API hasn't updated in a long time
        const cappedElapsed = Math.min(elapsedSec, 60)

        const { lat, lon } = deadReckon(
          record.baseLat,
          record.baseLon,
          record.state.velocity,
          record.state.true_track,
          cappedElapsed,
        )

        results.push({
          ...record.state,
          interpLatitude: lat,
          interpLongitude: lon,
        })
      }

      setInterpolated(results)
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Polling loop
  const loadFlights = useCallback(async () => {
    const data = await fetchFlights(boundsRef.current)
    if (data.length > 0) {
      ingestSnapshot(data)
      setLoading(false)
      setLastUpdate(new Date())
    } else if (flightsMapRef.current.size === 0) {
      setLoading(false)
    }
  }, [ingestSnapshot])

  useEffect(() => {
    void loadFlights()

    const id = setInterval(() => {
      void loadFlights()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [loadFlights])

  return { flights: interpolated, loading, lastUpdate }
}
