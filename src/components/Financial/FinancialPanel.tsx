import { useMarketStore } from '../../store/market'
import { useCryptoFeed } from '../../feeds/crypto'
import { useStockFeed } from '../../feeds/stocks'
import { TickerRow } from './TickerRow'
import { PriceChart } from './PriceChart'
import { MarketHeatmap } from './MarketHeatmap'
import type { FinancialViewMode } from '../../types/market'

const VIEW_MODES: { id: FinancialViewMode; label: string }[] = [
  { id: 'watchlist', label: 'LIST' },
  { id: 'chart', label: 'CHART' },
  { id: 'heatmap', label: 'HEAT' },
]

export function FinancialPanel() {
  // Activate data feeds
  useCryptoFeed()
  useStockFeed()

  const tickers = useMarketStore((s) => s.tickers)
  const watchlist = useMarketStore((s) => s.watchlist)
  const viewMode = useMarketStore((s) => s.viewMode)
  const setViewMode = useMarketStore((s) => s.setViewMode)
  const selectedTicker = useMarketStore((s) => s.selectedTicker)
  const geoLinkedSymbols = useMarketStore((s) => s.geoLinkedSymbols)

  return (
    <div className="flex h-full w-full flex-col border border-[#1a1a2e] bg-[#0d0d12]">
      {/* Header with view mode tabs */}
      <div className="flex items-center justify-between border-b border-[#1a1a2e] px-3 py-1.5">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00ff41]">
          FINANCIAL
        </span>
        <div className="flex gap-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id)}
              className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                viewMode === mode.id
                  ? 'bg-[#00ff41]/10 text-[#00ff41]'
                  : 'text-neutral-600 hover:text-neutral-400'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'watchlist' && (
          <div className="flex h-full flex-col">
            {/* Column headers */}
            <div className="flex items-center gap-2 border-b border-[#1a1a2e] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-700">
              <div style={{ width: '90px' }}>Symbol</div>
              <div style={{ width: '60px' }}>Trend</div>
              <div className="ml-auto text-right" style={{ minWidth: '70px' }}>Price</div>
              <div className="text-right" style={{ minWidth: '60px' }}>24h %</div>
              <div className="text-right hidden xl:block" style={{ minWidth: '50px' }}>Vol</div>
            </div>

            {/* Ticker list */}
            <div className="flex-1 overflow-y-auto">
              {watchlist.map((symbol) => {
                const ticker = tickers[symbol]
                if (!ticker) return null
                const highlighted = geoLinkedSymbols.includes(symbol)
                return (
                  <TickerRow
                    key={symbol}
                    ticker={ticker}
                    highlighted={highlighted}
                  />
                )
              })}
            </div>

            {/* Geo-link indicator */}
            {geoLinkedSymbols.length > 0 && (
              <div className="border-t border-[#1a1a2e] px-3 py-1">
                <span className="font-mono text-[10px] text-neutral-600">
                  GEO-LINKED: {geoLinkedSymbols.length} tickers highlighted
                </span>
              </div>
            )}
          </div>
        )}

        {viewMode === 'chart' && (
          selectedTicker ? (
            <PriceChart />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="font-mono text-xs text-neutral-600">
                SELECT TICKER TO VIEW CHART
              </span>
            </div>
          )
        )}

        {viewMode === 'heatmap' && <MarketHeatmap />}
      </div>
    </div>
  )
}
