import { useMemo } from 'react'
import { useNewsStore } from '../../store/news'
import { getMediaBias, computeBiasBalance } from '../../data/mediaBias'
import { BiasBadge, BiasBar, FactualDot } from './BiasBadge'

/** Format GDELT date string (YYYYMMDDTHHmmSS → relative time) */
function formatTime(dateStr: string): string {
  try {
    // GDELT format: "20260322T143000Z" or ISO-ish
    let d: Date
    if (dateStr.includes('T') && dateStr.length >= 15 && !dateStr.includes('-')) {
      // GDELT compact format: YYYYMMDDTHHmmSSZ
      const y = dateStr.slice(0, 4)
      const m = dateStr.slice(4, 6)
      const day = dateStr.slice(6, 8)
      const h = dateStr.slice(9, 11)
      const min = dateStr.slice(11, 13)
      const s = dateStr.slice(13, 15)
      d = new Date(`${y}-${m}-${day}T${h}:${min}:${s}Z`)
    } else {
      d = new Date(dateStr)
    }

    if (isNaN(d.getTime())) return dateStr

    const diffMs = Date.now() - d.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    if (diffMin < 1) return 'NOW'
    if (diffMin < 60) return `${diffMin}m`
    const diffH = Math.floor(diffMin / 60)
    if (diffH < 24) return `${diffH}h`
    const diffD = Math.floor(diffH / 24)
    return `${diffD}d`
  } catch {
    return dateStr
  }
}

/** Sentiment badge based on GDELT tone score */
function ToneBadge({ tone }: { tone: number }) {
  let color: string
  let label: string

  if (tone <= -5) {
    color = 'text-red-400 border-red-400/30'
    label = 'NEG'
  } else if (tone <= -1) {
    color = 'text-orange-400 border-orange-400/30'
    label = 'NEG'
  } else if (tone >= 5) {
    color = 'text-emerald-400 border-emerald-400/30'
    label = 'POS'
  } else if (tone >= 1) {
    color = 'text-green-400 border-green-400/30'
    label = 'POS'
  } else {
    color = 'text-neutral-500 border-neutral-600'
    label = 'NEU'
  }

  return (
    <span
      className={`shrink-0 rounded border px-1 py-px font-mono text-[8px] font-bold uppercase tracking-widest ${color}`}
    >
      {label}
    </span>
  )
}

export function NewsFeed() {
  const items = useNewsStore((s) => s.items)
  const loading = useNewsStore((s) => s.loading)

  // Compute aggregate bias balance across all current articles
  const biasBalance = useMemo(() => {
    const sources = items.map((item) => item.domain || item.source)
    return computeBiasBalance(sources)
  }, [items])

  if (loading && items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-mono text-xs text-neutral-600">
          ACQUIRING INTEL...
        </span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="font-mono text-xs text-neutral-600">
          NO INTEL AVAILABLE
        </span>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 border-b border-[#1a1a2e] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-neutral-700">
        <div className="w-7">Time</div>
        <div className="flex-1">Headline</div>
        <div className="w-7 text-center">Bias</div>
        <div className="w-8 text-center">Tone</div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2 border-b border-[#1a1a2e]/50 px-3 py-2 transition-colors hover:bg-[#00ff41]/5"
          >
            {/* Timestamp */}
            <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-neutral-600">
              {formatTime(item.publishedAt)}
            </span>

            {/* Headline + source */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-mono text-xs leading-tight text-neutral-300 group-hover:text-[#00ff41]">
                {item.title}
              </span>
              <span className="flex items-center gap-1 font-mono text-[10px] text-neutral-600">
                {(() => {
                  const bias = getMediaBias(item.domain || item.source)
                  return bias ? <FactualDot score={bias.factual} /> : null
                })()}
                {item.source}
                {item.sourceCountry ? ` · ${item.sourceCountry}` : ''}
              </span>
            </div>

            {/* Bias indicator */}
            <BiasBadge source={item.domain || item.source} />

            {/* Sentiment */}
            <ToneBadge tone={item.tone} />
          </a>
        ))}
      </div>

      {/* Footer with count + bias balance */}
      <div className="flex flex-col gap-1 border-t border-[#1a1a2e] px-3 py-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-neutral-600">
            {items.length} ARTICLES · GDELT
            {loading ? ' · UPDATING...' : ''}
          </span>
          {biasBalance.knownCount > 0 && (
            <span
              className="font-mono text-[10px] font-bold"
              style={{
                color: Math.abs(biasBalance.score) < 0.3
                  ? '#00ff41'
                  : Math.abs(biasBalance.score) < 1
                    ? '#ffaa00'
                    : '#ff4444',
              }}
              title={`Feed balance: ${biasBalance.score.toFixed(2)} (${biasBalance.knownCount}/${biasBalance.totalCount} sources identified)`}
            >
              {biasBalance.label}
            </span>
          )}
        </div>
        {biasBalance.knownCount > 0 && (
          <BiasBar distribution={biasBalance.distribution} knownCount={biasBalance.knownCount} />
        )}
      </div>
    </div>
  )
}
