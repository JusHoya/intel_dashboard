import type { Ticker } from '../../types/market'
import { useMarketStore } from '../../store/market'
import { Sparkline } from './Sparkline'

interface TickerRowProps {
  ticker: Ticker
  highlighted: boolean
}

/** Format price with appropriate decimals */
function formatPrice(price: number, assetClass: string): string {
  if (price === 0) return '—'
  if (assetClass === 'crypto') {
    if (price >= 1000) return price.toFixed(2)
    if (price >= 1) return price.toFixed(4)
    return price.toFixed(6)
  }
  return price.toFixed(2)
}

/** Format volume in compact form */
function formatVolume(vol: number): string {
  if (vol === 0) return '—'
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`
  return vol.toFixed(0)
}

export function TickerRow({ ticker, highlighted }: TickerRowProps) {
  const selectTicker = useMarketStore((s) => s.selectTicker)
  const isPositive = ticker.changePercent24h >= 0
  const changeColor = isPositive ? 'text-[#00ff41]' : 'text-[#ff0040]'
  const sign = isPositive ? '+' : ''
  const flashClass = ticker.prevPrice !== 0 && ticker.price !== ticker.prevPrice
    ? ticker.price > ticker.prevPrice ? 'animate-flash-green' : 'animate-flash-red'
    : ''

  return (
    <button
      type="button"
      onClick={() => selectTicker(ticker.symbol)}
      className={`flex w-full items-center gap-2 px-3 py-1.5 font-mono text-xs transition-colors hover:bg-[#1a1a2e] ${
        highlighted ? 'bg-[#1a1a2e] border-l-2 border-l-[#00ff41]' : ''
      }`}
    >
      {/* Symbol & name */}
      <div className="flex min-w-0 flex-col items-start" style={{ width: '90px' }}>
        <span className="text-[#00ff41] font-semibold truncate">{ticker.symbol}</span>
        <span className="text-[10px] text-neutral-600 truncate max-w-full">{ticker.name}</span>
      </div>

      {/* Sparkline */}
      <div className="shrink-0">
        <Sparkline data={ticker.sparkline} positive={isPositive} />
      </div>

      {/* Price */}
      <div className={`ml-auto text-right shrink-0 ${flashClass}`} style={{ minWidth: '70px' }}>
        <span className="text-[#e0e0e0]">
          {formatPrice(ticker.price, ticker.assetClass)}
        </span>
      </div>

      {/* Change % */}
      <div className="text-right shrink-0" style={{ minWidth: '60px' }}>
        <span className={changeColor}>
          {ticker.price === 0 ? '—' : `${sign}${ticker.changePercent24h.toFixed(2)}%`}
        </span>
      </div>

      {/* Volume */}
      <div className="text-right text-neutral-500 shrink-0 hidden xl:block" style={{ minWidth: '50px' }}>
        {formatVolume(ticker.volume24h)}
      </div>
    </button>
  )
}
