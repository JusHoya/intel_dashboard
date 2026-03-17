import { useEffect, useRef } from 'react'
import { createChart, CandlestickSeries, type IChartApi, type ISeriesApi, ColorType } from 'lightweight-charts'
import { useMarketStore } from '../../store/market'
import { DEFAULT_WATCHLIST } from '../../data/tickers'
import { fetchCryptoCandles, subscribeCryptoKline } from '../../feeds/crypto'

/** Terminal theme for the chart */
const CHART_OPTIONS = {
  layout: {
    background: { type: ColorType.Solid as const, color: '#0d0d12' },
    textColor: '#3a3a4a',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
  },
  grid: {
    vertLines: { color: '#1a1a2e' },
    horzLines: { color: '#1a1a2e' },
  },
  crosshair: {
    vertLine: { color: '#00ff4180', labelBackgroundColor: '#0d0d12' },
    horzLine: { color: '#00ff4180', labelBackgroundColor: '#0d0d12' },
  },
  timeScale: {
    borderColor: '#1a1a2e',
    timeVisible: true,
  },
  rightPriceScale: {
    borderColor: '#1a1a2e',
  },
}

export function PriceChart() {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  const selectedTicker = useMarketStore((s) => s.selectedTicker)
  const clearTicker = useMarketStore((s) => s.clearTicker)

  // Create chart on mount
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      ...CHART_OPTIONS,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      autoSize: true,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff41',
      downColor: '#ff0040',
      borderDownColor: '#ff0040',
      borderUpColor: '#00ff41',
      wickDownColor: '#ff004080',
      wickUpColor: '#00ff4180',
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // Load data when selected ticker changes
  useEffect(() => {
    if (!selectedTicker || !seriesRef.current) return

    const series = seriesRef.current
    series.setData([]) // Clear old data

    // Find the Binance symbol
    const tickerDef = DEFAULT_WATCHLIST.find((t) => t.symbol === selectedTicker)
    if (!tickerDef || tickerDef.assetClass !== 'crypto' || !tickerDef.binanceSymbol) {
      // For non-crypto tickers, show empty chart with message
      return
    }

    let klineCleanup: (() => void) | null = null

    // Fetch historical candles
    fetchCryptoCandles(tickerDef.binanceSymbol, '1h', 200)
      .then((candles) => {
        if (!seriesRef.current) return
        seriesRef.current.setData(candles as Parameters<typeof series.setData>[0])
        chartRef.current?.timeScale().fitContent()

        // Subscribe to real-time kline updates
        klineCleanup = subscribeCryptoKline(
          tickerDef.binanceSymbol!,
          '1h',
          (candle) => {
            if (!seriesRef.current) return
            seriesRef.current.update(candle as Parameters<typeof series.update>[0])
          },
        )
      })
      .catch((err) => {
        console.warn('[chart] Failed to load candles:', err)
      })

    return () => {
      if (klineCleanup) klineCleanup()
    }
  }, [selectedTicker])

  return (
    <div className="flex h-full w-full flex-col bg-[#0d0d12]">
      {/* Chart header */}
      <div className="flex items-center justify-between border-b border-[#1a1a2e] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[#00ff41]">
            {selectedTicker ?? '—'}
          </span>
          <span className="font-mono text-[10px] text-neutral-600">1H</span>
        </div>
        <button
          type="button"
          onClick={clearTicker}
          className="font-mono text-[10px] uppercase tracking-widest text-neutral-600 transition-colors hover:text-[#00ff41]"
        >
          [CLOSE]
        </button>
      </div>

      {/* Chart container */}
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
