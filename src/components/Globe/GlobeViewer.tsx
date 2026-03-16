import { useCallback, useEffect, useRef } from 'react'
import { Viewer as ResiumViewer } from 'resium'
import {
  Ion,
  Color,
  Cartesian3,
  ImageryLayer,
  TileMapServiceImageryProvider,
  EllipsoidTerrainProvider,
  buildModuleUrl,
  type Viewer as CesiumViewer,
} from 'cesium'
import { useGlobeStore } from '../../store/globe'

// Disable Ion so Cesium doesn't try to fetch Ion-based assets
Ion.defaultAccessToken = ''

// Flat ellipsoid terrain (no Ion terrain requests)
const defaultTerrain = new EllipsoidTerrainProvider()

// Use the bundled Natural Earth II imagery (ships with CesiumJS, no API key needed)
const defaultBaseLayer = ImageryLayer.fromProviderAsync(
  TileMapServiceImageryProvider.fromUrl(
    buildModuleUrl('Assets/Textures/NaturalEarthII'),
  ),
)

// Stable detached element for credit container (avoids viewer recreation on re-render)
const creditDiv = document.createElement('div')

function GlobeViewer() {
  const viewerRef = useRef<CesiumViewer | null>(null)
  const setGlobeReady = useGlobeStore((s) => s.setGlobeReady)

  const handleViewerReady = useCallback(
    (viewer: CesiumViewer) => {
      viewerRef.current = viewer

      // Dark globe base color (shown where no imagery tiles exist)
      viewer.scene.globe.baseColor = Color.fromCssColorString('#0a0a0f')

      // Enable day/night terminator lighting
      viewer.scene.globe.enableLighting = true

      // Dark background for space around the globe
      viewer.scene.backgroundColor = Color.fromCssColorString('#000005')

      // Disable the default sun / moon / skyBox so the backdrop stays pure dark
      if (viewer.scene.sun) {
        viewer.scene.sun.show = false
      }
      if (viewer.scene.moon) {
        viewer.scene.moon.show = false
      }
      if (viewer.scene.skyBox) {
        viewer.scene.skyBox.show = false
      }
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = false
      }

      // Fly to a nice overview position (slightly tilted, centered on Europe/Africa)
      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(20.0, 20.0, 20_000_000),
        duration: 0, // instant on load
      })

      setGlobeReady(true)
    },
    [setGlobeReady],
  )

  // Capture the Cesium Viewer instance via ref callback
  const refCallback = useCallback(
    (element: { cesiumElement?: CesiumViewer } | null) => {
      if (element?.cesiumElement && element.cesiumElement !== viewerRef.current) {
        handleViewerReady(element.cesiumElement)
      }
    },
    [handleViewerReady],
  )

  // Reset globeReady on unmount
  useEffect(() => {
    return () => {
      viewerRef.current = null
      setGlobeReady(false)
    }
  }, [setGlobeReady])

  return (
    <div className="globe-container" style={{ width: '100%', height: '100%' }}>
      <ResiumViewer
        ref={refCallback}
        full={false}
        style={{ width: '100%', height: '100%' }}
        animation={false}
        timeline={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        navigationHelpButton={false}
        sceneModePicker={false}
        fullscreenButton={false}
        infoBox={false}
        selectionIndicator={false}
        vrButton={false}
        shadows={false}
        terrainProvider={defaultTerrain}
        baseLayer={defaultBaseLayer}
        creditContainer={creditDiv}
      />
    </div>
  )
}

export default GlobeViewer
