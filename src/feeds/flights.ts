import { useState, useEffect, useRef, useCallback } from 'react'
import type { FlightState, FlightsResponse } from '../types/flights'

const FLIGHTS_API = 'http://localhost:3001/api/flights'
const POLL_INTERVAL_MS = 15_000

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

/** Hook that polls flight data on mount and every 15 seconds */
export function useFlights(): {
  flights: FlightState[]
  loading: boolean
  lastUpdate: Date | null
} {
  const [flights, setFlights] = useState<FlightState[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadFlights = useCallback(async () => {
    const data = await fetchFlights()
    setFlights(data)
    setLoading(false)
    if (data.length > 0) {
      setLastUpdate(new Date())
    }
  }, [])

  useEffect(() => {
    void loadFlights()

    intervalRef.current = setInterval(() => {
      void loadFlights()
    }, POLL_INTERVAL_MS)

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current)
      }
    }
  }, [loadFlights])

  return { flights, loading, lastUpdate }
}
