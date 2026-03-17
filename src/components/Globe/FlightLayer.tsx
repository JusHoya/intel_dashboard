import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { Entity, BillboardGraphics, LabelGraphics, useCesium } from 'resium'
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
import { useFlights, type FlightBounds, type InterpolatedFlight } from '../../feeds/flights'
import {
  CIVILIAN_PLANE_ICON,
  MILITARY_PLANE_ICON,
  isMilitaryCallsign,
} from '../../utils/planeIcon'

const labelScaleByDistance = new NearFarScalar(1e5, 1.0, 1e7, 0.0)
const billboardScaleByDistance = new NearFarScalar(1e5, 0.7, 2e7, 0.25)
const labelPixelOffset = new Cartesian2(18, -4)

const GREEN = Color.fromCssColorString('#00ff41')
const RED = Color.fromCssColorString('#ff0040')

/** Camera height → max flights to render */
function getMaxFlights(cameraHeight: number): number {
  if (cameraHeight > 15_000_000) return 150   // Full globe view
  if (cameraHeight > 8_000_000) return 300    // Continental view
  if (cameraHeight > 3_000_000) return 600    // Regional view
  if (cameraHeight > 1_000_000) return 1000   // Country view
  return 1500                                  // City/airport view
}

/** Check if a flight is within a bounding box */
function isInBounds(
  flight: InterpolatedFlight,
  bounds: { south: number; north: number; west: number; east: number },
): boolean {
  const lat = flight.interpLatitude
  const lon = flight.interpLongitude
  if (lat < bounds.south || lat > bounds.north) return false

  // Handle antimeridian wrap
  if (bounds.west <= bounds.east) {
    return lon >= bounds.west && lon <= bounds.east
  }
  // Wraps around antimeridian
  return lon >= bounds.west || lon <= bounds.east
}

/** Renders live flight positions on the globe as oriented plane icons */
export function FlightLayer() {
  const { viewer } = useCesium()
  const [cameraHeight, setCameraHeight] = useState(20_000_000)
  const [viewBounds, setViewBounds] = useState<FlightBounds | undefined>(undefined)
  const cameraCheckRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Track camera height and compute bounding box (throttled to 500ms)
  const updateCamera = useCallback(() => {
    if (!viewer) return

    try {
      const height = viewer.camera.positionCartographic.height
      setCameraHeight(height)

      // Compute view rectangle for filtering
      const rect = viewer.camera.computeViewRectangle()
      if (rect) {
        const south = CesiumMath.toDegrees(rect.south)
        const north = CesiumMath.toDegrees(rect.north)
        const west = CesiumMath.toDegrees(rect.west)
        const east = CesiumMath.toDegrees(rect.east)

        // Only use bbox filtering when zoomed in enough
        if (height < 10_000_000) {
          setViewBounds({ lamin: south, lomin: west, lamax: north, lomax: east })
        } else {
          setViewBounds(undefined)
        }
      }
    } catch {
      // Camera not ready yet
    }
  }, [viewer])

  useEffect(() => {
    updateCamera()
    cameraCheckRef.current = setInterval(updateCamera, 500)
    return () => {
      if (cameraCheckRef.current) clearInterval(cameraCheckRef.current)
    }
  }, [updateCamera])

  // Pass bbox to flight feed for server-side filtering when zoomed in
  const { flights } = useFlights(viewBounds)

  // Zoom-adaptive culling + viewport filtering
  const visibleFlights = useMemo(() => {
    const maxFlights = getMaxFlights(cameraHeight)

    // When zoomed in, filter to flights in the visible viewport
    let candidates = flights
    if (viewBounds && cameraHeight < 10_000_000) {
      const bounds = {
        south: viewBounds.lamin,
        north: viewBounds.lamax,
        west: viewBounds.lomin,
        east: viewBounds.lomax,
      }
      candidates = flights.filter((f) => isInBounds(f, bounds))
    }

    if (candidates.length <= maxFlights) return candidates

    // Over limit — prefer flights with callsigns (more informative)
    const sorted = [...candidates].sort((a, b) => {
      const aHas = a.callsign && a.callsign.trim().length > 0 ? 0 : 1
      const bHas = b.callsign && b.callsign.trim().length > 0 ? 0 : 1
      return aHas - bHas
    })
    return sorted.slice(0, maxFlights)
  }, [flights, cameraHeight, viewBounds])

  return (
    <>
      {visibleFlights.map((flight) => {
        const altitudeMeters = flight.baro_altitude ?? 10000
        const displayCallsign =
          flight.callsign && flight.callsign.trim().length > 0
            ? flight.callsign.trim()
            : null

        const military = isMilitaryCallsign(flight.callsign)
        const icon = military ? MILITARY_PLANE_ICON : CIVILIAN_PLANE_ICON
        const labelColor = military ? RED : GREEN

        // CesiumJS rotation is counter-clockwise from north in radians.
        // true_track is clockwise degrees from north → negate and convert.
        const headingDeg = flight.true_track ?? 0
        const rotation = -CesiumMath.toRadians(headingDeg)

        const properties = new PropertyBag()
        properties.addProperty('entityType', new ConstantProperty('flight'))
        properties.addProperty('callsign', new ConstantProperty(displayCallsign))
        properties.addProperty('origin_country', new ConstantProperty(flight.origin_country))
        properties.addProperty('velocity', new ConstantProperty(flight.velocity))
        properties.addProperty('altitude', new ConstantProperty(flight.baro_altitude))
        properties.addProperty('military', new ConstantProperty(military))

        return (
          <Entity
            key={flight.icao24}
            name={displayCallsign ?? flight.icao24}
            position={Cartesian3.fromDegrees(
              flight.interpLongitude,
              flight.interpLatitude,
              altitudeMeters,
            )}
            properties={properties}
          >
            <BillboardGraphics
              image={icon}
              scale={0.7}
              rotation={rotation}
              alignedAxis={Cartesian3.ZERO}
              scaleByDistance={billboardScaleByDistance}
              horizontalOrigin={HorizontalOrigin.CENTER}
              verticalOrigin={VerticalOrigin.CENTER}
            />
            {displayCallsign !== null && (
              <LabelGraphics
                text={displayCallsign}
                font="10px JetBrains Mono, monospace"
                fillColor={labelColor}
                style={LabelStyle.FILL_AND_OUTLINE}
                outlineColor={Color.BLACK}
                outlineWidth={2}
                pixelOffset={labelPixelOffset}
                verticalOrigin={VerticalOrigin.CENTER}
                scaleByDistance={labelScaleByDistance}
              />
            )}
          </Entity>
        )
      })}
    </>
  )
}
