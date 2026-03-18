import { useEffect, useState } from 'react'
import { Cesium3DTileset } from 'resium'
import { useGlobeStore } from '../../store/globe'

const SERVER_BASE = 'http://localhost:3001'

/**
 * Renders Google Photorealistic 3D Tiles when viewMode is 'photorealistic'.
 * Fetches the API key from the backend to avoid exposing it in client source.
 * Unmounts when switching back to terminal mode to free GPU memory.
 */
export function Photorealistic3DLayer() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const [tileUrl, setTileUrl] = useState<string | null>(null)

  // Fetch API key once on mount
  useEffect(() => {
    let cancelled = false
    fetch(`${SERVER_BASE}/api/google-tiles/key`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { key: string } | null) => {
        if (!cancelled && data?.key) {
          setTileUrl(
            `https://tile.googleapis.com/v1/3dtiles/root.json?key=${data.key}`,
          )
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  // Only render when in photorealistic mode and URL is available
  if (viewMode !== 'photorealistic' || !tileUrl) return null

  return (
    <Cesium3DTileset
      url={tileUrl}
      maximumScreenSpaceError={16}
      cullRequestsWhileMoving
      preloadWhenHidden={false}
    />
  )
}
