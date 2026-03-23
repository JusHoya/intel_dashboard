import express from 'express'
import cors from 'cors'
import https from 'https'
import type { FlightState } from '../src/types/flights.js'
import {
  type BacktestConfig,
  type BacktestResult,
  type GdeltArticle as BacktestGdeltArticle,
  type SignalCategory as BacktestSignalCategory,
  type PriceFetcher,
  generateSignals as generateBacktestSignals,
  runBacktest,
  SIGNAL_CATEGORIES as BACKTEST_SIGNAL_CATEGORIES,
} from './backtest.js'
import {
  type TradeRequest,
  openPosition,
  closePosition,
  updateCurrentPrice,
  getOpenPositions,
  getPerformanceSummary,
} from './paperTrading.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }))
app.use(express.json())

/* ── Server-side flight data cache ─────────────────────────────────────
   OpenSky Network rate-limits anonymous users aggressively (~100 req/day
   for unauthenticated, stricter under load).  We cache the last successful
   response and only re-fetch when the cache is stale.  The frontend polls
   every 15 s, but the server hits OpenSky at most once per CACHE_TTL_MS. */

const CACHE_TTL_MS = 30_000 // 30 seconds
interface FlightCache {
  flights: FlightState[]
  timestamp: number
  fetchedAt: number // Date.now() when we last called OpenSky
}
let flightCache: FlightCache | null = null

/** Transform OpenSky state array into a FlightState object */
function parseStateVector(state: unknown[]): FlightState {
  return {
    icao24: state[0] as string,
    callsign: typeof state[1] === 'string' ? state[1].trim() || null : null,
    origin_country: state[2] as string,
    last_contact: state[4] as number,
    longitude: state[5] as number | null,
    latitude: state[6] as number | null,
    baro_altitude: state[7] as number | null,
    on_ground: state[8] as boolean,
    velocity: state[9] as number | null,
    true_track: state[10] as number | null,
  }
}

/** Generate mock flight data when OpenSky is unreachable */
function generateMockFlights(): FlightState[] {
  const now = Math.floor(Date.now() / 1000)

  return [
    // Transatlantic corridor
    { icao24: 'a0b1c2', callsign: 'UAL123', origin_country: 'United States', longitude: -30.5, latitude: 48.2, baro_altitude: 11280, velocity: 245, true_track: 72, on_ground: false, last_contact: now },
    { icao24: 'a1b2c3', callsign: 'BAW456', origin_country: 'United Kingdom', longitude: -20.3, latitude: 51.1, baro_altitude: 10670, velocity: 252, true_track: 265, on_ground: false, last_contact: now },
    { icao24: 'a2b3c4', callsign: 'DAL789', origin_country: 'United States', longitude: -45.8, latitude: 44.6, baro_altitude: 11890, velocity: 238, true_track: 68, on_ground: false, last_contact: now },
    { icao24: 'a3b4c5', callsign: 'AFR101', origin_country: 'France', longitude: -10.2, latitude: 49.8, baro_altitude: 10360, velocity: 241, true_track: 255, on_ground: false, last_contact: now },

    // European airspace
    { icao24: 'b0c1d2', callsign: 'DLH202', origin_country: 'Germany', longitude: 10.5, latitude: 50.3, baro_altitude: 9750, velocity: 228, true_track: 180, on_ground: false, last_contact: now },
    { icao24: 'b1c2d3', callsign: 'RYR303', origin_country: 'Ireland', longitude: -2.1, latitude: 53.4, baro_altitude: 11120, velocity: 232, true_track: 135, on_ground: false, last_contact: now },
    { icao24: 'b2c3d4', callsign: 'SAS404', origin_country: 'Sweden', longitude: 14.8, latitude: 58.2, baro_altitude: 10060, velocity: 219, true_track: 210, on_ground: false, last_contact: now },
    { icao24: 'b3c4d5', callsign: 'IBE505', origin_country: 'Spain', longitude: -3.7, latitude: 40.4, baro_altitude: 8530, velocity: 205, true_track: 45, on_ground: false, last_contact: now },

    // Transpacific corridor
    { icao24: 'c0d1e2', callsign: 'JAL606', origin_country: 'Japan', longitude: -170.2, latitude: 42.5, baro_altitude: 11580, velocity: 258, true_track: 55, on_ground: false, last_contact: now },
    { icao24: 'c1d2e3', callsign: 'ANA707', origin_country: 'Japan', longitude: 165.3, latitude: 38.9, baro_altitude: 10920, velocity: 249, true_track: 60, on_ground: false, last_contact: now },
    { icao24: 'c2d3e4', callsign: 'UAL808', origin_country: 'United States', longitude: -150.6, latitude: 45.1, baro_altitude: 11350, velocity: 255, true_track: 270, on_ground: false, last_contact: now },
    { icao24: 'c3d4e5', callsign: 'KAL909', origin_country: 'South Korea', longitude: -175.8, latitude: 47.3, baro_altitude: 10480, velocity: 243, true_track: 48, on_ground: false, last_contact: now },

    // Asian airspace
    { icao24: 'd0e1f2', callsign: 'CCA110', origin_country: 'China', longitude: 116.4, latitude: 39.9, baro_altitude: 9200, velocity: 215, true_track: 155, on_ground: false, last_contact: now },
    { icao24: 'd1e2f3', callsign: 'SIA211', origin_country: 'Singapore', longitude: 103.8, latitude: 1.4, baro_altitude: 11750, velocity: 248, true_track: 320, on_ground: false, last_contact: now },
    { icao24: 'd2e3f4', callsign: 'CPA312', origin_country: 'Hong Kong', longitude: 110.5, latitude: 18.6, baro_altitude: 10890, velocity: 236, true_track: 200, on_ground: false, last_contact: now },
    { icao24: 'd3e4f5', callsign: 'THA413', origin_country: 'Thailand', longitude: 100.5, latitude: 13.8, baro_altitude: 8960, velocity: 209, true_track: 290, on_ground: false, last_contact: now },

    // Middle East / Africa
    { icao24: 'e0f1a2', callsign: 'UAE514', origin_country: 'United Arab Emirates', longitude: 55.3, latitude: 25.3, baro_altitude: 11460, velocity: 253, true_track: 310, on_ground: false, last_contact: now },
    { icao24: 'e1f2a3', callsign: 'QTR615', origin_country: 'Qatar', longitude: 48.7, latitude: 30.2, baro_altitude: 10150, velocity: 241, true_track: 275, on_ground: false, last_contact: now },
    { icao24: 'e2f3a4', callsign: 'ETH716', origin_country: 'Ethiopia', longitude: 38.7, latitude: 9.0, baro_altitude: 11070, velocity: 230, true_track: 180, on_ground: false, last_contact: now },
    { icao24: 'e3f4a5', callsign: 'SAA817', origin_country: 'South Africa', longitude: 28.2, latitude: -26.1, baro_altitude: 10530, velocity: 225, true_track: 15, on_ground: false, last_contact: now },

    // South America
    { icao24: 'f0a1b2', callsign: 'TAM918', origin_country: 'Brazil', longitude: -46.6, latitude: -23.5, baro_altitude: 9870, velocity: 218, true_track: 350, on_ground: false, last_contact: now },
    { icao24: 'f1a2b3', callsign: 'AVA019', origin_country: 'Colombia', longitude: -74.1, latitude: 4.7, baro_altitude: 10740, velocity: 234, true_track: 190, on_ground: false, last_contact: now },

    // Australia / Oceania
    { icao24: 'f2a3b4', callsign: 'QFA120', origin_country: 'Australia', longitude: 151.2, latitude: -33.9, baro_altitude: 11190, velocity: 247, true_track: 330, on_ground: false, last_contact: now },
    { icao24: 'f3a4b5', callsign: 'ANZ221', origin_country: 'New Zealand', longitude: 174.8, latitude: -41.3, baro_altitude: 10280, velocity: 222, true_track: 25, on_ground: false, last_contact: now },

    // North America domestic
    { icao24: 'f4a5b6', callsign: 'AAL322', origin_country: 'United States', longitude: -95.3, latitude: 35.2, baro_altitude: 10670, velocity: 231, true_track: 90, on_ground: false, last_contact: now },
  ]
}

/** Optional bounding box for OpenSky queries */
interface BoundingBox {
  lamin: number
  lomin: number
  lamax: number
  lomax: number
}

/** Fetch fresh data from OpenSky Network, updating the cache on success. */
async function fetchFromOpenSky(bbox?: BoundingBox): Promise<FlightCache> {
  let url = 'https://opensky-network.org/api/states/all'
  if (bbox) {
    url += `?lamin=${bbox.lamin}&lomin=${bbox.lomin}&lamax=${bbox.lamax}&lomax=${bbox.lomax}`
    console.log(`[flights] Fetching from OpenSky (bbox: ${bbox.lamin.toFixed(1)},${bbox.lomin.toFixed(1)} → ${bbox.lamax.toFixed(1)},${bbox.lomax.toFixed(1)})...`)
  } else {
    console.log('[flights] Fetching from OpenSky Network (global)...')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  const response = await fetch(url, {
    signal: controller.signal,
  })
  clearTimeout(timeout)

  if (!response.ok) {
    throw new Error(`OpenSky returned status ${response.status}`)
  }

  const data = (await response.json()) as { time: number; states: unknown[][] | null }

  if (!data.states || !Array.isArray(data.states)) {
    throw new Error('OpenSky returned no state vectors')
  }

  const flights: FlightState[] = data.states
    .map(parseStateVector)
    .filter((f): f is FlightState & { latitude: number; longitude: number } =>
      f.latitude !== null && f.longitude !== null,
    )

  console.log(`[flights] Fetched ${flights.length} active flights from OpenSky`)

  const cache: FlightCache = { flights, timestamp: data.time, fetchedAt: Date.now() }
  // Only update global cache for non-bbox queries
  if (!bbox) {
    flightCache = cache
  }
  return cache
}

/* ── Flight route proxy ────────────────────────────────────────────────
   Proxies OpenSky Routes API to resolve callsign → departure/arrival
   ICAO codes for trajectory visualization. Cached per callsign for 5 min. */

const routeCache: Record<string, { data: { departure: string | null; arrival: string | null }; fetchedAt: number }> = {}
const ROUTE_CACHE_TTL_MS = 300_000 // 5 minutes

app.get('/api/flight-route', async (req, res) => {
  const callsign = typeof req.query.callsign === 'string' ? req.query.callsign.trim() : ''

  if (!callsign) {
    res.status(400).json({ error: 'callsign query parameter required' })
    return
  }

  // Serve from cache if fresh
  if (routeCache[callsign] && Date.now() - routeCache[callsign].fetchedAt < ROUTE_CACHE_TTL_MS) {
    res.json(routeCache[callsign].data)
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)

    const url = `https://opensky-network.org/api/routes?callsign=${encodeURIComponent(callsign)}`
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`OpenSky Routes returned status ${response.status}`)
    }

    const data = (await response.json()) as { route: string[] } | null

    const departure = data?.route?.[0] ?? null
    const arrival = data?.route?.[data.route.length - 1] ?? null
    const result = { departure, arrival }

    routeCache[callsign] = { data: result, fetchedAt: Date.now() }
    console.log(`[routes] ${callsign}: ${departure} → ${arrival}`)
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[routes] Failed for ${callsign}: ${message}`)

    // Return cached data if available
    if (routeCache[callsign]) {
      res.json(routeCache[callsign].data)
    } else {
      res.json({ departure: null, arrival: null })
    }
  }
})

/* ── Geocoding proxy (Nominatim / OpenStreetMap) ──────────────────────
   Proxies geocoding requests to Nominatim so the frontend never calls
   third-party APIs directly.  Results are cached for 1 hour.
   Nominatim usage policy requires a meaningful User-Agent header. */

interface GeocodeCache {
  lat: number
  lon: number
  displayName: string
  fetchedAt: number
}

const geocodeCache: Record<string, GeocodeCache> = {}
const GEOCODE_CACHE_TTL_MS = 3_600_000 // 1 hour

app.get('/api/geocode', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  if (!q) {
    res.status(400).json({ error: 'q query parameter required' })
    return
  }

  const cacheKey = q.toLowerCase()

  // Serve from cache if fresh
  if (geocodeCache[cacheKey] && Date.now() - geocodeCache[cacheKey].fetchedAt < GEOCODE_CACHE_TTL_MS) {
    const cached = geocodeCache[cacheKey]
    console.log(`[geocode] Cache hit for "${q}": ${cached.displayName}`)
    res.json({ lat: cached.lat, lon: cached.lon, displayName: cached.displayName })
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SIGINT-Dashboard/1.0 (intel-dashboard geocoding proxy)',
      },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`)
    }

    const data = (await response.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>

    if (!data || data.length === 0) {
      res.status(404).json({ error: `No results for "${q}"` })
      return
    }

    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    }

    geocodeCache[cacheKey] = { ...result, fetchedAt: Date.now() }
    console.log(`[geocode] Resolved "${q}" → ${result.displayName} (${result.lat}, ${result.lon})`)
    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[geocode] Failed for "${q}": ${message}`)

    // Return cached data if available (even stale)
    if (geocodeCache[cacheKey]) {
      const cached = geocodeCache[cacheKey]
      res.json({ lat: cached.lat, lon: cached.lon, displayName: cached.displayName })
    } else {
      res.status(502).json({ error: 'Geocoding service unavailable' })
    }
  }
})

/* ── Google Maps API key endpoint ─────────────────────────────────────
   Serves the Google Maps API key from environment variable so it
   never appears in client-side source code. */

app.get('/api/google-tiles/key', (_req, res) => {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (key) {
    res.json({ key })
  } else {
    res.status(404).json({ error: 'GOOGLE_MAPS_API_KEY not configured' })
  }
})

app.get('/api/flights', async (req, res) => {
  // Parse optional bounding box parameters
  const lamin = parseFloat(req.query.lamin as string)
  const lomin = parseFloat(req.query.lomin as string)
  const lamax = parseFloat(req.query.lamax as string)
  const lomax = parseFloat(req.query.lomax as string)
  const hasBbox = [lamin, lomin, lamax, lomax].every((v) => !isNaN(v))
  const bbox: BoundingBox | undefined = hasBbox
    ? { lamin, lomin, lamax, lomax }
    : undefined

  // For non-bbox (global) requests, serve from cache if still fresh
  if (!bbox && flightCache && Date.now() - flightCache.fetchedAt < CACHE_TTL_MS) {
    const age = ((Date.now() - flightCache.fetchedAt) / 1000).toFixed(1)
    console.log(`[flights] Serving ${flightCache.flights.length} flights from cache (age: ${age}s)`)
    res.json({ flights: flightCache.flights, timestamp: flightCache.timestamp })
    return
  }

  try {
    const cache = await fetchFromOpenSky(bbox)
    res.json({ flights: cache.flights, timestamp: cache.timestamp })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[flights] OpenSky unavailable (${message})`)

    // Return stale cache if available, otherwise mock data
    if (flightCache) {
      const age = ((Date.now() - flightCache.fetchedAt) / 1000).toFixed(1)
      console.log(`[flights] Returning stale cache (age: ${age}s)`)

      // If bbox requested, filter cached flights client-side
      let flights = flightCache.flights
      if (bbox) {
        flights = flights.filter(
          (f) =>
            f.latitude !== null &&
            f.longitude !== null &&
            f.latitude >= bbox.lamin &&
            f.latitude <= bbox.lamax &&
            f.longitude >= bbox.lomin &&
            f.longitude <= bbox.lomax,
        )
      }

      res.json({ flights, timestamp: flightCache.timestamp })
    } else {
      console.log('[flights] No cache available, returning mock data')
      const mockFlights = generateMockFlights()
      res.json({
        flights: mockFlights,
        timestamp: Math.floor(Date.now() / 1000),
      })
    }
  }
})

/* ── Stock price proxy ────────────────────────────────────────────────
   Fetches real stock quotes from Yahoo Finance (v8 chart API).
   Each symbol is fetched individually then cached for 60 seconds. */

interface StockCache {
  quotes: StockQuote[]
  fetchedAt: number
}

interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  prevClose: number
}

const STOCK_CACHE_TTL_MS = 60_000
let stockCache: StockCache | null = null

const YAHOO_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

/** Fetch a single stock quote from Yahoo Finance */
async function fetchYahooQuote(symbol: string): Promise<StockQuote | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8_000)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': YAHOO_USER_AGENT },
    })
    clearTimeout(timeout)

    if (!response.ok) return null

    const data = (await response.json()) as {
      chart: {
        result: Array<{
          meta: {
            regularMarketPrice: number
            chartPreviousClose: number
            regularMarketDayHigh: number
            regularMarketDayLow: number
            regularMarketVolume: number
          }
        }> | null
      }
    }

    const meta = data.chart?.result?.[0]?.meta
    if (!meta) return null

    const price = meta.regularMarketPrice
    const prevClose = meta.chartPreviousClose
    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

    return {
      symbol,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: meta.regularMarketVolume,
      high: parseFloat(meta.regularMarketDayHigh.toFixed(2)),
      low: parseFloat(meta.regularMarketDayLow.toFixed(2)),
      prevClose: parseFloat(prevClose.toFixed(2)),
    }
  } catch {
    return null
  }
}

/** Fetch all stock quotes concurrently from Yahoo Finance */
async function fetchAllStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const results = await Promise.all(symbols.map(fetchYahooQuote))
  return results.filter((q): q is StockQuote => q !== null)
}

app.get('/api/stocks', async (req, res) => {
  const symbolsParam = typeof req.query.symbols === 'string' ? req.query.symbols : ''
  const symbols = symbolsParam.split(',').filter(Boolean)

  if (symbols.length === 0) {
    res.status(400).json({ error: 'symbols query parameter required' })
    return
  }

  // Serve from cache if fresh
  if (stockCache && Date.now() - stockCache.fetchedAt < STOCK_CACHE_TTL_MS) {
    const filtered = stockCache.quotes.filter((q) => symbols.includes(q.symbol))
    res.json({ quotes: filtered })
    return
  }

  try {
    const quotes = await fetchAllStockQuotes(symbols)

    if (quotes.length > 0) {
      stockCache = { quotes, fetchedAt: Date.now() }
      console.log(`[stocks] Serving ${quotes.length} stock quotes (Yahoo Finance)`)
      res.json({ quotes })
    } else {
      throw new Error('No quotes returned')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[stocks] Yahoo Finance fetch failed (${message})`)

    // Return stale cache if available
    if (stockCache) {
      const filtered = stockCache.quotes.filter((q) => symbols.includes(q.symbol))
      res.json({ quotes: filtered })
    } else {
      res.status(502).json({ error: 'Stock data unavailable' })
    }
  }
})

/* ── Binance kline proxy ──────────────────────────────────────────────
   Proxies Binance REST API kline requests to avoid CORS issues.
   Cached per symbol+interval for 60 seconds. */

const klineCache: Record<string, { data: unknown; fetchedAt: number }> = {}
const KLINE_CACHE_TTL_MS = 60_000

app.get('/api/crypto/candles', async (req, res) => {
  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol : ''
  const interval = typeof req.query.interval === 'string' ? req.query.interval : '1h'
  const limit = typeof req.query.limit === 'string' ? req.query.limit : '200'

  if (!symbol) {
    res.status(400).json({ error: 'symbol query parameter required' })
    return
  }

  const cacheKey = `${symbol}_${interval}_${limit}`

  // Serve from cache if fresh
  if (klineCache[cacheKey] && Date.now() - klineCache[cacheKey].fetchedAt < KLINE_CACHE_TTL_MS) {
    res.json(klineCache[cacheKey].data)
    return
  }

  try {
    const url = `https://api.binance.us/api/v3/klines?symbol=${encodeURIComponent(symbol.toUpperCase())}&interval=${encodeURIComponent(interval)}&limit=${encodeURIComponent(limit)}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Binance returned status ${response.status}`)
    }

    const data = await response.json()
    klineCache[cacheKey] = { data, fetchedAt: Date.now() }

    console.log(`[crypto] Serving ${(data as unknown[]).length} candles for ${symbol} (${interval})`)
    res.json(data)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[crypto] Binance kline fetch failed (${message})`)

    // Return cached data if available
    if (klineCache[cacheKey]) {
      res.json(klineCache[cacheKey].data)
    } else {
      res.status(502).json({ error: 'Binance API unavailable' })
    }
  }
})

/* ── GDELT news proxy ──────────────────────────────────────────────────
   Proxies GDELT DOC 2.0 API for news headlines.  Free, no API key.
   Cached per query string for 5 minutes. */

interface GdeltArticle {
  url: string
  title: string
  seendate: string
  socialimage: string
  domain: string
  language: string
  sourcecountry: string
  tone: string // comma-separated tone values; first is overall tone
}

interface GdeltResponse {
  articles?: GdeltArticle[]
}

interface NewsCache {
  articles: {
    id: string
    title: string
    url: string
    source: string
    sourceCountry: string
    publishedAt: string
    imageUrl: string | null
    tone: number
    language: string
    domain: string
  }[]
  fetchedAt: number
}

const newsCacheMap: Record<string, NewsCache> = {}
const NEWS_CACHE_TTL_MS = 300_000 // 5 minutes

app.get('/api/news', async (req, res) => {
  const country = typeof req.query.country === 'string' ? req.query.country.trim() : ''
  const topic = typeof req.query.topic === 'string' ? req.query.topic.trim() : ''
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100)

  // Build GDELT query
  let query = topic || ''
  if (country) {
    // If country is a 2-letter ISO code, use sourcecountry filter
    if (country.length === 2) {
      query += ` sourcecountry:${country.toUpperCase()}`
    } else {
      // Otherwise search for country name in articles
      query += ` "${country}"`
    }
  }
  query = query.trim()
  if (!query) {
    // Default: global top stories (GDELT requires parens around OR'd terms)
    query = '(world OR conflict OR economy OR trade OR military OR sanctions)'
  }
  // Filter to English-language sources for readability
  query += ' sourcelang:english'

  const cacheKey = `${query}_${limit}`

  // Serve from cache if fresh
  if (newsCacheMap[cacheKey] && Date.now() - newsCacheMap[cacheKey].fetchedAt < NEWS_CACHE_TTL_MS) {
    res.json({ articles: newsCacheMap[cacheKey].articles })
    return
  }

  try {
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${limit}&format=json&sort=datedesc`
    console.log(`[news] Fetching: ${gdeltUrl}`)

    // Use Node https module — undici (global fetch) has SSL issues with GDELT
    const text = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('GDELT request timeout')), 15_000)
      https.get(gdeltUrl, { timeout: 12_000 }, (resp) => {
        if (resp.statusCode && resp.statusCode >= 400) {
          clearTimeout(timer)
          reject(new Error(`GDELT returned status ${resp.statusCode}`))
          resp.resume()
          return
        }
        let body = ''
        resp.on('data', (chunk: Buffer) => { body += chunk.toString() })
        resp.on('end', () => { clearTimeout(timer); resolve(body) })
        resp.on('error', (e: Error) => { clearTimeout(timer); reject(e) })
      }).on('error', (e) => { clearTimeout(timer); reject(e) })
    })

    console.log(`[news] Got response (${text.length} bytes)`)

    // GDELT sometimes returns 200 with a plain-text error message
    if (!text.trimStart().startsWith('{')) {
      throw new Error(`GDELT returned non-JSON: ${text.slice(0, 120)}`)
    }

    const data = JSON.parse(text) as GdeltResponse

    const articles = (data.articles ?? []).map((a: GdeltArticle, i: number) => {
      const toneStr = a.tone?.split(',')[0] ?? '0'
      return {
        id: `gdelt-${i}-${Date.now()}`,
        title: a.title,
        url: a.url,
        source: a.domain?.replace(/^www\./, '') ?? 'Unknown',
        sourceCountry: a.sourcecountry ?? '',
        publishedAt: a.seendate ?? new Date().toISOString(),
        imageUrl: a.socialimage || null,
        tone: parseFloat(toneStr) || 0,
        language: a.language ?? 'English',
        domain: a.domain ?? '',
      }
    })

    newsCacheMap[cacheKey] = { articles, fetchedAt: Date.now() }
    console.log(`[news] Serving ${articles.length} articles for query: "${query}"`)
    res.json({ articles })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[news] GDELT fetch failed (${message})`)

    // Return cached data if available
    if (newsCacheMap[cacheKey]) {
      res.json({ articles: newsCacheMap[cacheKey].articles })
    } else {
      res.status(502).json({ error: 'News data unavailable' })
    }
  }
})

/* ── Satellite TLE proxy ──────────────────────────────────────────────
   Fetches TLE (Two-Line Element) data from CelesTrak for satellite
   tracking. Combines space stations and a sample of Starlink sats.
   Cached for 2 hours since TLEs don't change frequently. */

interface SatelliteTLEData {
  name: string
  line1: string
  line2: string
  noradId: number
  category: 'station' | 'starlink' | 'general'
}

interface SatelliteTLECache {
  satellites: SatelliteTLEData[]
  fetchedAt: number
}

const SATELLITE_CACHE_TTL_MS = 7_200_000 // 2 hours
let satelliteTLECache: SatelliteTLECache | null = null

/** Parse raw TLE text into structured satellite records */
function parseTLEText(text: string, category: 'station' | 'starlink' | 'general'): SatelliteTLEData[] {
  const lines = text.trim().split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
  const satellites: SatelliteTLEData[] = []

  // TLE format: 3 lines per satellite (name, line1, line2)
  for (let i = 0; i + 2 < lines.length; i += 3) {
    const name = lines[i]
    const line1 = lines[i + 1]
    const line2 = lines[i + 2]

    // Validate TLE lines start with '1 ' and '2 '
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
      continue
    }

    // Extract NORAD catalog number from line 1 (columns 3-7)
    const noradId = parseInt(line1.substring(2, 7).trim(), 10)
    if (isNaN(noradId)) continue

    satellites.push({ name: name.trim(), line1, line2, noradId, category })
  }

  return satellites
}

/** Fetch TLE data from CelesTrak for a given group */
async function fetchCelesTrakTLE(group: string, category: 'station' | 'starlink' | 'general'): Promise<SatelliteTLEData[]> {
  const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${group}&FORMAT=tle`
  console.log(`[satellites] Fetching TLE for group: ${group}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15_000)

  const response = await fetch(url, { signal: controller.signal })
  clearTimeout(timeout)

  if (!response.ok) {
    throw new Error(`CelesTrak returned status ${response.status} for ${group}`)
  }

  const text = await response.text()
  return parseTLEText(text, category)
}

app.get('/api/satellites/tle', async (_req, res) => {
  // Serve from cache if fresh
  if (satelliteTLECache && Date.now() - satelliteTLECache.fetchedAt < SATELLITE_CACHE_TTL_MS) {
    const age = ((Date.now() - satelliteTLECache.fetchedAt) / 1000 / 60).toFixed(1)
    console.log(`[satellites] Serving ${satelliteTLECache.satellites.length} TLEs from cache (age: ${age}min)`)
    res.json({ satellites: satelliteTLECache.satellites, fetchedAt: satelliteTLECache.fetchedAt })
    return
  }

  try {
    // Fetch space stations and Starlink in parallel
    const [stations, starlink] = await Promise.all([
      fetchCelesTrakTLE('stations', 'station').catch((err) => {
        console.warn(`[satellites] Space stations fetch failed: ${err instanceof Error ? err.message : String(err)}`)
        return [] as SatelliteTLEData[]
      }),
      fetchCelesTrakTLE('starlink', 'starlink').catch((err) => {
        console.warn(`[satellites] Starlink fetch failed: ${err instanceof Error ? err.message : String(err)}`)
        return [] as SatelliteTLEData[]
      }),
    ])

    // Limit Starlink to 50 most recent (highest NORAD IDs = most recent launches)
    const starlinkSorted = starlink
      .sort((a, b) => b.noradId - a.noradId)
      .slice(0, 50)

    const allSatellites = [...stations, ...starlinkSorted]
    console.log(`[satellites] Fetched ${stations.length} stations + ${starlinkSorted.length} Starlink (of ${starlink.length} total)`)

    satelliteTLECache = { satellites: allSatellites, fetchedAt: Date.now() }
    res.json({ satellites: allSatellites, fetchedAt: satelliteTLECache.fetchedAt })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[satellites] TLE fetch failed: ${message}`)

    if (satelliteTLECache) {
      res.json({ satellites: satelliteTLECache.satellites, fetchedAt: satelliteTLECache.fetchedAt })
    } else {
      res.status(502).json({ error: 'Satellite TLE data unavailable' })
    }
  }
})

/* ══════════════════════════════════════════════════════════════════════
   SIGNAL ENGINE — Historical data pipelines & backtesting
   ══════════════════════════════════════════════════════════════════════ */

/* ── GDELT helper: fetch via Node https (avoids SSL/undici issues) ── */

function gdeltFetch(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { timeout: 15_000 }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        gdeltFetch(res.headers.location).then(resolve, reject)
        return
      }
      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`GDELT returned status ${res.statusCode}`))
        return
      }
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('GDELT request timed out')) })
  })
}

/** Parse GDELT DOC 2.0 JSON response into BacktestGdeltArticle[] */
function parseGdeltResponse(json: string): BacktestGdeltArticle[] {
  try {
    const data = JSON.parse(json) as { articles?: Array<{
      url?: string
      title?: string
      seendate?: string
      domain?: string
      language?: string
      tone?: number
      socialimage?: string
    }> }
    if (!data.articles || !Array.isArray(data.articles)) return []
    return data.articles
      .filter((a) => a.url && a.title && a.seendate)
      .map((a) => ({
        url: a.url!,
        title: a.title!,
        seendate: a.seendate!.replace(/[^0-9T]/g, ''),
        domain: a.domain ?? '',
        language: a.language ?? 'English',
        tone: typeof a.tone === 'number' ? a.tone : 0,
        socialimage: a.socialimage,
      }))
  } catch {
    return []
  }
}

/* ── GDELT events cache ─────────────────────────────────────────────── */

const gdeltEventsCache: Record<string, { data: BacktestGdeltArticle[]; fetchedAt: number }> = {}
const GDELT_EVENTS_CACHE_TTL_MS = 3_600_000  // 1 hour
const GDELT_RECENT_CACHE_TTL_MS = 600_000    // 10 minutes

/* ── GET /api/signals/events — Historical GDELT events for backtesting */

app.get('/api/signals/events', async (req, res) => {
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : ''
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : ''
  const category = typeof req.query.category === 'string' ? req.query.category : ''

  if (!startDate || !endDate) {
    res.status(400).json({ error: 'startDate and endDate query parameters required (YYYY-MM-DD)' })
    return
  }

  // Build GDELT query terms based on category
  let queryTerms = '(war OR sanctions OR military OR trade OR economy OR crisis OR conflict OR missile OR nuclear)'
  if (category && category in BACKTEST_SIGNAL_CATEGORIES) {
    const cat = BACKTEST_SIGNAL_CATEGORIES[category as BacktestSignalCategory]
    queryTerms = `(${cat.keywords.join(' OR ')})`
  }

  // Convert YYYY-MM-DD to YYYYMMDDHHMMSS
  const startDt = startDate.replace(/-/g, '') + '000000'
  const endDt = endDate.replace(/-/g, '') + '235959'
  const cacheKey = `events_${startDt}_${endDt}_${category}`

  // Serve from cache if fresh
  if (gdeltEventsCache[cacheKey] && Date.now() - gdeltEventsCache[cacheKey].fetchedAt < GDELT_EVENTS_CACHE_TTL_MS) {
    console.log(`[signals] Serving ${gdeltEventsCache[cacheKey].data.length} cached events`)
    res.json({ articles: gdeltEventsCache[cacheKey].data, cached: true })
    return
  }

  try {
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(queryTerms)}&sourcelang:english&mode=ArtList&maxrecords=250&format=json&startdatetime=${startDt}&enddatetime=${endDt}&sort=ToneDesc`

    console.log(`[signals] Fetching GDELT events: ${startDate} → ${endDate} (${category || 'all'})`)
    const body = await gdeltFetch(url)
    const articles = parseGdeltResponse(body)

    gdeltEventsCache[cacheKey] = { data: articles, fetchedAt: Date.now() }
    console.log(`[signals] Fetched ${articles.length} GDELT events`)
    res.json({ articles, cached: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[signals] GDELT events fetch failed: ${message}`)

    // Return stale cache if available
    if (gdeltEventsCache[cacheKey]) {
      res.json({ articles: gdeltEventsCache[cacheKey].data, cached: true, stale: true })
    } else {
      res.status(502).json({ error: 'GDELT API unavailable', detail: message })
    }
  }
})

/* ── GET /api/signals/events/recent — Latest 24h high-impact events ── */

let recentEventsCache: { data: BacktestGdeltArticle[]; fetchedAt: number } | null = null

app.get('/api/signals/events/recent', async (_req, res) => {
  // Serve from cache if fresh
  if (recentEventsCache && Date.now() - recentEventsCache.fetchedAt < GDELT_RECENT_CACHE_TTL_MS) {
    console.log(`[signals] Serving ${recentEventsCache.data.length} cached recent events`)
    res.json({ articles: recentEventsCache.data, cached: true })
    return
  }

  try {
    const query = '(war OR sanctions OR military OR trade OR economy OR crisis OR conflict OR missile OR nuclear)'
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&sourcelang:english&mode=ArtList&maxrecords=100&format=json&timespan=1440&sort=ToneDesc`

    console.log('[signals] Fetching recent GDELT events (last 24h)...')
    const body = await gdeltFetch(url)
    const articles = parseGdeltResponse(body)

    // Sort by tone intensity (most impactful = most extreme tone)
    articles.sort((a, b) => Math.abs(b.tone) - Math.abs(a.tone))

    recentEventsCache = { data: articles, fetchedAt: Date.now() }
    console.log(`[signals] Fetched ${articles.length} recent events`)
    res.json({ articles, cached: false })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[signals] Recent events fetch failed: ${message}`)

    if (recentEventsCache) {
      res.json({ articles: recentEventsCache.data, cached: true, stale: true })
    } else {
      res.status(502).json({ error: 'GDELT API unavailable', detail: message })
    }
  }
})

/* ── Historical price data (Yahoo Finance) ──────────────────────────── */

const priceCache: Record<string, { data: { dates: number[]; open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }; fetchedAt: number }> = {}
const PRICE_CACHE_TTL_MS = 14_400_000 // 4 hours

interface YahooChartResponse {
  chart: {
    result: Array<{
      timestamp: number[]
      indicators: {
        quote: Array<{
          open: (number | null)[]
          high: (number | null)[]
          low: (number | null)[]
          close: (number | null)[]
          volume: (number | null)[]
        }>
      }
    }> | null
    error: { code: string; description: string } | null
  }
}

/** Fetch OHLCV historical data for a single symbol from Yahoo Finance */
async function fetchHistoricalPrices(
  symbol: string,
  startDate: string,
  endDate: string,
  interval: string = '1d',
): Promise<{ dates: number[]; open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] } | null> {
  const period1 = Math.floor(new Date(startDate + 'T00:00:00Z').getTime() / 1000)
  const period2 = Math.floor(new Date(endDate + 'T23:59:59Z').getTime() / 1000)
  const cacheKey = `price_${symbol}_${period1}_${period2}_${interval}`

  // Serve from cache if fresh
  if (priceCache[cacheKey] && Date.now() - priceCache[cacheKey].fetchedAt < PRICE_CACHE_TTL_MS) {
    return priceCache[cacheKey].data
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=${encodeURIComponent(interval)}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12_000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': YAHOO_USER_AGENT },
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Yahoo Finance returned status ${response.status}`)
    }

    const data = (await response.json()) as YahooChartResponse

    const result = data.chart?.result?.[0]
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      throw new Error('No chart data returned')
    }

    const quote = result.indicators.quote[0]
    const dates: number[] = []
    const open: number[] = []
    const high: number[] = []
    const low: number[] = []
    const close: number[] = []
    const volume: number[] = []

    for (let i = 0; i < result.timestamp.length; i++) {
      // Skip entries with null values
      if (
        quote.open[i] != null &&
        quote.high[i] != null &&
        quote.low[i] != null &&
        quote.close[i] != null
      ) {
        dates.push(result.timestamp[i])
        open.push(quote.open[i]!)
        high.push(quote.high[i]!)
        low.push(quote.low[i]!)
        close.push(quote.close[i]!)
        volume.push(quote.volume[i] ?? 0)
      }
    }

    const ohlcv = { dates, open, high, low, close, volume }
    priceCache[cacheKey] = { data: ohlcv, fetchedAt: Date.now() }
    return ohlcv
  } catch {
    return null
  }
}

app.get('/api/signals/prices', async (req, res) => {
  const symbolParam = typeof req.query.symbol === 'string' ? req.query.symbol : ''
  const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : ''
  const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : ''
  const interval = typeof req.query.interval === 'string' ? req.query.interval : '1d'

  if (!symbolParam || !startDate || !endDate) {
    res.status(400).json({ error: 'symbol, startDate, and endDate query parameters required' })
    return
  }

  const symbols = symbolParam.split(',').map((s) => s.trim()).filter(Boolean)

  try {
    const results: Record<string, { dates: number[]; open: number[]; high: number[]; low: number[]; close: number[]; volume: number[] }> = {}

    const fetches = symbols.map(async (sym) => {
      const data = await fetchHistoricalPrices(sym, startDate, endDate, interval)
      if (data) results[sym] = data
    })
    await Promise.all(fetches)

    console.log(`[signals] Serving historical prices for ${Object.keys(results).length}/${symbols.length} symbols`)
    res.json({ prices: results })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`[signals] Historical prices fetch failed: ${message}`)
    res.status(502).json({ error: 'Price data unavailable', detail: message })
  }
})

/* ── Backtesting endpoints ──────────────────────────────────────────── */

const backtestCache: Record<string, { result: BacktestResult; fetchedAt: number }> = {}
const BACKTEST_CACHE_TTL_MS = 3_600_000 // 1 hour
let latestBacktestResult: { result: BacktestResult; runAt: string } | null = null

/** Hash a backtest config for cache key */
function hashConfig(config: BacktestConfig): string {
  return `bt_${config.startDate}_${config.endDate}_${config.categories.sort().join(',')}_${config.holdPeriodDays}_${config.confidenceThreshold}`
}

app.post('/api/signals/backtest', async (req, res) => {
  const body = req.body as Partial<BacktestConfig>

  if (!body.startDate || !body.endDate) {
    res.status(400).json({ error: 'startDate and endDate are required' })
    return
  }

  const config: BacktestConfig = {
    startDate: body.startDate,
    endDate: body.endDate,
    categories: body.categories ?? Object.keys(BACKTEST_SIGNAL_CATEGORIES) as BacktestSignalCategory[],
    holdPeriodDays: body.holdPeriodDays ?? 5,
    confidenceThreshold: body.confidenceThreshold ?? 0.5,
  }

  const configHash = hashConfig(config)

  // Serve from cache if fresh
  if (backtestCache[configHash] && Date.now() - backtestCache[configHash].fetchedAt < BACKTEST_CACHE_TTL_MS) {
    console.log('[signals] Serving cached backtest result')
    res.json(backtestCache[configHash].result)
    return
  }

  try {
    console.log(`[signals] Running backtest: ${config.startDate} → ${config.endDate} (${config.categories.length} categories)`)

    // Step 1: Fetch historical GDELT events
    const startDt = config.startDate.replace(/-/g, '') + '000000'
    const endDt = config.endDate.replace(/-/g, '') + '235959'
    const query = '(war OR sanctions OR military OR trade OR economy OR crisis OR conflict OR missile OR nuclear)'
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&sourcelang:english&mode=ArtList&maxrecords=250&format=json&startdatetime=${startDt}&enddatetime=${endDt}&sort=ToneDesc`

    const gdeltBody = await gdeltFetch(gdeltUrl)
    const articles = parseGdeltResponse(gdeltBody)
    console.log(`[signals] Backtest: ${articles.length} GDELT events fetched`)

    if (articles.length === 0) {
      res.status(404).json({ error: 'No GDELT events found for the specified date range' })
      return
    }

    // Step 2: Generate signals from events
    const signals = generateBacktestSignals(articles, config.categories)
    console.log(`[signals] Backtest: ${signals.length} signals generated`)

    // Step 3: Run backtest with price fetcher
    const priceFetcher: PriceFetcher = async (symbol, start, end) => {
      return fetchHistoricalPrices(symbol, start, end, '1d')
    }

    const result = await runBacktest(config, signals, priceFetcher)
    console.log(`[signals] Backtest complete: ${result.totalSignals} trades, ${(result.accuracy * 100).toFixed(1)}% accuracy`)

    backtestCache[configHash] = { result, fetchedAt: Date.now() }
    latestBacktestResult = { result, runAt: new Date().toISOString() }

    res.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`[signals] Backtest failed: ${message}`)
    res.status(500).json({ error: 'Backtest failed', detail: message })
  }
})

app.get('/api/signals/backtest/status', (_req, res) => {
  if (latestBacktestResult) {
    res.json({
      hasResults: true,
      lastRun: latestBacktestResult.runAt,
      results: latestBacktestResult.result,
    })
  } else {
    res.json({
      hasResults: false,
      lastRun: null,
      results: null,
    })
  }
})

/* ── Paper Trading endpoints ────────────────────────────────────────── */

app.get('/api/paper/positions', (_req, res) => {
  res.json({ positions: getOpenPositions() })
})

app.post('/api/paper/trade', (req, res) => {
  const body = req.body as Partial<TradeRequest>

  if (!body.signalId || !body.ticker || !body.direction || !body.entryPrice || !body.quantity) {
    res.status(400).json({
      error: 'signalId, ticker, direction, entryPrice, and quantity are required',
    })
    return
  }

  if (body.direction !== 'long' && body.direction !== 'short') {
    res.status(400).json({ error: 'direction must be "long" or "short"' })
    return
  }

  if (body.entryPrice <= 0 || body.quantity <= 0) {
    res.status(400).json({ error: 'entryPrice and quantity must be positive' })
    return
  }

  const position = openPosition({
    signalId: body.signalId,
    ticker: body.ticker,
    direction: body.direction,
    entryPrice: body.entryPrice,
    quantity: body.quantity,
  })

  console.log(`[paper] Opened ${position.direction} position: ${position.quantity}x ${position.ticker} @ $${position.entryPrice}`)
  res.status(201).json(position)
})

app.post('/api/paper/close', (req, res) => {
  const body = req.body as { positionId?: string; exitPrice?: number }

  if (!body.positionId || !body.exitPrice) {
    res.status(400).json({ error: 'positionId and exitPrice are required' })
    return
  }

  const closed = closePosition(body.positionId, body.exitPrice)
  if (!closed) {
    res.status(404).json({ error: 'Position not found or already closed' })
    return
  }

  console.log(`[paper] Closed position ${closed.ticker}: P&L $${closed.realizedPnL?.toFixed(2)}`)
  res.json(closed)
})

app.post('/api/paper/update-prices', (req, res) => {
  const body = req.body as { prices?: Record<string, number> }

  if (!body.prices || typeof body.prices !== 'object') {
    res.status(400).json({ error: 'prices object required (e.g. { "SPY": 450.25 })' })
    return
  }

  let totalUpdated = 0
  for (const [ticker, price] of Object.entries(body.prices)) {
    totalUpdated += updateCurrentPrice(ticker, price)
  }

  console.log(`[paper] Updated prices for ${totalUpdated} open positions`)
  res.json({ updated: totalUpdated })
})

app.get('/api/paper/performance', (_req, res) => {
  res.json(getPerformanceSummary())
})

/* ══════════════════════════════════════════════════════════════════════ */

app.listen(PORT, () => {
  console.log(`[server] API proxy running on http://localhost:${PORT}`)
  console.log(`[server] Endpoints:`)
  console.log(`         /api/flights, /api/flight-route, /api/stocks, /api/crypto/candles`)
  console.log(`         /api/google-tiles/key, /api/news, /api/geocode, /api/satellites/tle`)
  console.log(`         /api/signals/events, /api/signals/events/recent`)
  console.log(`         /api/signals/prices`)
  console.log(`         /api/signals/backtest, /api/signals/backtest/status`)
  console.log(`         /api/paper/positions, /api/paper/trade, /api/paper/close`)
  console.log(`         /api/paper/update-prices, /api/paper/performance`)
  console.log(`[server] CORS enabled for localhost origins`)
})
