import { useLayoutStore, PRESET_LABELS } from '../../store/layout'
import type { LayoutPreset } from '../../types'

const PRESETS: LayoutPreset[] = ['default', 'fullGlobe', 'tradingFloor', 'analystDesk', 'newsRoom']

export function LayoutSelector() {
  const currentPreset = useLayoutStore((s) => s.preset)
  const setPreset = useLayoutStore((s) => s.setPreset)

  return (
    <div className="flex items-center gap-1">
      <span
        className="mr-1 text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--color-text-muted)' }}
      >
        LAYOUT
      </span>
      {PRESETS.map((preset) => {
        const isActive = preset === currentPreset
        return (
          <button
            key={preset}
            type="button"
            onClick={() => setPreset(preset)}
            className={`px-1.5 py-0 font-mono text-[10px] uppercase tracking-wider transition-colors ${
              isActive
                ? 'bg-[#00ff41]/10 text-[#00ff41]'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
            title={PRESET_LABELS[preset]}
          >
            {PRESET_LABELS[preset]}
          </button>
        )
      })}
    </div>
  )
}
