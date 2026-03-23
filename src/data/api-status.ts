export interface ApiStatus {
  name: string
  endpoint: string
  requiresKey: boolean
  keyEnvVar?: string
  configured: boolean
  freeLimit?: string
  notes: string
}

/**
 * Catalog of every external API/service used by the dashboard.
 * Informational only — no UI renders this yet.
 */
export const API_STATUS: readonly ApiStatus[] = [
  {
    name: 'OpenSky Network',
    endpoint: 'https://opensky-network.org/api/states/all',
    requiresKey: false,
    configured: true,
    freeLimit: '~100 req/day unauthenticated; ~4000 req/day with free account',
    notes:
      'Flight tracking data. No key needed for basic access. Register for higher rate limits. Proxied through /api/flights and /api/flight-route.',
  },
  {
    name: 'Binance WebSocket',
    endpoint: 'wss://stream.binance.us:9443/ws',
    requiresKey: false,
    configured: true,
    freeLimit: 'Unlimited (WebSocket streams)',
    notes:
      'Real-time crypto price tickers via WebSocket. REST kline endpoint proxied through /api/crypto/candles. No API key needed.',
  },
  {
    name: 'Yahoo Finance',
    endpoint: 'https://query1.finance.yahoo.com/v8/finance/chart/',
    requiresKey: false,
    configured: true,
    freeLimit: 'Unofficial API, no documented limit; may rate-limit heavy usage',
    notes:
      'Stock quote data. Unofficial REST endpoint, no API key required. Proxied through /api/stocks.',
  },
  {
    name: 'GDELT Project',
    endpoint: 'https://api.gdeltproject.org/api/v2/',
    requiresKey: false,
    configured: true,
    freeLimit: 'Generous free tier, no hard limit published',
    notes:
      'Global news and event data. No API key required. Not yet integrated into feeds.',
  },
  {
    name: 'CelesTrak',
    endpoint: 'https://celestrak.org/NORAD/elements/',
    requiresKey: false,
    configured: true,
    freeLimit: 'No published limit; rate-limit courtesy expected',
    notes:
      'Satellite TLE orbital data. No API key required. Not yet integrated into feeds.',
  },
  {
    name: 'Nominatim / OpenStreetMap',
    endpoint: 'https://nominatim.openstreetmap.org/search',
    requiresKey: false,
    configured: true,
    freeLimit: '1 req/sec; max ~2500 req/day per usage policy',
    notes:
      'Geocoding for the globe location search. No API key needed. Must include a User-Agent header per OSM policy.',
  },
  {
    name: 'Google Maps 3D Tiles',
    endpoint: 'https://tile.googleapis.com/v1/3dtiles/root.json',
    requiresKey: true,
    keyEnvVar: 'GOOGLE_MAPS_API_KEY',
    configured: false,
    freeLimit: '$200/month free credit from Google Cloud',
    notes:
      'Photorealistic 3D globe tiles. Requires GOOGLE_MAPS_API_KEY in .env, served via /api/google-tiles/key. Falls back to terminal mode without it.',
  },
  {
    name: 'YouTube Embeds',
    endpoint: 'https://www.youtube.com/embed/',
    requiresKey: false,
    configured: true,
    freeLimit: 'No limit for embeds; some channels block iframe embedding',
    notes:
      'Live news stream embeds. Uses channel-based live_stream URL for auto-resolving current live. No API key needed for embeds.',
  },
] as const
