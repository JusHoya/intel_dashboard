import { type ReactNode, useCallback, useEffect, useRef } from 'react'
import { Viewer as ResiumViewer, ScreenSpaceEventHandler, ScreenSpaceEvent } from 'resium'
import {
  Ion,
  Color,
  Cartesian3,
  BoundingSphere,
  ImageryLayer,
  TileMapServiceImageryProvider,
  EllipsoidTerrainProvider,
  buildModuleUrl,
  ScreenSpaceEventType,
  Math as CesiumMath,
  defined,
  type Viewer as CesiumViewer,
  type Cartesian2,
} from 'cesium'
import { useGlobeStore } from '../../store/globe'
import { GlobeToolbar } from './GlobeToolbar'
import { LocationSearch } from './LocationSearch'

Ion.defaultAccessToken = ''

const defaultTerrain = new EllipsoidTerrainProvider()
const defaultBaseLayer = ImageryLayer.fromProviderAsync(
  TileMapServiceImageryProvider.fromUrl(
    buildModuleUrl('Assets/Textures/NaturalEarthII'),
  ),
)
const creditDiv = document.createElement('div')

interface GlobeViewerProps {
  children?: ReactNode
}

function GlobeViewer({ children }: GlobeViewerProps) {
  const viewerRef = useRef<CesiumViewer | null>(null)
  const setGlobeReady = useGlobeStore((s) => s.setGlobeReady)
  const selectEntity = useGlobeStore((s) => s.selectEntity)
  const clearSelection = useGlobeStore((s) => s.clearSelection)
  const setHoveredFlight = useGlobeStore((s) => s.setHoveredFlight)
  const viewMode = useGlobeStore((s) => s.viewMode)

  const handleViewerReady = useCallback(
    (viewer: CesiumViewer) => {
      viewerRef.current = viewer
      ;(window as unknown as Record<string, unknown>).__cesiumViewer = viewer
      viewer.scene.globe.baseColor = Color.fromCssColorString('#0a0a0f')
      viewer.scene.globe.enableLighting = true
      viewer.scene.backgroundColor = Color.fromCssColorString('#000005')

      if (viewer.scene.sun) viewer.scene.sun.show = false
      if (viewer.scene.moon) viewer.scene.moon.show = false
      if (viewer.scene.skyBox) viewer.scene.skyBox.show = false
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false

      viewer.camera.flyTo({
        destination: Cartesian3.fromDegrees(20.0, 20.0, 20_000_000),
        duration: 0,
      })

      setGlobeReady(true)
    },
    [setGlobeReady],
  )

  const refCallback = useCallback(
    (element: { cesiumElement?: CesiumViewer } | null) => {
      if (element?.cesiumElement && element.cesiumElement !== viewerRef.current) {
        handleViewerReady(element.cesiumElement)
      }
    },
    [handleViewerReady],
  )

  // Handle left-click on entities
  const handleClick = useCallback(
    (event: { position: Cartesian2 } | { startPosition: Cartesian2; endPosition: Cartesian2 }) => {
      if (!('position' in event)) return
      const viewer = viewerRef.current
      if (!viewer) return

      const picked = viewer.scene.pick(event.position)
      if (defined(picked) && picked.id) {
        const entity = picked.id
        const name: string = entity.name ?? entity.id ?? 'Unknown'

        // Try to get position from entity (point entities have .position,
        // polygon entities need centroid computed from their hierarchy)
        let latitude = 0
        let longitude = 0
        const pos = entity.position?.getValue(viewer.clock.currentTime)
        if (pos) {
          const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(pos)
          latitude = CesiumMath.toDegrees(carto.latitude)
          longitude = CesiumMath.toDegrees(carto.longitude)
        } else if (entity.polygon) {
          const hierarchy = entity.polygon.hierarchy?.getValue(viewer.clock.currentTime)
          if (hierarchy && hierarchy.positions && hierarchy.positions.length > 0) {
            const center = BoundingSphere.fromPoints(hierarchy.positions).center
            const carto = viewer.scene.globe.ellipsoid.cartesianToCartographic(center)
            latitude = CesiumMath.toDegrees(carto.latitude)
            longitude = CesiumMath.toDegrees(carto.longitude)
          }
        }

        // Determine entity type from custom properties
        const entityType = entity.properties?.entityType?.getValue(viewer.clock.currentTime) ?? 'country'

        selectEntity({
          id: entity.id ?? name,
          type: entityType,
          name,
          coordinates: { latitude, longitude },
          metadata: entity.properties
            ? Object.fromEntries(
                entity.properties.propertyNames.map((p: string) => [
                  p,
                  entity.properties?.[p]?.getValue(viewer.clock.currentTime),
                ]),
              )
            : undefined,
        })

        // Camera fly-to the selected entity
        if (latitude !== 0 || longitude !== 0) {
          viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(longitude, latitude, 5_000_000),
            duration: 1.5,
          })
        }
      } else {
        clearSelection()
      }
    },
    [selectEntity, clearSelection],
  )

  // Handle mouse move for flight hover — throttled to 100ms
  const lastMoveRef = useRef(0)
  const handleMouseMove = useCallback(
    (event: { endPosition: Cartesian2 }) => {
      const now = Date.now()
      if (now - lastMoveRef.current < 100) return
      lastMoveRef.current = now

      const viewer = viewerRef.current
      if (!viewer) return

      const picked = viewer.scene.pick(event.endPosition)
      if (defined(picked) && picked.id) {
        const entity = picked.id
        const entityType = entity.properties?.entityType?.getValue(viewer.clock.currentTime)
        if (entityType === 'flight') {
          const callsign = entity.properties?.callsign?.getValue(viewer.clock.currentTime) ?? null
          setHoveredFlight(entity.id ?? null, callsign)
          return
        }
      }
      setHoveredFlight(null, null)
    },
    [setHoveredFlight],
  )

  // React to flyToTarget changes from command bar
  const flyToTarget = useGlobeStore((s) => s.flyToTarget)
  const clearFlyToTarget = useGlobeStore((s) => s.clearFlyToTarget)

  useEffect(() => {
    if (!flyToTarget) return
    const viewer = viewerRef.current
    if (!viewer) return

    viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        flyToTarget.longitude,
        flyToTarget.latitude,
        5_000_000,
      ),
      duration: 2.0,
    })

    // Clear the target so the same location can be re-triggered
    clearFlyToTarget()
  }, [flyToTarget, clearFlyToTarget])

  // Toggle scene properties based on viewMode
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    if (viewMode === 'photorealistic') {
      viewer.scene.globe.show = false
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = true
      viewer.scene.globe.enableLighting = false
    } else {
      // Restore terminal mode
      viewer.scene.globe.show = true
      viewer.scene.globe.baseColor = Color.fromCssColorString('#0a0a0f')
      viewer.scene.globe.enableLighting = true
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false
      if (viewer.scene.sun) viewer.scene.sun.show = false
      if (viewer.scene.moon) viewer.scene.moon.show = false
      if (viewer.scene.skyBox) viewer.scene.skyBox.show = false
    }
  }, [viewMode])

  useEffect(() => {
    return () => {
      viewerRef.current = null
      setGlobeReady(false)
    }
  }, [setGlobeReady])

  return (
    <div className="globe-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <LocationSearch />
      <GlobeToolbar />
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
      >
        <ScreenSpaceEventHandler>
          <ScreenSpaceEvent
            action={handleClick}
            type={ScreenSpaceEventType.LEFT_CLICK}
          />
          <ScreenSpaceEvent
            action={handleMouseMove}
            type={ScreenSpaceEventType.MOUSE_MOVE}
          />
        </ScreenSpaceEventHandler>
        {children}
      </ResiumViewer>
    </div>
  )
}

export default GlobeViewer
