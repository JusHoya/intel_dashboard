import { usePredictionMarkets, type PredictionMarket } from '../../feeds/predictions'

const CATEGORY_COLORS: Record<string, string> = {
  conflict: '#ff4444',
  politics: '#aa66ff',
  markets: '#00ff41',
  technology: '#44aaff',
  disaster: '#ffaa00',
  geopolitics: '#ff6644',
}

function ProbabilityBar({ probability }: { probability: number }) {
  const pct = Math.round(probability * 100)
  const color = pct >= 70 ? '#00ff41' : pct >= 40 ? '#ffaa00' : '#ff4444'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-neutral-800">
        <div
          style={{ width: `${pct}%`, backgroundColor: color }}
          className="h-full transition-all"
        />
      </div>
      <span className="shrink-0 font-mono text-[10px] font-bold" style={{ color }}>
        {pct}%
      </span>
    </div>
  )
}

function MarketCard({ market }: { market: PredictionMarket }) {
  const catColor = CATEGORY_COLORS[market.category] || '#888'

  return (
    <a
      href={market.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-1.5 border-b border-[#1a1a2e]/50 px-3 py-2 transition-colors hover:bg-[#00ff41]/5"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs leading-tight text-neutral-300 group-hover:text-[#00ff41]">
          {market.question}
        </span>
        <span
          className="shrink-0 rounded border px-1 py-px font-mono text-[8px] font-bold uppercase tracking-widest"
          style={{ color: catColor, borderColor: `${catColor}40` }}
        >
          {market.category}
        </span>
      </div>

      {market.outcomes.length > 0 && (
        <div className="flex flex-col gap-1">
          {market.outcomes.slice(0, 3).map((outcome) => (
            <div key={outcome.name} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate font-mono text-[10px] text-neutral-500">
                {outcome.name}
              </span>
              <ProbabilityBar probability={outcome.probability} />
            </div>
          ))}
        </div>
      )}

      {market.volume > 0 && (
        <span className="font-mono text-[9px] text-neutral-600">
          VOL: ${market.volume > 1000 ? `${(market.volume / 1000).toFixed(0)}K` : market.volume.toFixed(0)}
        </span>
      )}
    </a>
  )
}

/**
 * Panel displaying prediction market data (Polymarket).
 * Shows geopolitical event probabilities with outcome bars.
 */
export function PredictionPanel() {
  const { markets, loading } = usePredictionMarkets()

  if (loading && markets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-mono text-xs text-neutral-600">
          LOADING MARKETS...
        </span>
      </div>
    )
  }

  if (markets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-mono text-xs text-neutral-600">
          NO MARKETS AVAILABLE
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {markets.map((market) => (
          <MarketCard key={market.id} market={market} />
        ))}
      </div>
      <div className="border-t border-[#1a1a2e] px-3 py-1">
        <span className="font-mono text-[10px] text-neutral-600">
          {markets.length} MARKETS · POLYMARKET
          {loading ? ' · UPDATING...' : ''}
        </span>
      </div>
    </div>
  )
}
