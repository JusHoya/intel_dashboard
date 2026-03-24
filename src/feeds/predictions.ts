import { useState, useEffect, useCallback } from 'react'

const SERVER = 'http://localhost:3001'

export interface PredictionMarket {
  id: string
  question: string
  category: string
  probability: number
  volume: number
  endDate: string
  url: string
  outcomes: { name: string; probability: number }[]
}

/**
 * Hook to fetch prediction market data from Polymarket via server proxy.
 * Polls every 5 minutes.
 */
export function usePredictionMarkets() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMarkets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${SERVER}/api/predictions`)
      if (!res.ok) return
      const data = (await res.json()) as { markets: PredictionMarket[] }
      setMarkets(data.markets)
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 300_000) // 5 min
    return () => clearInterval(interval)
  }, [fetchMarkets])

  return { markets, loading }
}
