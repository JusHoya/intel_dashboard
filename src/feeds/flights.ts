import { useState, useEffect, useRef, useCallback } from 'react'
import type { FlightState, FlightsResponse } from '../types/flights'

const FLIGHTS_API = 'http://localhost:3001/api/flights'
const POLL_INTERVAL_MS = 15_000

/**
 * A single timestamped snapshot of flight data from the server.
 */
export interface FlightSnapshot {
  flights: FlightState[]
  /** Server-reported timestamp (unix seconds) */
  timestamp: number
  /** Client-side Date.now() when this snapshot was received */
  receivedAt: number
}

/**
 * An interpolated flight position for smooth rendering.
 * Extends FlightState with interpolated lat/lon and a progress factor.
 */
export interface InterpolatedFlight extends FlightState {
  /** Interpolated longitude (may differ from raw snapshot value) */
  interpLongitude: number
  /** Interpolated latitude */
  interpLatitude: number
}

/** Fetch current flight data from the backend proxy */
export async function fetchFlights(): Promise<FlightState[]> {
  try {
    const response = await fetch(FLIGHTS_API)
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

// ── Interpolation math ─────────────────────────────────────────────────

/**
 * Linearly interpolate between two values.
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Interpolate longitude, handling the ±180° wrap-around.
 */
function lerpLongitude(a: number, b: number, t: number): number {
  let delta = b - a
  // Shortest-arc interpolation across the antimeridian
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  let result = a + delta * t
  // Normalise to [-180, 180]
  if (result > 180) result -= 360
  if (result < -180) result += 360
  return result
}

/**
 * Dead-reckon a flight's position from its last known state.
 * Uses velocity (m/s) and true_track (degrees clockwise from north).
 */
function deadReckon(
  flight: FlightState,
  elapsedSeconds: number,
): { lat: number; lon: number } {
  const lat = flight.latitude!
  const lon = flight.longitude!

  if (!flight.velocity || !flight.true_track || elapsedSeconds <= 0) {
    return { lat, lon }
  }

  const headingRad = (flight.true_track * Math.PI) / 180
  const distanceMeters = flight.velocity * elapsedSeconds

  // Approximate: 1 degree latitude ≈ 111,320 m
  const dLat = (Math.cos(headingRad) * distanceMeters) / 111_320
  const cosLat = Math.cos((lat * Math.PI) / 180)
  const dLon = cosLat !== 0
    ? (Math.sin(headingRad) * distanceMeters) / (111_320 * cosLat)
    : 0

  return {
    lat: lat + dLat,
    lon: lon + dLon,
  }
}

/**
 * Compute interpolated positions for all flights given two snapshots
 * and a display timestamp.
 *
 * The display runs BUFFER_DELAY_MS behind real-time so we always have
 * data "ahead" of the display cursor to interpolate towards.
 */
export function interpolateFlights(
  prev: FlightSnapshot | null,
  current: FlightSnapshot,
  displayTime: number, // Date.now()-based
): InterpolatedFlight[] {
  if (!prev) {
    // Only one snapshot — use raw positions
    return current.flights
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => ({
        ...f,
        interpLatitude: f.latitude!,
        interpLongitude: f.longitude!,
      }))
  }

  const spanMs = current.receivedAt - prev.receivedAt
  if (spanMs <= 0) {
    return current.flights
      .filter((f) => f.latitude !== null && f.longitude !== null)
      .map((f) => ({
        ...f,
        interpLatitude: f.latitude!,
        interpLongitude: f.longitude!,
      }))
  }

  // t ∈ [0, 1] — how far between prev and current we should render
  const t = Math.max(0, Math.min(1, (displayTime - prev.receivedAt) / spanMs))

  // Index previous flights by icao24 for O(1) lookup
  const prevMap = new Map<string, FlightState>()
  for (const f of prev.flights) {
    if (f.latitude !== null && f.longitude !== null) {
      prevMap.set(f.icao24, f)
    }
  }

  return current.flights
    .filter((f) => f.latitude !== null && f.longitude !== null)
    .map((f) => {
      const p = prevMap.get(f.icao24)

      if (p && p.latitude !== null && p.longitude !== null) {
        // Smooth interpolation between prev → current
        return {
          ...f,
          interpLatitude: lerp(p.latitude!, f.latitude!, t),
          interpLongitude: lerpLongitude(p.longitude!, f.longitude!, t),
        }
      }

      // New aircraft — dead-reckon backwards from current position
      const elapsed = (1 - t) * (spanMs / 1000)
      const dr = deadReckon(f, -elapsed)
      return {
        ...f,
        interpLatitude: lerp(dr.lat, f.latitude!, t),
        interpLongitude: lerpLongitude(dr.lon, f.longitude!, t),
      }
    })
}

// ── Buffer delay ───────────────────────────────────────────────────────
// Display runs this far behind real-time so we always interpolate
// *between* two known snapshots rather than extrapolating.
const BUFFER_DELAY_MS = POLL_INTERVAL_MS // one full poll interval behind

// ── React hook ─────────────────────────────────────────────────────────

export function useFlights(): {
  flights: InterpolatedFlight[]
  loading: boolean
  lastUpdate: Date | null
} {
  const [interpolated, setInterpolated] = useState<InterpolatedFlight[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // Snapshot ring-buffer (prev + current)
  const prevSnap = useRef<FlightSnapshot | null>(null)
  const curSnap = useRef<FlightSnapshot | null>(null)
  const animFrameRef = useRef<number>(0)

  const loadFlights = useCallback(async () => {
    const data = await fetchFlights()
    if (data.length === 0 && curSnap.current === null) {
      setLoading(false)
      return
    }
    if (data.length > 0) {
      // Rotate snapshots: current → previous, new data → current
      prevSnap.current = curSnap.current
      curSnap.current = {
        flights: data,
        timestamp: Math.floor(Date.now() / 1000),
        receivedAt: Date.now(),
      }
      setLoading(false)
      setLastUpdate(new Date())
    }
  }, [])

  // Animation loop — runs every frame, computes interpolated positions
  useEffect(() => {
    let running = true

    function tick() {
      if (!running) return

      const cur = curSnap.current
      if (cur) {
        const displayTime = Date.now() - BUFFER_DELAY_MS
        const result = interpolateFlights(prevSnap.current, cur, displayTime)
        setInterpolated(result)
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      running = false
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  // Polling loop
  useEffect(() => {
    void loadFlights()

    const id = setInterval(() => {
      void loadFlights()
    }, POLL_INTERVAL_MS)

    return () => clearInterval(id)
  }, [loadFlights])

  return { flights: interpolated, loading, lastUpdate }
}
