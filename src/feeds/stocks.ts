import { useEffect, useRef } from 'react'
import { useMarketStore } from '../store/market'
import { DEFAULT_WATCHLIST } from '../data/tickers'
import { useAppStore } from '../store/app'
import type { StockQuote } from '../types/market'

const POLL_INTERVAL_MS = 60_000 // 1 minute (stocks update less frequently)
const SERVER_BASE = 'http://localhost:3001'

/** Get all equity symbols from the default watchlist */
function getStockSymbols(): string[] {
  return DEFAULT_WATCHLIST.filter((t) => t.assetClass === 'equity').map((t) => t.symbol)
}

/**
 * Hook that polls the server proxy for stock price data.
 * Updates the market store with latest quotes.
 */
export function useStockFeed() {
  const updateTicker = useMarketStore((s) => s.updateTicker)
  const updateFeedHealth = useAppStore((s) => s.updateFeedHealth)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let mounted = true

    async function fetchStocks() {
      const symbols = getStockSymbols()
      try {
        const response = await fetch(
          `${SERVER_BASE}/api/stocks?symbols=${symbols.join(',')}`,
        )
        if (!response.ok) throw new Error(`Stock API returned ${response.status}`)

        const data = (await response.json()) as { quotes: StockQuote[] }

        if (!mounted) return

        for (const quote of data.quotes) {
          updateTicker(quote.symbol, {
            price: quote.price,
            change24h: quote.change,
            changePercent24h: quote.changePercent,
            volume24h: quote.volume,
            high24h: quote.high,
            low24h: quote.low,
            lastUpdate: Date.now(),
          })
        }

        updateFeedHealth([
          { name: 'STOCKS', status: 'online', lastUpdate: new Date() },
        ])
      } catch {
        if (!mounted) return
        updateFeedHealth([
          { name: 'STOCKS', status: 'offline', lastUpdate: null },
        ])
      }
    }

    // Fetch immediately, then poll
    fetchStocks()
    timerRef.current = setInterval(fetchStocks, POLL_INTERVAL_MS)

    return () => {
      mounted = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [updateTicker, updateFeedHealth])
}
