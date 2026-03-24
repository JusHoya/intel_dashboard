import { getMediaBias, BIAS_COLORS, BIAS_LABELS, BIAS_NAMES, type BiasRating } from '../../data/mediaBias'

interface BiasBadgeProps {
  /** News source domain (e.g., "reuters.com", "foxnews.com") */
  source: string
  /** Show full label instead of abbreviation */
  full?: boolean
}

/**
 * Renders a compact bias indicator badge for a news source.
 * Color-coded across the political spectrum.
 */
export function BiasBadge({ source, full = false }: BiasBadgeProps) {
  const entry = getMediaBias(source)
  if (!entry) return null

  const color = BIAS_COLORS[entry.bias]
  const label = full ? BIAS_NAMES[entry.bias] : BIAS_LABELS[entry.bias]

  return (
    <span
      className="shrink-0 rounded border px-1 py-px font-mono text-[8px] font-bold uppercase tracking-widest"
      style={{
        color,
        borderColor: `${color}40`,
      }}
      title={`${entry.name}: ${BIAS_NAMES[entry.bias]} bias | Factual: ${Math.round(entry.factual * 100)}% | ${entry.description}`}
    >
      {label}
    </span>
  )
}

interface BiasBarProps {
  /** Distribution counts per bias rating */
  distribution: Record<BiasRating, number>
  /** Total articles with known bias */
  knownCount: number
}

/**
 * A horizontal bar showing the bias distribution of the current feed.
 * Each segment is proportional to the count of articles with that bias.
 */
export function BiasBar({ distribution, knownCount }: BiasBarProps) {
  if (knownCount === 0) return null

  const ratings: BiasRating[] = ['far-left', 'left', 'center-left', 'center', 'center-right', 'right', 'far-right']

  return (
    <div className="flex h-1.5 w-full overflow-hidden rounded-sm bg-neutral-900">
      {ratings.map((rating) => {
        const count = distribution[rating]
        if (count === 0) return null
        const pct = (count / knownCount) * 100
        return (
          <div
            key={rating}
            style={{
              width: `${pct}%`,
              backgroundColor: BIAS_COLORS[rating],
              minWidth: count > 0 ? 2 : 0,
            }}
            title={`${BIAS_NAMES[rating]}: ${count} articles`}
          />
        )
      })}
    </div>
  )
}

interface FactualDotProps {
  /** Factual reporting score 0-1 */
  score: number
}

/**
 * A small dot indicator for factual reporting reliability.
 * Green = high, yellow = medium, red = low.
 */
export function FactualDot({ score }: FactualDotProps) {
  let color: string
  if (score >= 0.8) color = '#00ff41'       // green — high reliability
  else if (score >= 0.6) color = '#ffaa00'  // amber — moderate
  else if (score >= 0.4) color = '#ff6600'  // orange — mixed
  else color = '#ff0044'                     // red — low/propaganda

  return (
    <span
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      title={`Factual reporting: ${Math.round(score * 100)}%`}
    />
  )
}
