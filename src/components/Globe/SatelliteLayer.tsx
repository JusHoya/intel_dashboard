import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Entity, PointGraphics, LabelGraphics, PolylineGraphics, useCesium } from 'resium'
import {
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  NearFarScalar,
  LabelStyle,
  VerticalOrigin,
  PropertyBag,
  ArcType,
} from 'cesium'
import { useSatelliteFeed } from '../../feeds/satellites.ts'
import { useGlobeStore } from '../../store/globe.ts'
import type { SatellitePosition } from '../../types/satellites.ts'
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js'

const PURPLE = Color.fromCssColorString('#a78bfa')
const PURPLE_DIM = Color.fromCssColorString('#a78bfa').withAlpha(0.4)
const ORBIT_COLOR = Color.fromCssColorString('#a78bfa').withAlpha(0.3)

const labelScaleByDistance = new NearFarScalar(1e5, 1.0, 8e6, 0.0)
const pointScaleByDistance = new NearFarScalar(1e5, 1.0, 2e7, 0.5)
const labelPixelOffset = new Cartesian2(10, -4)

/** Camera height -> max satellites to render */
function getMaxSatellites(cameraHeight: number): number {
  if (cameraHeight > 20_000_000) return 30   // Full globe view
  if (cameraHeight > 10_000_000) return 60   // Continental view
  return 100                                  // Zoomed in
}

/** Build PropertyBag for satellite entity click handling */
function makeSatelliteProperties(sat: SatellitePosition): PropertyBag {
  const bag = new PropertyBag()
  bag.addProperty('entityType', new ConstantProperty('satellite'))
  bag.addProperty('altitude', new ConstantProperty(sat.altitude))
  bag.addProperty('velocity', new ConstantProperty(sat.velocity))
  bag.addProperty('category', new ConstantProperty(sat.category))
  bag.addProperty('satelliteId', new ConstantProperty(sat.id))
  return bag
}

/** Compute an orbit path for a selected satellite using its TLE data */
function useOrbitPath(satelliteId: string | null): Cartesian3[] | null {
  const [orbitPoints, setOrbitPoints] = useState<Cartesian3[] | null>(null)
  const cacheRef = useRef<{ id: string; points: Cartesian3[] } | null>(null)

  useEffect(() => {
    if (!satelliteId) {
      setOrbitPoints(null)
      return
    }

    // Use cached orbit if same satellite
    if (cacheRef.current && cacheRef.current.id === satelliteId) {
      setOrbitPoints(cacheRef.current.points)
      return
    }

    // Fetch TLE data to compute orbit
    // We re-fetch from the server cache to get the raw TLE lines
    void (async () => {
      try {
        const response = await fetch('http://localhost:3001/api/satellites')
        if (!response.ok) return

        const data = (await response.json()) as { tles: { name: string; line1: string; line2: string }[] }

        // Find the TLE matching this satellite
        const noradId = satelliteId.replace('sat-', '')
        const tle = data.tles.find((t) => t.line1.substring(2, 7).trim() === noradId)
        if (!tle) return

        const satrec = twoline2satrec(tle.line1, tle.line2)
        const now = new Date()
        const points: Cartesian3[] = []

        // Compute one full orbit (~90 minutes for LEO, sample every 2 min)
        const orbitalPeriodMin = 90
        const stepMin = 2
        const steps = Math.ceil(orbitalPeriodMin / stepMin)

        for (let i = 0; i <= steps; i++) {
          const t = new Date(now.getTime() + i * stepMin * 60_000)
          const result = propagate(satrec, t)
          if (!result || typeof result.position === 'boolean') continue

          const gmst = gstime(t)
          const geodetic = eciToGeodetic(result.position, gmst)
          const lat = degreesLat(geodetic.latitude)
          const lon = degreesLong(geodetic.longitude)
          const alt = geodetic.height

          if (isFinite(lat) && isFinite(lon) && isFinite(alt) && alt > 0) {
            // Convert altitude from km to meters for Cesium
            points.push(Cartesian3.fromDegrees(lon, lat, alt * 1000))
          }
        }

        if (points.length > 2) {
          cacheRef.current = { id: satelliteId, points }
          setOrbitPoints(points)
        }
      } catch {
        // Silently fail — orbit path is optional
      }
    })()
  }, [satelliteId])

  return orbitPoints
}

/** Renders live satellite positions on the globe */
export function SatelliteLayer() {
  const { viewer } = useCesium()
  const [cameraHeight, setCameraHeight] = useState(20_000_000)
  const selectedEntity = useGlobeStore((s) => s.selectedEntity)

  // Track camera height (throttled)
  const updateCamera = useCallback(() => {
    if (!viewer) return
    try {
      const height = viewer.camera.positionCartographic.height
      setCameraHeight(height)
    } catch {
      // Camera not ready
    }
  }, [viewer])

  useEffect(() => {
    updateCamera()
    const id = setInterval(updateCamera, 500)
    return () => clearInterval(id)
  }, [updateCamera])

  const { satellites } = useSatelliteFeed()

  // Determine which satellite is selected for orbit rendering
  const selectedSatelliteId = useMemo(() => {
    if (selectedEntity?.type === 'satellite' && selectedEntity.metadata?.satelliteId) {
      return selectedEntity.metadata.satelliteId as string
    }
    return null
  }, [selectedEntity])

  // Compute orbit path for selected satellite
  const orbitPath = useOrbitPath(selectedSatelliteId)

  // Zoom-adaptive culling
  const visibleSatellites = useMemo(() => {
    const maxSats = getMaxSatellites(cameraHeight)
    if (satellites.length <= maxSats) return satellites

    // Prioritize: space stations first, then GPS, weather, etc.
    const priority: Record<string, number> = {
      'space-stations': 0,
      'gps-ops': 1,
      'weather': 2,
      'science': 3,
      'resource': 4,
    }

    const sorted = [...satellites].sort((a, b) => {
      const pa = priority[a.category] ?? 5
      const pb = priority[b.category] ?? 5
      return pa - pb
    })

    return sorted.slice(0, maxSats)
  }, [satellites, cameraHeight])

  return (
    <>
      {/* Orbit path for selected satellite */}
      {orbitPath && orbitPath.length > 2 && (
        <Entity>
          <PolylineGraphics
            positions={orbitPath}
            width={1.5}
            material={ORBIT_COLOR}
            arcType={ArcType.NONE}
          />
        </Entity>
      )}

      {/* Satellite point entities */}
      {visibleSatellites.map((sat) => {
        const isSelected = selectedSatelliteId === sat.id
        const color = isSelected ? PURPLE : PURPLE_DIM
        const pixelSize = isSelected ? 7 : 5

        return (
          <Entity
            key={sat.id}
            name={sat.name}
            position={Cartesian3.fromDegrees(
              sat.longitude,
              sat.latitude,
              sat.altitude * 1000, // km → meters for Cesium
            )}
            properties={makeSatelliteProperties(sat)}
          >
            <PointGraphics
              pixelSize={pixelSize}
              color={color}
              outlineColor={Color.BLACK}
              outlineWidth={1}
              scaleByDistance={pointScaleByDistance}
            />
            <LabelGraphics
              text={sat.name}
              font="10px JetBrains Mono, monospace"
              fillColor={PURPLE}
              style={LabelStyle.FILL_AND_OUTLINE}
              outlineColor={Color.BLACK}
              outlineWidth={2}
              pixelOffset={labelPixelOffset}
              verticalOrigin={VerticalOrigin.CENTER}
              scaleByDistance={labelScaleByDistance}
            />
          </Entity>
        )
      })}
    </>
  )
}
