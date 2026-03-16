import { useAppStore } from '../../store/app'

export function ScanlineOverlay() {
  const enabled = useAppStore((s) => s.scanlinesEnabled)

  if (!enabled) return null

  return <div className="scanlines" />
}
