import { create } from 'zustand'
import type { Ticker, FinancialViewMode, CandleData } from '../types/market'
import { DEFAULT_WATCHLIST } from '../data/tickers'

interface MarketState {
  /** All tickers keyed by symbol */
  tickers: Record<string, Ticker>
  /** Ordered watchlist symbols */
  watchlist: string[]
  /** Currently selected ticker for chart view */
  selectedTicker: string | null
  /** Current view mode */
  viewMode: FinancialViewMode
  /** Candlestick data for the selected ticker */
  candles: CandleData[]
  /** Symbols highlighted by geo-linking (country selection on globe) */
  geoLinkedSymbols: string[]

  // Actions
  selectTicker: (symbol: string) => void
  clearTicker: () => void
  setViewMode: (mode: FinancialViewMode) => void
  updateTicker: (symbol: string, data: Partial<Ticker>) => void
  setCandles: (candles: CandleData[]) => void
  appendCandle: (candle: CandleData) => void
  setGeoLinkedSymbols: (symbols: string[]) => void
}

/** Build initial ticker state from default watchlist */
function buildInitialTickers(): Record<string, Ticker> {
  const tickers: Record<string, Ticker> = {}
  for (const def of DEFAULT_WATCHLIST) {
    tickers[def.symbol] = {
      symbol: def.symbol,
      name: def.name,
      price: 0,
      prevPrice: 0,
      change24h: 0,
      changePercent24h: 0,
      volume24h: 0,
      high24h: 0,
      low24h: 0,
      assetClass: def.assetClass,
      countries: def.countries,
      sparkline: [],
      lastUpdate: 0,
    }
  }
  return tickers
}

export const useMarketStore = create<MarketState>((set) => ({
  tickers: buildInitialTickers(),
  watchlist: DEFAULT_WATCHLIST.map((d) => d.symbol),
  selectedTicker: null,
  viewMode: 'watchlist',
  candles: [],
  geoLinkedSymbols: [],

  selectTicker: (symbol) => set({ selectedTicker: symbol, viewMode: 'chart' }),
  clearTicker: () => set({ selectedTicker: null, viewMode: 'watchlist', candles: [] }),
  setViewMode: (mode) => set({ viewMode: mode }),

  updateTicker: (symbol, data) =>
    set((state) => {
      const existing = state.tickers[symbol]
      if (!existing) return state

      const updated = { ...existing, ...data }

      // Append to sparkline (keep last 30 points)
      if (data.price && data.price !== existing.price) {
        const sparkline = [...existing.sparkline, data.price]
        if (sparkline.length > 30) sparkline.shift()
        updated.sparkline = sparkline
        updated.prevPrice = existing.price
      }

      return { tickers: { ...state.tickers, [symbol]: updated } }
    }),

  setCandles: (candles) => set({ candles }),

  appendCandle: (candle) =>
    set((state) => {
      const existing = [...state.candles]
      // Replace last candle if same timestamp, otherwise append
      if (existing.length > 0 && existing[existing.length - 1].time === candle.time) {
        existing[existing.length - 1] = candle
      } else {
        existing.push(candle)
      }
      return { candles: existing }
    }),

  setGeoLinkedSymbols: (symbols) => set({ geoLinkedSymbols: symbols }),
}))
