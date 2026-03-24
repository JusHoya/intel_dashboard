import { useEffect, useRef, useCallback } from 'react'
import { useCesium } from 'resium'
import {
  ImageryLayer,
  UrlTemplateImageryProvider,
  type Viewer as CesiumViewer,
} from 'cesium'
import { useGlobeStore } from '../../store/globe'

/**
 * CartoDB Dark Matter tiles — dark-themed OpenStreetMap-derived tiles
 * that show roads, state/admin borders, city labels, and terrain features.
 * The dark theme integrates well with the terminal aesthetic.
 *
 * At low zoom: fully transparent (don't cover the terminal globe)
 * At medium zoom (country-level): subtle overlay showing state borders
 * At high zoom (city-level): clearer roads, streets, labels
 */

const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_TILE_SUBDOMAINS = 'abcd'

/** Camera height thresholds (meters) for alpha transitions */
const ZOOM_HIDE = 8_000_000    // Above 8000km: fully hidden
const ZOOM_SHOW = 4_000_000    // Below 4000km: start showing
const ZOOM_FULL = 200_000      // Below 200km: full overlay

/** Compute layer alpha based on camera height */
function computeAlpha(cameraHeight: number): number {
  if (cameraHeight > ZOOM_HIDE) return 0
  if (cameraHeight < ZOOM_FULL) return 0.85
  // Linear interpolation between thresholds
  const t = (cameraHeight - ZOOM_FULL) / (ZOOM_SHOW - ZOOM_FULL)
  return Math.max(0, Math.min(0.85, 0.85 * (1 - t)))
}

/**
 * Adds a zoom-adaptive OpenStreetMap (CartoDB Dark) overlay to the Cesium globe.
 * Shows state borders, roads, and place labels as you zoom in.
 * Only active in terminal mode (hidden in photorealistic mode to prevent z-fighting).
 */
export function USDetailLayer() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const showDetailOverlay = useGlobeStore((s) => s.showDetailOverlay)
  const { viewer } = useCesium()
  const layerRef = useRef<ImageryLayer | null>(null)
  const listenerRef = useRef<(() => void) | null>(null)

  const updateAlpha = useCallback((v: CesiumViewer) => {
    const layer = layerRef.current
    if (!layer) return
    const height = v.camera.positionCartographic.height
    layer.alpha = computeAlpha(height)
  }, [])

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return
    if (viewMode === 'photorealistic' || !showDetailOverlay) {
      // Remove layer if it exists
      if (layerRef.current) {
        try {
          viewer.imageryLayers.remove(layerRef.current, true)
        } catch { /* may already be removed */ }
        layerRef.current = null
      }
      if (listenerRef.current) {
        viewer.camera.changed.removeEventListener(listenerRef.current)
        listenerRef.current = null
      }
      return
    }

    // Create the dark tile imagery provider
    const provider = new UrlTemplateImageryProvider({
      url: DARK_TILE_URL,
      subdomains: DARK_TILE_SUBDOMAINS,
      minimumLevel: 0,
      maximumLevel: 18,
      credit: 'CartoDB',
    })

    const layer = ImageryLayer.fromProviderAsync(
      Promise.resolve(provider),
      { alpha: 0 },
    )
    viewer.imageryLayers.add(layer)
    layerRef.current = layer

    // Set initial alpha
    updateAlpha(viewer)

    // Listen for camera changes to update alpha
    const onCameraChange = () => updateAlpha(viewer)
    viewer.camera.changed.addEventListener(onCameraChange)
    listenerRef.current = onCameraChange

    return () => {
      if (listenerRef.current) {
        try {
          viewer.camera.changed.removeEventListener(listenerRef.current)
        } catch { /* viewer may be destroyed */ }
        listenerRef.current = null
      }
      if (layerRef.current) {
        try {
          if (!viewer.isDestroyed()) {
            viewer.imageryLayers.remove(layerRef.current, true)
          }
        } catch { /* already cleaned up */ }
        layerRef.current = null
      }
    }
  }, [viewMode, showDetailOverlay, viewer, updateAlpha])

  return null
}
