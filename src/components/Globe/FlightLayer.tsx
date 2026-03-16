import { useMemo } from 'react'
import { Entity, PointGraphics, LabelGraphics } from 'resium'
import {
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  NearFarScalar,
  LabelStyle,
  VerticalOrigin,
  PropertyBag,
} from 'cesium'
import { useFlights } from '../../feeds/flights'

const AMBER = Color.fromCssColorString('#ffb000')
const MAX_DISPLAYED_FLIGHTS = 800

const labelScaleByDistance = new NearFarScalar(1e5, 1.0, 1e7, 0.0)
const pointScaleByDistance = new NearFarScalar(1e5, 1.0, 2e7, 0.4)
const labelPixelOffset = new Cartesian2(8, -4)

/** Renders live flight positions on the globe as amber dots */
export function FlightLayer() {
  const { flights } = useFlights()

  // Limit displayed flights for performance, prefer flights with callsigns
  const visibleFlights = useMemo(() => {
    if (flights.length <= MAX_DISPLAYED_FLIGHTS) return flights

    // Sort: flights with callsigns first, then cap
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
        if (flight.latitude === null || flight.longitude === null) return null

        const altitudeMeters = flight.baro_altitude ?? 10000
        const displayCallsign =
          flight.callsign && flight.callsign.trim().length > 0
            ? flight.callsign.trim()
            : null

        const properties = new PropertyBag()
        properties.addProperty('entityType', new ConstantProperty('flight'))
        properties.addProperty('callsign', new ConstantProperty(displayCallsign))
        properties.addProperty('origin_country', new ConstantProperty(flight.origin_country))
        properties.addProperty('velocity', new ConstantProperty(flight.velocity))
        properties.addProperty('altitude', new ConstantProperty(flight.baro_altitude))

        return (
          <Entity
            key={flight.icao24}
            name={displayCallsign ?? flight.icao24}
            position={Cartesian3.fromDegrees(
              flight.longitude,
              flight.latitude,
              altitudeMeters,
            )}
            properties={properties}
          >
            <PointGraphics
              pixelSize={4}
              color={AMBER}
              outlineColor={Color.BLACK}
              outlineWidth={1}
              scaleByDistance={pointScaleByDistance}
            />
            {displayCallsign !== null && (
              <LabelGraphics
                text={displayCallsign}
                font="10px JetBrains Mono, monospace"
                fillColor={AMBER}
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
