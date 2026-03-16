import { useGlobeStore } from '../../store/globe'

const entityTypeColors: Record<string, string> = {
  country: 'border-[#00ff41] text-[#00ff41]',
  city: 'border-cyan-400 text-cyan-400',
  flight: 'border-yellow-400 text-yellow-400',
  satellite: 'border-purple-400 text-purple-400',
}

/** Human-readable labels for metadata keys */
const FIELD_LABELS: Record<string, string> = {
  callsign: 'Callsign',
  origin_country: 'Origin',
  velocity: 'Speed',
  altitude: 'Altitude',
  iso_a3: 'ISO Code',
  region: 'Region',
  name: 'Name',
  country: 'Country',
}

/** Units for metadata fields */
const FIELD_UNITS: Record<string, string> = {
  velocity: 'm/s',
  altitude: 'm',
}

/** Format a metadata value with units */
function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return '—'

  const unit = FIELD_UNITS[key]
  if (unit && typeof value === 'number') {
    if (key === 'velocity') {
      const knots = value * 1.944
      return `${value.toFixed(1)} ${unit} (${knots.toFixed(0)} kts)`
    }
    if (key === 'altitude') {
      const feet = value * 3.281
      return `${value.toFixed(0)} ${unit} (${feet.toFixed(0)} ft)`
    }
    return `${value} ${unit}`
  }

  return String(value)
}

/** Keys to exclude from metadata display */
const HIDDEN_KEYS = new Set(['entityType'])

export function InfoPanel() {
  const selectedEntity = useGlobeStore((s) => s.selectedEntity)
  const clearSelection = useGlobeStore((s) => s.clearSelection)

  return (
    <div className="flex h-full w-full flex-col border border-[#1a1a2e] bg-[#0d0d12]">
      {/* Header bar */}
      <div className="border-b border-[#1a1a2e] px-3 py-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00ff41]">
          Entity Intel
        </span>
      </div>

      {/* Content area */}
      {selectedEntity === null ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <span className="font-mono text-sm text-neutral-500">
            SELECT TARGET ON GLOBE
          </span>
          <span className="font-mono text-xs text-neutral-700">
            Click a country or city to view intelligence
          </span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Entity type badge + name */}
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${entityTypeColors[selectedEntity.type] ?? 'border-[#00ff41] text-[#00ff41]'}`}
            >
              {selectedEntity.type}
            </span>
            <span className="font-mono text-lg font-semibold text-[#00ff41]">
              {selectedEntity.name}
            </span>
          </div>

          {/* Separator */}
          <div className="mb-4 border-t border-[#1a1a2e]" />

          {/* Coordinates */}
          <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-1">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                Lat
              </span>
              <div className="font-mono text-sm text-[#00ff41]">
                {selectedEntity.coordinates.latitude.toFixed(4)}&deg;
              </div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600">
                Lon
              </span>
              <div className="font-mono text-sm text-[#00ff41]">
                {selectedEntity.coordinates.longitude.toFixed(4)}&deg;
              </div>
            </div>
          </div>

          {/* Metadata key-value grid */}
          {selectedEntity.metadata &&
            Object.keys(selectedEntity.metadata).filter(
              (k) => !HIDDEN_KEYS.has(k)
            ).length > 0 && (
              <>
                <div className="mb-3 border-t border-[#1a1a2e]" />
                <div className="flex flex-col gap-2.5">
                  {Object.entries(selectedEntity.metadata)
                    .filter(([key]) => !HIDDEN_KEYS.has(key))
                    .map(([key, value]) => (
                      <div key={key} className="flex items-baseline justify-between gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-600 shrink-0">
                          {FIELD_LABELS[key] ?? key}
                        </span>
                        <span className="font-mono text-sm text-[#00ff41] text-right">
                          {formatValue(key, value)}
                        </span>
                      </div>
                    ))}
                </div>
              </>
            )}

          {/* Spacer to push button to bottom */}
          <div className="flex-1" />

          {/* Clear button */}
          <button
            type="button"
            onClick={clearSelection}
            className="mt-4 w-full border border-[#1a1a2e] bg-transparent px-4 py-2 font-mono text-xs uppercase tracking-widest text-neutral-500 transition-colors hover:border-[#00ff41] hover:text-[#00ff41]"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  )
}
