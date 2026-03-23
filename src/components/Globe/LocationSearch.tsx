import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react'
import { useGlobeStore } from '../../store/globe'

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
 * Shows a dropdown of recently visited locations on focus.
 */
export function LocationSearch() {
  const [query, setQuery] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const setFlyToTarget = useGlobeStore((s) => s.setFlyToTarget)
  const locationHistory = useGlobeStore((s) => s.locationHistory)

  const showFeedback = useCallback((msg: string, durationMs = 3000) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current)
    setFeedback(msg)
    feedbackTimer.current = setTimeout(() => setFeedback(null), durationMs)
  }, [])

  /** Fly to a location via the store (triggers auto-3D, pin drop, history) */
  const flyTo = useCallback(
    (lat: number, lon: number, label: string) => {
      setFlyToTarget(lat, lon, label)
      showFeedback(`Flying to ${label}`)
      setShowHistory(false)
    },
    [setFlyToTarget, showFeedback],
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
        setShowHistory(false)
      } else if (e.key === 'Escape') {
        setShowHistory(false)
        inputRef.current?.blur()
      }
    },
    [handleSearch],
  )

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }, [])

  const handleFocus = useCallback(() => {
    if (locationHistory.length > 0) setShowHistory(true)
  }, [locationHistory.length])

  const handleBlur = useCallback(() => {
    // Delay to allow click on history item
    setTimeout(() => setShowHistory(false), 200)
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
        gap: 0,
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
          width: 280,
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
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
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

      {/* Recent location history dropdown */}
      {showHistory && locationHistory.length > 0 && (
        <div
          style={{
            background: 'rgba(13, 13, 18, 0.92)',
            border: '1px solid #1a1a2e',
            borderTop: 'none',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            width: 280,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              padding: '3px 8px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 9,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Recent Locations
          </div>
          {locationHistory.map((loc, i) => (
            <button
              key={`${loc.label}-${i}`}
              type="button"
              onClick={() => flyTo(loc.latitude, loc.longitude, loc.label)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%',
                padding: '4px 8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 10,
                color: '#00ff41',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 255, 65, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ color: '#ff4444', flexShrink: 0 }}>&#9679;</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {loc.label}
              </span>
              <span style={{ marginLeft: 'auto', color: '#555', flexShrink: 0, fontSize: 9 }}>
                {loc.latitude.toFixed(2)}, {loc.longitude.toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}

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
            width: 280,
            marginTop: 4,
          }}
        >
          {feedback}
        </div>
      )}
    </div>
  )
}
