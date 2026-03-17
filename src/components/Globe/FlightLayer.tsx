import { useMemo } from 'react'
import { Entity, BillboardGraphics, LabelGraphics } from 'resium'
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
import { useFlights } from '../../feeds/flights'
import {
  CIVILIAN_PLANE_ICON,
  MILITARY_PLANE_ICON,
  isMilitaryCallsign,
} from '../../utils/planeIcon'

const MAX_DISPLAYED_FLIGHTS = 800

const labelScaleByDistance = new NearFarScalar(1e5, 1.0, 1e7, 0.0)
const billboardScaleByDistance = new NearFarScalar(1e5, 0.7, 2e7, 0.25)
const labelPixelOffset = new Cartesian2(18, -4)

const GREEN = Color.fromCssColorString('#00ff41')
const RED = Color.fromCssColorString('#ff0040')

/** Renders live flight positions on the globe as oriented plane icons */
export function FlightLayer() {
  const { flights } = useFlights()

  // Limit displayed flights for performance, prefer flights with callsigns
  const visibleFlights = useMemo(() => {
    if (flights.length <= MAX_DISPLAYED_FLIGHTS) return flights

    const sorted = [...flights].sort((a, b) => {
      const aHas = a.callsign && a.callsign.trim().length > 0 ? 0 : 1
      const bHas = b.callsign && b.callsign.trim().length > 0 ? 0 : 1
      return aHas - bHas
    })
    return sorted.slice(0, MAX_DISPLAYED_FLIGHTS)
  }, [flights])

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
