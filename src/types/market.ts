/** Asset class categories */
export type AssetClass = 'crypto' | 'equity' | 'commodity' | 'forex'

/** A ticker in the watchlist */
export interface Ticker {
  symbol: string
  name: string
  price: number
  prevPrice: number
  change24h: number
  changePercent24h: number
  volume24h: number
  high24h: number
  low24h: number
  assetClass: AssetClass
  /** ISO country codes this ticker is linked to (for geo-linking) */
  countries: string[]
  /** Recent price snapshots for sparkline rendering */
  sparkline: number[]
  lastUpdate: number
}

/** Candlestick data point for charting */
export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

/** View modes for the financial panel */
export type FinancialViewMode = 'watchlist' | 'chart' | 'heatmap'

/** Binance 24hr mini ticker WebSocket message */
export interface BinanceMiniTicker {
  e: '24hrMiniTicker'
  E: number // Event time
  s: string // Symbol (e.g. BTCUSDT)
  c: string // Close price
  o: string // Open price
  h: string // High price
  l: string // Low price
  v: string // Total traded base asset volume
  q: string // Total traded quote asset volume
}

/** Binance kline/candlestick WebSocket message */
export interface BinanceKline {
  t: number // Kline start time
  T: number // Kline close time
  o: string // Open
  h: string // High
  l: string // Low
  c: string // Close
  v: string // Volume
  x: boolean // Is this kline closed?
}

/** Stock quote from server proxy */
export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  prevClose: number
}
