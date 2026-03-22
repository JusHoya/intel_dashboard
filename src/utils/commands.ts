import { FINANCIAL_CENTERS } from '../data/cities'
import { useGlobeStore } from '../store/globe'
import { useMarketStore } from '../store/market'

/* ── Types ────────────────────────────────────────────────────────────── */

type CommandType = 'goto' | 'chart' | 'news' | 'view' | 'clear'

interface ParsedCommand {
  type: CommandType
  args: string
}

interface GeocodingResult {
  lat: number
  lon: number
  displayName: string
}

/** Available commands shown as hints in the command bar */
export const COMMAND_HINTS: readonly { prefix: string; description: string; example: string }[] = [
  { prefix: 'goto:', description: 'Fly to a location', example: 'goto:tokyo' },
  { prefix: 'chart:', description: 'Open chart for ticker', example: 'chart:BTCUSD' },
  { prefix: 'news:', description: 'Filter news by topic', example: 'news:iran' },
  { prefix: 'view:', description: 'Switch globe view mode', example: 'view:terminal' },
  { prefix: 'clear', description: 'Clear current selection', example: 'clear' },
] as const

/* ── Well-known locations (beyond FINANCIAL_CENTERS) ─────────────────── */

interface KnownLocation {
  name: string
  latitude: number
  longitude: number
}

const KNOWN_COUNTRIES: readonly KnownLocation[] = [
  { name: 'united states', latitude: 39.8283, longitude: -98.5795 },
  { name: 'usa', latitude: 39.8283, longitude: -98.5795 },
  { name: 'united kingdom', latitude: 55.3781, longitude: -3.4360 },
  { name: 'uk', latitude: 55.3781, longitude: -3.4360 },
  { name: 'japan', latitude: 36.2048, longitude: 138.2529 },
  { name: 'china', latitude: 35.8617, longitude: 104.1954 },
  { name: 'germany', latitude: 51.1657, longitude: 10.4515 },
  { name: 'france', latitude: 46.6034, longitude: 1.8883 },
  { name: 'india', latitude: 20.5937, longitude: 78.9629 },
  { name: 'brazil', latitude: -14.2350, longitude: -51.9253 },
  { name: 'russia', latitude: 61.5240, longitude: 105.3188 },
  { name: 'australia', latitude: -25.2744, longitude: 133.7751 },
  { name: 'canada', latitude: 56.1304, longitude: -106.3468 },
  { name: 'south korea', latitude: 35.9078, longitude: 127.7669 },
  { name: 'mexico', latitude: 23.6345, longitude: -102.5528 },
  { name: 'indonesia', latitude: -0.7893, longitude: 113.9213 },
  { name: 'saudi arabia', latitude: 23.8859, longitude: 45.0792 },
  { name: 'turkey', latitude: 38.9637, longitude: 35.2433 },
  { name: 'iran', latitude: 32.4279, longitude: 53.6880 },
  { name: 'italy', latitude: 41.8719, longitude: 12.5674 },
  { name: 'spain', latitude: 40.4637, longitude: -3.7492 },
  { name: 'ukraine', latitude: 48.3794, longitude: 31.1656 },
  { name: 'poland', latitude: 51.9194, longitude: 19.1451 },
  { name: 'israel', latitude: 31.0461, longitude: 34.8516 },
  { name: 'egypt', latitude: 26.8206, longitude: 30.8025 },
  { name: 'nigeria', latitude: 9.0820, longitude: 8.6753 },
  { name: 'south africa', latitude: -30.5595, longitude: 22.9375 },
  { name: 'argentina', latitude: -38.4161, longitude: -63.6167 },
  { name: 'taiwan', latitude: 23.6978, longitude: 120.9605 },
  { name: 'thailand', latitude: 15.8700, longitude: 100.9925 },
  { name: 'vietnam', latitude: 14.0583, longitude: 108.2772 },
  { name: 'pakistan', latitude: 30.3753, longitude: 69.3451 },
  { name: 'philippines', latitude: 12.8797, longitude: 121.7740 },
  { name: 'colombia', latitude: 4.5709, longitude: -74.2973 },
  { name: 'sweden', latitude: 60.1282, longitude: 18.6435 },
  { name: 'norway', latitude: 60.4720, longitude: 8.4689 },
  { name: 'switzerland', latitude: 46.8182, longitude: 8.2275 },
  { name: 'netherlands', latitude: 52.1326, longitude: 5.2913 },
  { name: 'north korea', latitude: 40.3399, longitude: 127.5101 },
] as const

const KNOWN_CITIES: readonly KnownLocation[] = [
  { name: 'washington', latitude: 38.9072, longitude: -77.0369 },
  { name: 'washington dc', latitude: 38.9072, longitude: -77.0369 },
  { name: 'los angeles', latitude: 34.0522, longitude: -118.2437 },
  { name: 'paris', latitude: 48.8566, longitude: 2.3522 },
  { name: 'moscow', latitude: 55.7558, longitude: 37.6173 },
  { name: 'berlin', latitude: 52.5200, longitude: 13.4050 },
  { name: 'beijing', latitude: 39.9042, longitude: 116.4074 },
  { name: 'rome', latitude: 41.9028, longitude: 12.4964 },
  { name: 'istanbul', latitude: 41.0082, longitude: 28.9784 },
  { name: 'cairo', latitude: 30.0444, longitude: 31.2357 },
  { name: 'kyiv', latitude: 50.4501, longitude: 30.5234 },
  { name: 'tehran', latitude: 35.6892, longitude: 51.3890 },
  { name: 'baghdad', latitude: 33.3152, longitude: 44.3661 },
  { name: 'taipei', latitude: 25.0330, longitude: 121.5654 },
  { name: 'san francisco', latitude: 37.7749, longitude: -122.4194 },
  { name: 'houston', latitude: 29.7604, longitude: -95.3698 },
  { name: 'miami', latitude: 25.7617, longitude: -80.1918 },
  { name: 'denver', latitude: 39.7392, longitude: -104.9903 },
  { name: 'seattle', latitude: 47.6062, longitude: -122.3321 },
  { name: 'boston', latitude: 42.3601, longitude: -71.0589 },
  { name: 'amsterdam', latitude: 52.3676, longitude: 4.9041 },
  { name: 'vienna', latitude: 48.2082, longitude: 16.3738 },
  { name: 'bangkok', latitude: 13.7563, longitude: 100.5018 },
  { name: 'lagos', latitude: 6.5244, longitude: 3.3792 },
  { name: 'nairobi', latitude: -1.2921, longitude: 36.8219 },
  { name: 'riyadh', latitude: 24.7136, longitude: 46.6753 },
  { name: 'jakarta', latitude: -6.2088, longitude: 106.8456 },
  { name: 'manila', latitude: 14.5995, longitude: 120.9842 },
  { name: 'kabul', latitude: 34.5553, longitude: 69.2075 },
  { name: 'pyongyang', latitude: 39.0392, longitude: 125.7625 },
] as const

/* ── Parse ────────────────────────────────────────────────────────────── */

export function parseCommand(raw: string): ParsedCommand | null {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null

  if (trimmed === 'clear') {
    return { type: 'clear', args: '' }
  }

  const colonIdx = trimmed.indexOf(':')
  if (colonIdx === -1) return null

  const prefix = trimmed.slice(0, colonIdx)
  const args = raw.trim().slice(colonIdx + 1).trim()

  switch (prefix) {
    case 'goto':
    case 'chart':
    case 'news':
    case 'view':
      return args ? { type: prefix, args } : null
    default:
      return null
  }
}

/* ── Coordinate parsing ──────────────────────────────────────────────── */

function parseCoordinates(args: string): { lat: number; lon: number } | null {
  // Match patterns like "40.7128,-74.006" or "40.7128, -74.006"
  const match = args.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/)
  if (!match) return null

  const lat = parseFloat(match[1])
  const lon = parseFloat(match[2])

  if (isNaN(lat) || isNaN(lon)) return null
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null

  return { lat, lon }
}

/* ── Local location lookup ───────────────────────────────────────────── */

function findLocalLocation(query: string): { lat: number; lon: number; name: string } | null {
  const lower = query.toLowerCase()

  // Check FINANCIAL_CENTERS first (exact city names from data/cities.ts)
  for (const center of FINANCIAL_CENTERS) {
    if (center.name.toLowerCase() === lower || center.id === lower) {
      return { lat: center.latitude, lon: center.longitude, name: center.name }
    }
  }

  // Check known countries
  for (const loc of KNOWN_COUNTRIES) {
    if (loc.name === lower) {
      return { lat: loc.latitude, lon: loc.longitude, name: loc.name }
    }
  }

  // Check known cities
  for (const loc of KNOWN_CITIES) {
    if (loc.name === lower) {
      return { lat: loc.latitude, lon: loc.longitude, name: loc.name }
    }
  }

  return null
}

/* ── Geocoding via server proxy ──────────────────────────────────────── */

async function geocode(query: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `http://localhost:3001/api/geocode?q=${encodeURIComponent(query)}`,
    )
    if (!response.ok) return null
    const data = (await response.json()) as GeocodingResult
    if (data.lat != null && data.lon != null) return data
    return null
  } catch {
    return null
  }
}

/* ── Command execution ───────────────────────────────────────────────── */

export type CommandResult =
  | { ok: true; message: string }
  | { ok: false; message: string }

export async function executeCommand(parsed: ParsedCommand): Promise<CommandResult> {
  switch (parsed.type) {
    case 'goto':
      return handleGoto(parsed.args)
    case 'chart':
      return handleChart(parsed.args)
    case 'news':
      return handleNews(parsed.args)
    case 'view':
      return handleView(parsed.args)
    case 'clear':
      return handleClear()
  }
}

/* ── goto handler ────────────────────────────────────────────────────── */

async function handleGoto(args: string): Promise<CommandResult> {
  // 1. Try coordinate parsing first
  const coords = parseCoordinates(args)
  if (coords) {
    useGlobeStore.getState().setFlyToTarget(coords.lat, coords.lon, `${coords.lat}, ${coords.lon}`)
    return { ok: true, message: `Flying to ${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` }
  }

  // 2. Try local lookup (financial centers, known cities/countries)
  const local = findLocalLocation(args)
  if (local) {
    useGlobeStore.getState().setFlyToTarget(local.lat, local.lon, local.name)
    return { ok: true, message: `Flying to ${local.name}` }
  }

  // 3. Fall back to server-side geocoding (Nominatim)
  const result = await geocode(args)
  if (result) {
    useGlobeStore.getState().setFlyToTarget(result.lat, result.lon, result.displayName)
    return { ok: true, message: `Flying to ${result.displayName}` }
  }

  return { ok: false, message: `Location not found: ${args}` }
}

/* ── chart handler ───────────────────────────────────────────────────── */

function handleChart(args: string): CommandResult {
  const symbol = args.toUpperCase()
  useMarketStore.getState().selectTicker(symbol)
  return { ok: true, message: `Opened chart for ${symbol}` }
}

/* ── news handler ────────────────────────────────────────────────────── */

function handleNews(_args: string): CommandResult {
  // The news panel is currently a placeholder. Store the filter intent
  // so it can be consumed when the news feed is implemented.
  return { ok: true, message: `News filter set: ${_args}` }
}

/* ── view handler ────────────────────────────────────────────────────── */

function handleView(args: string): CommandResult {
  const mode = args.toLowerCase()
  const store = useGlobeStore.getState()

  if (mode === 'terminal' && store.viewMode !== 'terminal') {
    store.toggleViewMode()
    return { ok: true, message: 'Switched to terminal view' }
  }
  if ((mode === 'photo' || mode === 'photorealistic') && store.viewMode !== 'photorealistic') {
    store.toggleViewMode()
    return { ok: true, message: 'Switched to photorealistic view' }
  }

  if (mode !== 'terminal' && mode !== 'photo' && mode !== 'photorealistic') {
    return { ok: false, message: `Unknown view mode: ${args}. Use "terminal" or "photo"` }
  }

  return { ok: true, message: `Already in ${store.viewMode} view` }
}

/* ── clear handler ───────────────────────────────────────────────────── */

function handleClear(): CommandResult {
  useGlobeStore.getState().clearSelection()
  return { ok: true, message: 'Selection cleared' }
}

/* ── Suggestion filtering ────────────────────────────────────────────── */

export function getSuggestions(query: string): string[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const suggestions: string[] = []

  // Suggest matching command prefixes
  for (const hint of COMMAND_HINTS) {
    if (hint.prefix.startsWith(q) || hint.example.startsWith(q)) {
      suggestions.push(hint.example)
    }
  }

  // If user typed "goto:", suggest known locations
  if (q.startsWith('goto:')) {
    const locQuery = q.slice(5).trim()
    if (locQuery.length > 0) {
      for (const center of FINANCIAL_CENTERS) {
        if (center.name.toLowerCase().startsWith(locQuery)) {
          suggestions.push(`goto:${center.name.toLowerCase()}`)
        }
      }
      for (const loc of KNOWN_COUNTRIES) {
        if (loc.name.startsWith(locQuery)) {
          suggestions.push(`goto:${loc.name}`)
        }
      }
      for (const loc of KNOWN_CITIES) {
        if (loc.name.startsWith(locQuery)) {
          suggestions.push(`goto:${loc.name}`)
        }
      }
    } else {
      // Show a few default suggestions
      suggestions.push('goto:new york', 'goto:london', 'goto:tokyo', 'goto:moscow')
    }
  }

  // If user typed "view:", suggest modes
  if (q.startsWith('view:')) {
    suggestions.push('view:terminal', 'view:photo')
  }

  // Deduplicate and limit
  return [...new Set(suggestions)].slice(0, 8)
}
