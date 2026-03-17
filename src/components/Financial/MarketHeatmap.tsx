import { useMarketStore } from '../../store/market'

/** Color intensity based on change percentage */
function getHeatColor(changePct: number): string {
  const absChange = Math.min(Math.abs(changePct), 10) // cap at ±10%
  const intensity = absChange / 10

  if (changePct >= 0) {
    // Green: from dim to bright
    const g = Math.floor(80 + intensity * 175)
    const r = Math.floor(intensity * 20)
    return `rgb(${r}, ${g}, 0)`
  } else {
    // Red: from dim to bright
    const r = Math.floor(80 + intensity * 175)
    const g = Math.floor(intensity * 10)
    return `rgb(${r}, ${g}, ${Math.floor(intensity * 20)})`
  }
}

export function MarketHeatmap() {
  const tickers = useMarketStore((s) => s.tickers)
  const watchlist = useMarketStore((s) => s.watchlist)
  const selectTicker = useMarketStore((s) => s.selectTicker)

  const items = watchlist
    .map((sym) => tickers[sym])
    .filter((t) => t && t.price > 0)

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0d0d12]">
        <span className="font-mono text-xs text-neutral-600">
          WAITING FOR MARKET DATA...
        </span>
      </div>
    )
  }

  // Sort by volume for visual weight
  const sorted = [...items].sort((a, b) => b.volume24h - a.volume24h)

  return (
    <div className="grid h-full w-full gap-[1px] bg-[#0a0a0f] p-1"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(80px, 1fr))`,
        gridAutoRows: 'minmax(50px, 1fr)',
      }}
    >
      {sorted.map((ticker) => {
        const bgColor = getHeatColor(ticker.changePercent24h)
        const sign = ticker.changePercent24h >= 0 ? '+' : ''

        return (
          <button
            key={ticker.symbol}
            type="button"
            onClick={() => selectTicker(ticker.symbol)}
            className="flex flex-col items-center justify-center p-1 font-mono transition-opacity hover:opacity-80"
            style={{ backgroundColor: bgColor }}
          >
            <span className="text-[10px] font-bold text-white/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {ticker.symbol}
            </span>
            <span className="text-[9px] text-white/70 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
              {sign}{ticker.changePercent24h.toFixed(1)}%
            </span>
          </button>
        )
      })}
    </div>
  )
}
