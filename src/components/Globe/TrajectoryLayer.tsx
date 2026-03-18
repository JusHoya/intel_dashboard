import { useMemo } from 'react'
import { Entity, PolylineGraphics, PointGraphics, LabelGraphics } from 'resium'
import {
  ArcType,
  Cartesian3,
  Color,
  NearFarScalar,
  LabelStyle,
  VerticalOrigin,
  Cartesian2,
} from 'cesium'
import { useGlobeStore } from '../../store/globe'
import { useFlightRoute } from '../../feeds/flightRoute'
import { AIRPORTS } from '../../data/airports'

const TRAJECTORY_COLOR = Color.fromCssColorString('#00aaff').withAlpha(0.5)
const AIRPORT_COLOR = Color.fromCssColorString('#ffaa00')
const labelOffset = new Cartesian2(10, -10)
const labelScaleByDistance = new NearFarScalar(1e5, 1.0, 1e7, 0.3)

/**
 * Renders a geodesic trajectory arc between departure and arrival airports
 * for the currently hovered or selected flight.
 */
export function TrajectoryLayer() {
  const selectedEntity = useGlobeStore((s) => s.selectedEntity)
  const hoveredCallsign = useGlobeStore((s) => s.hoveredFlightCallsign)

  // Selected flight callsign takes priority over hovered
  const activeCallsign = useMemo(() => {
    if (
      selectedEntity?.type === 'flight' &&
      selectedEntity.metadata?.callsign
    ) {
      return selectedEntity.metadata.callsign as string
    }
    return hoveredCallsign
  }, [selectedEntity, hoveredCallsign])

  const route = useFlightRoute(activeCallsign)

  // Resolve airport positions
  const trajectory = useMemo(() => {
    if (!route?.departureIcao || !route?.arrivalIcao) return null

    const dep = AIRPORTS[route.departureIcao]
    const arr = AIRPORTS[route.arrivalIcao]
    if (!dep || !arr) return null

    return {
      departure: { ...dep, icao: route.departureIcao },
      arrival: { ...arr, icao: route.arrivalIcao },
      positions: Cartesian3.fromDegreesArrayHeights([
        dep.lon, dep.lat, 1000,
        arr.lon, arr.lat, 1000,
      ]),
    }
  }, [route])

  if (!trajectory) return null

  return (
    <>
      {/* Geodesic arc */}
      <Entity>
        <PolylineGraphics
          positions={trajectory.positions}
          width={2}
          material={TRAJECTORY_COLOR}
          arcType={ArcType.GEODESIC}
        />
      </Entity>

      {/* Departure airport marker */}
      <Entity
        position={Cartesian3.fromDegrees(
          trajectory.departure.lon,
          trajectory.departure.lat,
          1000,
        )}
      >
        <PointGraphics color={AIRPORT_COLOR} pixelSize={8} outlineColor={Color.BLACK} outlineWidth={1} />
        <LabelGraphics
          text={trajectory.departure.icao}
          font="11px JetBrains Mono, monospace"
          fillColor={AIRPORT_COLOR}
          style={LabelStyle.FILL_AND_OUTLINE}
          outlineColor={Color.BLACK}
          outlineWidth={2}
          pixelOffset={labelOffset}
          verticalOrigin={VerticalOrigin.CENTER}
          scaleByDistance={labelScaleByDistance}
        />
      </Entity>

      {/* Arrival airport marker */}
      <Entity
        position={Cartesian3.fromDegrees(
          trajectory.arrival.lon,
          trajectory.arrival.lat,
          1000,
        )}
      >
        <PointGraphics color={AIRPORT_COLOR} pixelSize={8} outlineColor={Color.BLACK} outlineWidth={1} />
        <LabelGraphics
          text={trajectory.arrival.icao}
          font="11px JetBrains Mono, monospace"
          fillColor={AIRPORT_COLOR}
          style={LabelStyle.FILL_AND_OUTLINE}
          outlineColor={Color.BLACK}
          outlineWidth={2}
          pixelOffset={labelOffset}
          verticalOrigin={VerticalOrigin.CENTER}
          scaleByDistance={labelScaleByDistance}
        />
      </Entity>
    </>
  )
}
