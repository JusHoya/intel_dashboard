import { useGlobeStore } from '../../store/globe'

interface ToolbarButtonProps {
  label: string
  active: boolean
  color?: string
  onClick: () => void
}

function ToolbarButton({ label, active, color = '#00ff41', onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? `${color}15` : 'rgba(10, 10, 15, 0.85)',
        border: `1px solid ${active ? color : '#333'}`,
        color: active ? color : '#555',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '9px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        padding: '3px 8px',
        cursor: 'pointer',
        textTransform: 'uppercase' as const,
      }}
    >
      {label}
    </button>
  )
}

/**
 * Floating toolbar overlay for the globe, positioned top-right.
 * Provides toggles for view mode and layer visibility.
 */
export function GlobeToolbar() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const toggleViewMode = useGlobeStore((s) => s.toggleViewMode)
  const showDetailOverlay = useGlobeStore((s) => s.showDetailOverlay)
  const toggleDetailOverlay = useGlobeStore((s) => s.toggleDetailOverlay)
  const showStateCapitals = useGlobeStore((s) => s.showStateCapitals)
  const toggleStateCapitals = useGlobeStore((s) => s.toggleStateCapitals)

  const isTerminal = viewMode === 'terminal'

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        alignItems: 'flex-end',
      }}
    >
      {/* Primary view mode toggle */}
      <button
        onClick={toggleViewMode}
        style={{
          background: 'rgba(10, 10, 15, 0.85)',
          border: `1px solid ${isTerminal ? '#00ff41' : '#ffaa00'}`,
          color: isTerminal ? '#00ff41' : '#ffaa00',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.1em',
          padding: '4px 10px',
          cursor: 'pointer',
          textTransform: 'uppercase',
        }}
      >
        {isTerminal ? '3D PHOTO' : 'TERMINAL'}
      </button>

      {/* Layer toggles (only in terminal mode) */}
      {isTerminal && (
        <div style={{ display: 'flex', gap: 3 }}>
          <ToolbarButton
            label="ROADS"
            active={showDetailOverlay}
            color="#44aaff"
            onClick={toggleDetailOverlay}
          />
          <ToolbarButton
            label="CAPITALS"
            active={showStateCapitals}
            color="#ffaa00"
            onClick={toggleStateCapitals}
          />
        </div>
      )}
    </div>
  )
}
