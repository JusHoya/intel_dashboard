import { useState, useEffect, useRef } from 'react'
import type { FlightRoute } from '../types/flights'

const SERVER_BASE = 'http://localhost:3001'
const cache = new Map<string, FlightRoute>()

/**
 * Fetches the departure/arrival route for a given callsign.
 * Debounces requests by 200ms and caches results client-side.
 */
export function useFlightRoute(callsign: string | null): FlightRoute | null {
  const [route, setRoute] = useState<FlightRoute | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!callsign || callsign.trim().length === 0) {
      setRoute(null)
      return
    }

    const cs = callsign.trim()

    // Return from client cache immediately
    const cached = cache.get(cs)
    if (cached) {
      setRoute(cached)
      return
    }

    // Debounce 200ms before fetching
    timerRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `${SERVER_BASE}/api/flight-route?callsign=${encodeURIComponent(cs)}`,
        )
        if (!response.ok) {
          setRoute(null)
          return
        }
        const data = (await response.json()) as {
          departure: string | null
          arrival: string | null
        }

        const result: FlightRoute = {
          callsign: cs,
          departureIcao: data.departure,
          arrivalIcao: data.arrival,
        }

        cache.set(cs, result)
        setRoute(result)
      } catch {
        setRoute(null)
      }
    }, 200)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [callsign])

  return route
}
