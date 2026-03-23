import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import {
  Entity,
  BillboardGraphics,
  LabelGraphics,
  PolylineGraphics,
  EllipseGraphics,
  useCesium,
} from 'resium'
import {
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  NearFarScalar,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
  PropertyBag,
  Math as CesiumMath,
} from 'cesium'
import { useSatellites, isISS } from '../../feeds/satellites'
import { useGlobeStore } from '../../store/globe'
import type { SatellitePosition, OrbitPoint } from '../../types/satellites'
import {
  SATELLITE_ICON_CYAN,
  SATELLITE_ICON_GOLD,
  SATELLITE_ICON_STARLINK,
} from '../../utils/satelliteIcon'

// -- Constants ----------------------------------------------------------------

const CYAN = Color.fromCssColorString('#00ffff')
const GOLD = Color.fromCssColorString('#ffd700')
const STARLINK_COLOR = Color.fromCssColorString('#0891b2')

// Label styling
const labelPixelOffset = new Cartesian2(14, -4)
const labelScaleByDistance = new NearFarScalar(1e5, 1.0, 8e6, 0.0)
const issLabelScaleByDistance = new NearFarScalar(1e5, 1.0, 2e7, 0.4)

// Billboard scaling
const generalBillboardScale = new NearFarScalar(1e5, 0.6, 2e7, 0.3)
const issBillboardScale = new NearFarScalar(1e5, 0.9, 2e7, 0.5)
const starlinkBillboardScale = new NearFarScalar(1e5, 0.4, 1e7, 0.15)

// Orbit polyline color
const ORBIT_COLOR_CYAN = Color.fromCssColorString('#00ffff').withAlpha(0.4)
const ORBIT_COLOR_GOLD = Color.fromCssColorString('#ffd700').withAlpha(0.5)
const ORBIT_COLOR_STARLINK = Color.fromCssColorString('#0891b2').withAlpha(0.3)

// Earth radius in km
const EARTH_RADIUS_KM = 6371

// FOV half-angle in radians (17 degrees)
const FOV_HALF_ANGLE_RAD = CesiumMath.toRadians(17)

// -- Helpers ------------------------------------------------------------------

/** Camera height -> max satellites to render per category */
function getMaxSatellites(cameraHeight: number): { stations: number; starlink: number } {
  if (cameraHeight > 15_000_000) return { stations: 50, starlink: 0 }
  if (cameraHeight > 8_000_000) return { stations: 50, starlink: 10 }
  if (cameraHeight > 3_000_000) return { stations: 50, starlink: 30 }
  return { stations: 50, starlink: 50 }
}

/** Check if satellite is in viewport (approximate) */
function isInViewport(
  sat: SatellitePosition,
  bounds: { south: number; north: number; west: number; east: number },
): boolean {
  if (sat.latitude < bounds.south || sat.latitude > bounds.north) return false
  if (bounds.west <= bounds.east) {
    return sat.longitude >= bounds.west && sat.longitude <= bounds.east
  }
  return sat.longitude >= bounds.west || sat.longitude <= bounds.east
}

/**
 * Calculate the ground footprint radius for a satellite's field of view.
 * Uses: footprintRadius = Re * arccos( (Re / (Re + alt)) * cos(halfAngle) )
 * This accounts for Earth curvature.
 *
 * @returns footprint radius in meters
 */
function calculateFootprintRadius(altitudeKm: number): number {
  const Re = EARTH_RADIUS_KM
  const h = altitudeKm
  const cosHalf = Math.cos(FOV_HALF_ANGLE_RAD)
  const ratio = (Re / (Re + h)) * cosHalf

  // Clamp to valid arccos range
  if (ratio >= 1) return 0
  if (ratio <= -1) return Math.PI * Re * 1000

  const angularRadius = Math.acos(ratio)
  // Convert angular radius on Earth's surface to meters
  return angularRadius * Re * 1000
}

/**
 * Build Cesium Cartesian3 positions for an orbit path, properly segmenting
 * at the antimeridian to avoid "wrap-around" artifacts.
 */
function buildOrbitPositions(points: OrbitPoint[]): Cartesian3[][] {
  if (points.length === 0) return []

  const segments: Cartesian3[][] = []
  let currentSegment: Cartesian3[] = []

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const pos = Cartesian3.fromDegrees(p.longitude, p.latitude, p.altitude * 1000)

    if (i > 0) {
      const prev = points[i - 1]
      const lonDiff = Math.abs(p.longitude - prev.longitude)
      // If longitude jumps > 180 degrees, it crossed the antimeridian
      if (lonDiff > 180) {
        if (currentSegment.length > 1) {
          segments.push(currentSegment)
        }
        currentSegment = [pos]
        continue
      }
    }

    currentSegment.push(pos)
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment)
  }

  return segments
}

// -- Component ----------------------------------------------------------------

export function SatelliteLayer() {
  const { viewer } = useCesium()
  const { positions, getOrbitPath } = useSatellites()
  const selectedEntity = useGlobeStore((s) => s.selectedEntity)

  const [cameraHeight, setCameraHeight] = useState(20_000_000)
  const [viewBounds, setViewBounds] = useState<{
    south: number; north: number; west: number; east: number
  } | null>(null)
  const cameraCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track camera for zoom-adaptive culling
  const updateCamera = useCallback(() => {
    if (!viewer) return
    try {
      const height = viewer.camera.positionCartographic.height
      setCameraHeight(height)

      const rect = viewer.camera.computeViewRectangle()
      if (rect) {
        setViewBounds({
          south: CesiumMath.toDegrees(rect.south),
          north: CesiumMath.toDegrees(rect.north),
          west: CesiumMath.toDegrees(rect.west),
          east: CesiumMath.toDegrees(rect.east),
        })
      }
    } catch {
      // Camera not ready
    }
  }, [viewer])

  useEffect(() => {
    updateCamera()
    cameraCheckRef.current = setInterval(updateCamera, 1000)
    return () => {
      if (cameraCheckRef.current) clearInterval(cameraCheckRef.current)
    }
  }, [updateCamera])

  // Determine which satellite is selected (if any)
  const selectedNoradId = useMemo(() => {
    if (selectedEntity?.type === 'satellite' && selectedEntity.metadata?.noradId) {
      return selectedEntity.metadata.noradId as number
    }
    return null
  }, [selectedEntity])

  // Compute orbit path for selected satellite
  const orbitSegments = useMemo(() => {
    if (selectedNoradId === null) return []
    const points = getOrbitPath(selectedNoradId)
    return buildOrbitPositions(points)
  }, [selectedNoradId, getOrbitPath])

  // Compute footprint for selected satellite
  const selectedSatellite = useMemo(() => {
    if (selectedNoradId === null) return null
    return positions.find((s) => s.noradId === selectedNoradId) ?? null
  }, [selectedNoradId, positions])

  const footprintRadius = useMemo(() => {
    if (!selectedSatellite) return 0
    return calculateFootprintRadius(selectedSatellite.altitude)
  }, [selectedSatellite])

  // Zoom-adaptive filtering
  const visibleSatellites = useMemo(() => {
    const limits = getMaxSatellites(cameraHeight)

    // Separate ISS, stations, and starlink
    const iss: SatellitePosition[] = []
    const stations: SatellitePosition[] = []
    const starlink: SatellitePosition[] = []

    for (const sat of positions) {
      if (isISS(sat)) {
        iss.push(sat) // ISS always visible
      } else if (sat.category === 'starlink') {
        starlink.push(sat)
      } else {
        stations.push(sat)
      }
    }

    // Filter starlink by viewport when zoomed in
    let filteredStarlink = starlink
    if (viewBounds && cameraHeight < 8_000_000) {
      filteredStarlink = starlink.filter((s) => isInViewport(s, viewBounds))
    }

    // Apply limits
    const visibleStations = stations.slice(0, limits.stations)
    const visibleStarlink = filteredStarlink.slice(0, limits.starlink)

    return [...iss, ...visibleStations, ...visibleStarlink]
  }, [positions, cameraHeight, viewBounds])

  // Determine orbit line color based on selected satellite category
  const orbitColor = useMemo(() => {
    if (!selectedSatellite) return ORBIT_COLOR_CYAN
    if (isISS(selectedSatellite)) return ORBIT_COLOR_GOLD
    if (selectedSatellite.category === 'starlink') return ORBIT_COLOR_STARLINK
    return ORBIT_COLOR_CYAN
  }, [selectedSatellite])

  // Determine footprint color based on selected satellite category
  const footprintFillColor = useMemo(() => {
    if (!selectedSatellite) return CYAN.withAlpha(0.15)
    if (isISS(selectedSatellite)) return GOLD.withAlpha(0.15)
    if (selectedSatellite.category === 'starlink') return STARLINK_COLOR.withAlpha(0.15)
    return CYAN.withAlpha(0.15)
  }, [selectedSatellite])

  const footprintOutlineColor = useMemo(() => {
    if (!selectedSatellite) return CYAN.withAlpha(0.5)
    if (isISS(selectedSatellite)) return GOLD.withAlpha(0.5)
    if (selectedSatellite.category === 'starlink') return STARLINK_COLOR.withAlpha(0.5)
    return CYAN.withAlpha(0.5)
  }, [selectedSatellite])

  return (
    <>
      {/* Satellite entities */}
      {visibleSatellites.map((sat) => {
        const iss = isISS(sat)
        const isStarlink = sat.category === 'starlink'

        // Determine icon and colors
        const icon = iss
          ? SATELLITE_ICON_GOLD
          : isStarlink
            ? SATELLITE_ICON_STARLINK
            : SATELLITE_ICON_CYAN

        const labelColor = iss ? GOLD : isStarlink ? STARLINK_COLOR : CYAN

        // Determine sizing
        const scale = iss ? 0.85 : isStarlink ? 0.4 : 0.55
        const scaleByDistance = iss
          ? issBillboardScale
          : isStarlink
            ? starlinkBillboardScale
            : generalBillboardScale

        const currentLabelScale = iss
          ? issLabelScaleByDistance
          : labelScaleByDistance

        // Show label: always for ISS, on hover/close zoom for others
        const showLabel = iss || (!isStarlink && cameraHeight < 5_000_000)

        // Properties for entity selection
        const properties = new PropertyBag()
        properties.addProperty('entityType', new ConstantProperty('satellite'))
        properties.addProperty('noradId', new ConstantProperty(sat.noradId))
        properties.addProperty('category', new ConstantProperty(sat.category))
        properties.addProperty('altitude', new ConstantProperty(sat.altitude))
        properties.addProperty('velocity', new ConstantProperty(sat.velocity))

        return (
          <Entity
            key={`sat-${sat.noradId}`}
            name={sat.name}
            position={Cartesian3.fromDegrees(
              sat.longitude,
              sat.latitude,
              sat.altitude * 1000, // km -> meters
            )}
            properties={properties}
          >
            <BillboardGraphics
              image={icon}
              scale={scale}
              alignedAxis={Cartesian3.ZERO}
              scaleByDistance={scaleByDistance}
              horizontalOrigin={HorizontalOrigin.CENTER}
              verticalOrigin={VerticalOrigin.CENTER}
            />
            {showLabel && (
              <LabelGraphics
                text={sat.name}
                font={iss ? '11px JetBrains Mono, monospace' : '9px JetBrains Mono, monospace'}
                fillColor={labelColor}
                style={LabelStyle.FILL_AND_OUTLINE}
                outlineColor={Color.BLACK}
                outlineWidth={2}
                pixelOffset={labelPixelOffset}
                verticalOrigin={VerticalOrigin.CENTER}
                scaleByDistance={currentLabelScale}
              />
            )}
          </Entity>
        )
      })}

      {/* Orbit path polylines for selected satellite */}
      {orbitSegments.map((segment, idx) => (
        <Entity key={`orbit-seg-${selectedNoradId}-${idx}`}>
          <PolylineGraphics
            positions={segment}
            width={1.5}
            material={orbitColor}
          />
        </Entity>
      ))}

      {/* FOV footprint for selected satellite */}
      {selectedSatellite && footprintRadius > 0 && (
        <Entity
          key={`footprint-${selectedNoradId}`}
          position={Cartesian3.fromDegrees(
            selectedSatellite.longitude,
            selectedSatellite.latitude,
            0,
          )}
        >
          <EllipseGraphics
            semiMajorAxis={footprintRadius}
            semiMinorAxis={footprintRadius}
            material={footprintFillColor}
            outline
            outlineColor={footprintOutlineColor}
            outlineWidth={2}
            height={0}
          />
        </Entity>
      )}
    </>
  )
}
