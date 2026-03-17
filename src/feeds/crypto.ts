import { useEffect, useRef, useCallback } from 'react'
import { useMarketStore } from '../store/market'
import { DEFAULT_WATCHLIST } from '../data/tickers'
import type { BinanceMiniTicker, CandleData } from '../types/market'
import { useAppStore } from '../store/app'

const BINANCE_WS_BASE = 'wss://stream.binance.us:9443'
const SERVER_BASE = 'http://localhost:3001'
const RECONNECT_DELAY_MS = 3_000
const MAX_RECONNECT_DELAY_MS = 30_000

/** Get all Binance symbols from the default watchlist */
function getBinanceSymbols(): { symbol: string; binanceSymbol: string }[] {
  return DEFAULT_WATCHLIST.filter(
    (t): t is typeof t & { binanceSymbol: string } =>
      t.assetClass === 'crypto' && !!t.binanceSymbol,
  ).map((t) => ({ symbol: t.symbol, binanceSymbol: t.binanceSymbol }))
}

/** Map Binance symbol (lowercase) to our display symbol */
function buildSymbolMap(): Map<string, string> {
  const map = new Map<string, string>()
  for (const { symbol, binanceSymbol } of getBinanceSymbols()) {
    map.set(binanceSymbol, symbol)
  }
  return map
}

const SYMBOL_MAP = buildSymbolMap()

/** Fetch current prices for all crypto pairs via REST to seed the store */
async function fetchInitialCryptoPrices(
  updateTicker: (symbol: string, data: Record<string, unknown>) => void,
) {
  const symbols = getBinanceSymbols()
  try {
    // Fetch 24hr ticker stats for all our crypto pairs
    const params = symbols.map((s) => `"${s.binanceSymbol.toUpperCase()}"`).join(',')
    const response = await fetch(
      `https://api.binance.us/api/v3/ticker/24hr?symbols=[${params}]`,
    )
    if (!response.ok) return

    const data = (await response.json()) as Array<{
      symbol: string
      lastPrice: string
      openPrice: string
      highPrice: string
      lowPrice: string
      quoteVolume: string
    }>

    for (const ticker of data) {
      const displaySymbol = SYMBOL_MAP.get(ticker.symbol.toLowerCase())
      if (!displaySymbol) continue

      const close = parseFloat(ticker.lastPrice)
      const open = parseFloat(ticker.openPrice)
      const change = close - open
      const changePct = open > 0 ? (change / open) * 100 : 0

      updateTicker(displaySymbol, {
        price: close,
        change24h: change,
        changePercent24h: changePct,
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
        volume24h: parseFloat(ticker.quoteVolume),
        lastUpdate: Date.now(),
      })
    }
  } catch {
    // Non-fatal — WebSocket will fill in data as trades happen
  }
}

/**
 * Hook that connects to Binance US WebSocket for real-time crypto prices.
 * Seeds initial prices via REST, then streams updates via WebSocket.
 */
export function useCryptoFeed() {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const updateTicker = useMarketStore((s) => s.updateTicker)
  const updateFeedHealth = useAppStore((s) => s.updateFeedHealth)

  const setFeedOnline = useCallback(
    (online: boolean) => {
      updateFeedHealth([
        {
          name: 'CRYPTO',
          status: online ? 'online' : 'offline',
          lastUpdate: online ? new Date() : null,
        },
      ])
    },
    [updateFeedHealth],
  )

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    // Connect to base WS endpoint and subscribe via message
    // (Binance.US does not support the combined /stream?streams= URL format)
    const url = `${BINANCE_WS_BASE}/ws`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      const streams = getBinanceSymbols().map((s) => `${s.binanceSymbol}@miniTicker`)
      ws.send(JSON.stringify({ method: 'SUBSCRIBE', params: streams, id: 1 }))
      reconnectAttemptRef.current = 0
      setFeedOnline(true)
    }

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data) as Record<string, unknown>
        // Ignore subscription confirmation responses
        if ('result' in raw && 'id' in raw) return
        const msg = raw as unknown as BinanceMiniTicker
        if (msg.e !== '24hrMiniTicker') return

        const displaySymbol = SYMBOL_MAP.get(msg.s?.toLowerCase())
        if (!displaySymbol) return

        const close = parseFloat(msg.c)
        const open = parseFloat(msg.o)
        const change = close - open
        const changePct = open > 0 ? (change / open) * 100 : 0

        updateTicker(displaySymbol, {
          price: close,
          change24h: change,
          changePercent24h: changePct,
          high24h: parseFloat(msg.h),
          low24h: parseFloat(msg.l),
          volume24h: parseFloat(msg.q),
          lastUpdate: Date.now(),
        })
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      setFeedOnline(false)
      scheduleReconnect()
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [updateTicker, setFeedOnline])

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return

    const attempt = reconnectAttemptRef.current++
    const delay = Math.min(RECONNECT_DELAY_MS * 2 ** attempt, MAX_RECONNECT_DELAY_MS)

    reconnectTimerRef.current = setTimeout(() => {
      connect()
    }, delay)
  }, [connect])

  useEffect(() => {
    mountedRef.current = true
    // Seed prices via REST immediately (non-blocking), then connect WS for live updates
    fetchInitialCryptoPrices(updateTicker)
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null // Prevent reconnect on intentional close
        wsRef.current.close()
      }
    }
  }, [connect, updateTicker])
}

/**
 * Fetch historical kline (candlestick) data from Binance US REST API.
 * Used to populate the chart when a crypto ticker is selected.
 */
export async function fetchCryptoCandles(
  binanceSymbol: string,
  interval: string = '1h',
  limit: number = 200,
): Promise<CandleData[]> {
  const url = `${SERVER_BASE}/api/crypto/candles?symbol=${encodeURIComponent(binanceSymbol.toUpperCase())}&interval=${encodeURIComponent(interval)}&limit=${limit}`

  const response = await fetch(url)
  if (!response.ok) throw new Error(`Candle API returned ${response.status}`)

  const data = (await response.json()) as unknown[][]

  return data.map((k) => ({
    time: Math.floor((k[0] as number) / 1000), // ms → seconds
    open: parseFloat(k[1] as string),
    high: parseFloat(k[2] as string),
    low: parseFloat(k[3] as string),
    close: parseFloat(k[4] as string),
    volume: parseFloat(k[5] as string),
  }))
}

/**
 * Subscribe to real-time kline updates for a specific symbol.
 * Returns a cleanup function to close the WebSocket.
 */
export function subscribeCryptoKline(
  binanceSymbol: string,
  interval: string,
  onCandle: (candle: CandleData) => void,
): () => void {
  const url = `${BINANCE_WS_BASE}/ws/${binanceSymbol.toLowerCase()}@kline_${interval}`
  const ws = new WebSocket(url)

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as { k: { t: number; o: string; h: string; l: string; c: string; v: string } }
      const k = msg.k
      onCandle({
        time: Math.floor(k.t / 1000),
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      })
    } catch {
      // Ignore malformed
    }
  }

  return () => {
    ws.onclose = null
    ws.close()
  }
}
