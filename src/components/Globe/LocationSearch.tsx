import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { Cartesian3, type Viewer as CesiumViewer } from 'cesium'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search'

/** Coordinate pattern: accepts "lat,lon" or "lat, lon" */
const COORD_REGEX = /^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/

interface GeocodingResult {
  lat: string
  lon: string
  display_name: string
}

/**
 * Floating search bar overlaid on the globe panel.
 * Accepts city names, country names, addresses, or lat,lon coordinates.
 * Resolves via Nominatim geocoding and flies the Cesium camera to the result.
 */
export function LocationSearch() {
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showFeedback = useCallback((msg: string, durationMs = 3000) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    setFeedback(msg)
    feedbackTimer.current = setTimeout(() => setFeedback(null), durationMs)
  }, [])

  /** Retrieve the Cesium viewer instance from the global reference */
  const getViewer = useCallback((): CesiumViewer | null => {
    const viewer = (window as unknown as Record<string, unknown>).__cesiumViewer as CesiumViewer | undefined
    if (viewer && !viewer.isDestroyed()) return viewer
    return null
  }, [])

  /** Fly the camera to a given lat/lon */
  const flyTo = useCallback(
    (lat: number, lon: number, label: string) => {
      const viewer = getViewer()
      if (!viewer) {
        showFeedback('Globe not ready')
        return
      }
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(lon, lat, 800_000),
        duration: 2.0,
      })
      showFeedback(`Flying to ${label}`)
    },
    [getViewer, showFeedback],
  )

  /** Handle Enter key: parse coordinates or geocode via Nominatim */
  const handleSearch = useCallback(async () => {
    const trimmed = query.trim()
    if (!trimmed) return

    // Check if input is raw coordinates
    const coordMatch = COORD_REGEX.exec(trimmed)
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1])
      const lon = parseFloat(coordMatch[2])
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        flyTo(lat, lon, `${lat.toFixed(4)}, ${lon.toFixed(4)}`)
        return
      }
    }

    // Geocode via Nominatim
    setLoading(true)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8_000)

      const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(trimmed)}&format=json&limit=1`
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'SIGINTDashboard/1.0' },
      })
      clearTimeout(timeout)

      if (!response.ok) {
        showFeedback('Geocoding service error')
        return
      }

      const results = (await response.json()) as GeocodingResult[]
      if (results.length === 0) {
        showFeedback('Location not found')
        return
      }

      const { lat, lon, display_name } = results[0]
      const shortName = display_name.split(',')[0].trim()
      flyTo(parseFloat(lat), parseFloat(lon), shortName)
    } catch {
      showFeedback('Geocoding request failed')
    } finally {
      setLoading(false)
    }
  }, [query, flyTo, showFeedback])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        void handleSearch()
      }
    },
    [handleSearch],
  )

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      {/* Search input row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(13, 13, 18, 0.80)',
          border: '1px solid #1a1a2e',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          width: 250,
        }}
      >
        <span
          style={{
            color: '#00ff41',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            paddingLeft: 8,
            paddingRight: 4,
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {'>'}
        </span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search location..."
          disabled={loading}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#00ff41',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            padding: '5px 8px 5px 0',
            caretColor: '#00ff41',
          }}
        />
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div
          style={{
            background: 'rgba(13, 13, 18, 0.85)',
            border: '1px solid #1a1a2e',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            color: '#00ff41',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            padding: '3px 8px',
            width: 250,
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  )
}
