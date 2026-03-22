import express from 'express'
import cors from 'cors'
import https from 'https'
import type { FlightState } from '../src/types/flights.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: /^http:\/\/localhost:\d+$/ }))

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

app.listen(PORT, () => {
  console.log(`[server] API proxy running on http://localhost:${PORT}`)
  console.log(`[server] Endpoints: /api/flights, /api/flight-route, /api/stocks, /api/crypto/candles, /api/google-tiles/key, /api/news`)
  console.log(`[server] CORS enabled for localhost origins`)
})
