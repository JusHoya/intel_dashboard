import { useState, useMemo, useCallback } from 'react'
import { useSignalStore } from '../../store/signals'
import type {
  IntelSignal,
  SignalCategory,
  Severity,
  AssetDirection,
  SignalStatus,
} from '../../signals/types'

// ---------------------------------------------------------------------------
// Color / label maps
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<SignalCategory, string> = {
  conflict: '#ff4444',
  sanctions: '#ff8800',
  energy: '#ffcc00',
  political: '#ff6b9d',
  disaster: '#ff4444',
  cyber: '#00ccff',
  monetary: '#aa88ff',
  'supply-chain': '#ff8844',
}

const CATEGORY_LABELS: Record<SignalCategory, string> = {
  conflict: 'CONFLICT',
  sanctions: 'SANCTIONS',
  energy: 'ENERGY',
  political: 'POLITICAL',
  disaster: 'DISASTER',
  cyber: 'CYBER',
  monetary: 'MONETARY',
  'supply-chain': 'SUPPLY CHAIN',
}

const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#ff0040',
  high: '#ff4400',
  medium: '#ffaa00',
  low: '#00ff41',
}

const DIRECTION_ARROWS: Record<AssetDirection, string> = {
  bullish: '\u2191',
  bearish: '\u2193',
  volatile: '\u2195',
}

const DIRECTION_COLORS: Record<AssetDirection, string> = {
  bullish: '#00ff41',
  bearish: '#ff4444',
  volatile: '#ffaa00',
}

const STATUS_LABELS: Record<SignalStatus, string> = {
  active: 'ACTIVE',
  developing: 'DEVELOPING',
  resolved: 'RESOLVED',
}

const ALL_CATEGORIES: SignalCategory[] = [
  'conflict',
  'sanctions',
  'energy',
  'political',
  'disaster',
  'cyber',
  'monetary',
  'supply-chain',
]

type ViewMode = 'active' | 'detail'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeTime(timestamp: number): string {
  const delta = Date.now() - timestamp
  const seconds = Math.floor(delta / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

const HORIZON_LABELS: Record<IntelSignal['timeHorizon'], string> = {
  immediate: '< 24h',
  short: '1-7 days',
  medium: '1-4 weeks',
  long: '1-6 months',
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
      style={{
        color: SEVERITY_COLORS[severity],
        border: `1px solid ${SEVERITY_COLORS[severity]}`,
        backgroundColor: `${SEVERITY_COLORS[severity]}10`,
      }}
    >
      {severity}
    </span>
  )
}

function CategoryBadge({ category }: { category: SignalCategory }) {
  return (
    <span
      className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest"
      style={{
        color: CATEGORY_COLORS[category],
        border: `1px solid ${CATEGORY_COLORS[category]}`,
        backgroundColor: `${CATEGORY_COLORS[category]}10`,
      }}
    >
      {CATEGORY_LABELS[category]}
    </span>
  )
}

function StatusDot({ status }: { status: SignalStatus }) {
  if (status === 'active') {
    return (
      <span className="relative flex h-2 w-2">
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{ backgroundColor: '#00ff41' }}
        />
        <span
          className="relative inline-flex h-2 w-2 rounded-full"
          style={{ backgroundColor: '#00ff41' }}
        />
      </span>
    )
  }
  if (status === 'developing') {
    return (
      <span
        className="inline-flex h-2 w-2 rounded-full"
        style={{ backgroundColor: '#ffaa00' }}
      />
    )
  }
  return (
    <span
      className="inline-flex h-2 w-2 rounded-full opacity-40"
      style={{ backgroundColor: '#666666' }}
    />
  )
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value))
  const color =
    pct >= 80 ? '#00ff41' : pct >= 50 ? '#ffaa00' : '#ff4444'

  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 flex-1 rounded-full bg-[#1a1a2e]">
        <div
          className="h-1 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[9px] text-neutral-500">
        {pct}%
      </span>
    </div>
  )
}

function ScanningAnimation() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="relative h-16 w-16">
        {/* Outer ring */}
        <div
          className="absolute inset-0 animate-spin rounded-full border border-[#00ff41]/20"
          style={{ animationDuration: '4s' }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-2 animate-spin rounded-full border border-[#00ff41]/40"
          style={{ animationDuration: '2.5s', animationDirection: 'reverse' }}
        />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff41] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff41]" />
          </span>
        </div>
      </div>
      <span className="font-mono text-xs tracking-widest text-[#00ff41]/60">
        NO ACTIVE SIGNALS
      </span>
      <span className="font-mono text-[10px] text-neutral-700">
        Monitoring intelligence feeds...
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Signal Card (list view)
// ---------------------------------------------------------------------------

function SignalCard({
  signal,
  onClick,
}: {
  signal: IntelSignal
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-1.5 border-b border-[#1a1a2e] px-3 py-2.5 text-left transition-colors hover:bg-[#00ff41]/5"
      style={{ borderLeft: `3px solid ${CATEGORY_COLORS[signal.category]}` }}
    >
      {/* Row 1: severity + category + timestamp + status */}
      <div className="flex items-center gap-1.5">
        <SeverityBadge severity={signal.severity} />
        <CategoryBadge category={signal.category} />
        <span className="ml-auto flex items-center gap-1.5">
          <StatusDot status={signal.status} />
          <span className="font-mono text-[9px] text-neutral-600">
            {STATUS_LABELS[signal.status]}
          </span>
        </span>
        <span className="font-mono text-[10px] text-neutral-600">
          {relativeTime(signal.timestamp)}
        </span>
      </div>

      {/* Row 2: summary text (truncated to 2 lines) */}
      <p className="line-clamp-2 font-mono text-xs leading-relaxed text-neutral-300">
        {signal.summary}
      </p>

      {/* Row 3: confidence bar */}
      <ConfidenceBar value={signal.confidence} />

      {/* Row 4: affected assets */}
      {signal.affectedAssets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {signal.affectedAssets.map((asset) => (
            <span
              key={asset.ticker}
              className="flex items-center gap-0.5 rounded border border-[#1a1a2e] px-1.5 py-0.5 font-mono text-[9px]"
              style={{ color: DIRECTION_COLORS[asset.direction] }}
            >
              {asset.ticker}
              <span className="text-[10px]">
                {DIRECTION_ARROWS[asset.direction]}
              </span>
            </span>
          ))}
        </div>
      )}

      {/* Row 5: countries */}
      {signal.countries.length > 0 && (
        <span className="font-mono text-[9px] text-neutral-600">
          {signal.countries.join(', ')}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Detail View
// ---------------------------------------------------------------------------

function SignalDetail({
  signal,
  onBack,
}: {
  signal: IntelSignal
  onBack: () => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 border-b border-[#1a1a2e] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-neutral-500 transition-colors hover:text-[#00ff41]"
      >
        <span>&larr;</span> BACK TO LIST
      </button>

      <div className="flex flex-col gap-4 p-3">
        {/* Badges row */}
        <div className="flex flex-wrap items-center gap-1.5">
          <SeverityBadge severity={signal.severity} />
          <CategoryBadge category={signal.category} />
          <span className="flex items-center gap-1.5">
            <StatusDot status={signal.status} />
            <span className="font-mono text-[9px] text-neutral-500">
              {STATUS_LABELS[signal.status]}
            </span>
          </span>
        </div>

        {/* Full summary */}
        <p className="font-mono text-xs leading-relaxed text-neutral-200">
          {signal.summary}
        </p>

        {/* Confidence + time horizon */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
              Confidence
            </span>
            <div className="mt-1">
              <ConfidenceBar value={signal.confidence} />
            </div>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
              Time Horizon
            </span>
            <div className="mt-1 font-mono text-xs text-[#00ff41]">
              {HORIZON_LABELS[signal.timeHorizon]}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-[#1a1a2e]" />

        {/* Affected assets */}
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
            Affected Assets
          </span>
          <div className="mt-2 flex flex-col gap-2">
            {signal.affectedAssets.map((asset) => (
              <div
                key={asset.ticker}
                className="rounded border border-[#1a1a2e] bg-[#0a0a10] p-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: DIRECTION_COLORS[asset.direction] }}
                  >
                    {asset.ticker}
                  </span>
                  <span
                    className="font-mono text-sm"
                    style={{ color: DIRECTION_COLORS[asset.direction] }}
                  >
                    {DIRECTION_ARROWS[asset.direction]}
                  </span>
                  <span className="font-mono text-[9px] uppercase text-neutral-600">
                    {asset.direction}
                  </span>
                  <span className="ml-auto font-mono text-[9px] uppercase text-neutral-600">
                    {asset.assetClass}
                  </span>
                </div>
                <div className="mt-1">
                  <ConfidenceBar value={asset.confidence} />
                </div>
                <p className="mt-1 font-mono text-[10px] leading-relaxed text-neutral-500">
                  {asset.reasoning}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-[#1a1a2e]" />

        {/* Sources */}
        {signal.sources.length > 0 && (
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
              Sources
            </span>
            <div className="mt-1 flex flex-col gap-0.5">
              {signal.sources.map((source) => (
                <span
                  key={source}
                  className="font-mono text-[10px] text-neutral-400"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Countries */}
        {signal.countries.length > 0 && (
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
              Countries
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {signal.countries.map((country) => (
                <span
                  key={country}
                  className="rounded border border-[#1a1a2e] px-1.5 py-0.5 font-mono text-[9px] text-neutral-400"
                >
                  {country}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="border-t border-[#1a1a2e] pt-2">
          <span className="font-mono text-[10px] text-neutral-700">
            {new Date(signal.timestamp).toISOString()}
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

export function SignalPanel() {
  const signals = useSignalStore((s) => s.signals)
  const selectedSignal = useSignalStore((s) => s.selectedSignal)
  const filterCategory = useSignalStore((s) => s.filterCategory)
  const selectSignal = useSignalStore((s) => s.selectSignal)
  const setFilterCategory = useSignalStore((s) => s.setFilterCategory)

  const [viewMode, setViewMode] = useState<ViewMode>('active')

  const filteredSignals = useMemo(() => {
    let result = signals
    if (filterCategory) {
      result = result.filter((s) => s.category === filterCategory)
    }
    // Sort: active first, then developing, then resolved; within each group, newest first
    const statusOrder: Record<string, number> = {
      active: 0,
      developing: 1,
      resolved: 2,
    }
    return [...result].sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return b.timestamp - a.timestamp
    })
  }, [signals, filterCategory])

  const activeCount = useMemo(
    () => signals.filter((s) => s.status !== 'resolved').length,
    [signals]
  )

  const handleSelectSignal = useCallback(
    (signal: IntelSignal) => {
      selectSignal(signal)
      setViewMode('detail')
    },
    [selectSignal]
  )

  const handleBack = useCallback(() => {
    selectSignal(null)
    setViewMode('active')
  }, [selectSignal])

  return (
    <div className="flex h-full w-full flex-col border border-[#1a1a2e] bg-[#0d0d12]">
      {/* Header with view mode tabs */}
      <div className="flex items-center justify-between border-b border-[#1a1a2e] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00ff41]">
            SIGNALS
          </span>
          {activeCount > 0 && (
            <span className="rounded bg-[#00ff41]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#00ff41]">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => {
              setViewMode('active')
              selectSignal(null)
            }}
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              viewMode === 'active'
                ? 'bg-[#00ff41]/10 text-[#00ff41]'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            ACTIVE
          </button>
          <button
            type="button"
            onClick={() => {
              if (selectedSignal) setViewMode('detail')
            }}
            className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              viewMode === 'detail'
                ? 'bg-[#00ff41]/10 text-[#00ff41]'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            DETAIL
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {viewMode === 'active' && (
          <>
            {/* Category filter bar */}
            <div className="flex flex-wrap gap-1 border-b border-[#1a1a2e] px-3 py-1.5">
              <button
                type="button"
                onClick={() => setFilterCategory(null)}
                className={`rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors ${
                  filterCategory === null
                    ? 'bg-[#00ff41]/15 text-[#00ff41]'
                    : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                ALL
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setFilterCategory(filterCategory === cat ? null : cat)
                  }
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors"
                  style={{
                    color:
                      filterCategory === cat
                        ? CATEGORY_COLORS[cat]
                        : undefined,
                    backgroundColor:
                      filterCategory === cat
                        ? `${CATEGORY_COLORS[cat]}15`
                        : undefined,
                  }}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[cat] }}
                  />
                  <span
                    className={
                      filterCategory === cat
                        ? ''
                        : 'text-neutral-600 hover:text-neutral-400'
                    }
                  >
                    {CATEGORY_LABELS[cat]}
                  </span>
                </button>
              ))}
            </div>

            {/* Signal list */}
            {filteredSignals.length === 0 ? (
              <ScanningAnimation />
            ) : (
              <div className="flex-1 overflow-y-auto">
                {filteredSignals.map((signal) => (
                  <SignalCard
                    key={signal.id}
                    signal={signal}
                    onClick={() => handleSelectSignal(signal)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {viewMode === 'detail' &&
          (selectedSignal ? (
            <SignalDetail signal={selectedSignal} onBack={handleBack} />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <span className="font-mono text-xs text-neutral-600">
                SELECT A SIGNAL TO VIEW DETAILS
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
