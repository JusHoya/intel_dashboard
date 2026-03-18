import { useGlobeStore } from '../../store/globe'

/**
 * Floating toolbar overlay for the globe, positioned top-right.
 * Provides a toggle between Terminal and Photorealistic 3D view modes.
 */
export function GlobeToolbar() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const toggleViewMode = useGlobeStore((s) => s.toggleViewMode)

  const isTerminal = viewMode === 'terminal'

  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10,
        display: 'flex',
        gap: 4,
      }}
    >
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
    </div>
  )
}
