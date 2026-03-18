import { useEffect, useRef } from 'react'
import { useCesium } from 'resium'
import { Cesium3DTileset } from 'cesium'
import { useGlobeStore } from '../../store/globe'

const SERVER_BASE = 'http://localhost:3001'

/**
 * Renders Google Photorealistic 3D Tiles when viewMode is 'photorealistic'.
 * Uses imperative Cesium API (Cesium3DTileset.fromUrl) for reliable async
 * tileset creation. Removes tileset when switching back to terminal mode.
 */
export function Photorealistic3DLayer() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const { viewer } = useCesium()
  const tilesetRef = useRef<Cesium3DTileset | null>(null)

  useEffect(() => {
    if (!viewer || viewer.isDestroyed() || viewMode !== 'photorealistic') return

    let cancelled = false

    fetch(`${SERVER_BASE}/api/google-tiles/key`)
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data: { key: string } | null) => {
        if (cancelled || !data?.key || !viewer || viewer.isDestroyed()) return

        try {
          const url = `https://tile.googleapis.com/v1/3dtiles/root.json?key=${data.key}`
          const tileset = await Cesium3DTileset.fromUrl(url, {
            maximumScreenSpaceError: 16,
            cullRequestsWhileMoving: true,
            preloadWhenHidden: false,
            showCreditsOnScreen: true,
          })

          if (cancelled || viewer.isDestroyed()) {
            tileset.destroy()
            return
          }

          viewer.scene.primitives.add(tileset)
          tilesetRef.current = tileset
        } catch (err) {
          console.warn('[Photorealistic3DLayer] Failed to load tileset:', err)
        }
      })
      .catch(() => {})

    return () => {
      cancelled = true
      const tileset = tilesetRef.current
      tilesetRef.current = null
      if (!tileset || tileset.isDestroyed()) return
      if (!viewer || viewer.isDestroyed()) return

      try {
        // Remove from scene first, then defer destroy to next frame
        // so Cesium finishes any in-progress render pass
        viewer.scene.primitives.remove(tileset)
        requestAnimationFrame(() => {
          try {
            if (!tileset.isDestroyed()) tileset.destroy()
          } catch { /* already cleaned up */ }
        })
      } catch {
        // Primitive may already have been removed
      }
    }
  }, [viewMode, viewer])

  return null
}
