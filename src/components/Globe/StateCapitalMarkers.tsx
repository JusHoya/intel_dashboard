import { Entity, PointGraphics, LabelGraphics } from 'resium'
import {
  Cartesian2,
  Cartesian3,
  Color,
  ConstantProperty,
  NearFarScalar,
  DistanceDisplayCondition,
  LabelStyle,
  VerticalOrigin,
  PropertyBag,
} from 'cesium'
import { US_STATE_CAPITALS } from '../../data/stateCapitals'
import { useGlobeStore } from '../../store/globe'

const CAPITAL_COLOR = Color.fromCssColorString('#ffaa00') // amber for capitals
const STAR_COLOR = Color.fromCssColorString('#ffcc00')    // gold star marker

/**
 * Distance display condition: show capitals when camera is
 * within 5,000 km of the marker, hide beyond that.
 */
const displayCondition = new DistanceDisplayCondition(0, 5_000_000)

/** Scaling for capital markers by distance */
const pointScale = new NearFarScalar(100_000, 1.0, 5_000_000, 0.4)
const labelScale = new NearFarScalar(100_000, 1.0, 3_000_000, 0.3)

/** Fade labels out at long distance */
const labelFade = new NearFarScalar(500_000, 1.0, 4_000_000, 0.0)

/** Offset label to the right of the point */
const labelOffset = new Cartesian2(10, 0)

function makeCapitalProperties(abbr: string, stateName: string): PropertyBag {
  const bag = new PropertyBag()
  bag.addProperty('entityType', new ConstantProperty('city'))
  bag.addProperty('stateAbbr', new ConstantProperty(abbr))
  bag.addProperty('stateName', new ConstantProperty(stateName))
  bag.addProperty('isCapital', new ConstantProperty(true))
  return bag
}

/**
 * Renders markers for all 50 US state capitals.
 * Uses Cesium's DistanceDisplayCondition for automatic zoom-based visibility —
 * markers only appear when the camera is within 5000km of a capital.
 * Uses amber/gold coloring to distinguish from green financial centers.
 */
export function StateCapitalMarkers() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const showStateCapitals = useGlobeStore((s) => s.showStateCapitals)

  // Hide in photorealistic mode (3D tiles have their own labels)
  if (viewMode === 'photorealistic' || !showStateCapitals) return null

  return (
    <>
      {US_STATE_CAPITALS.map((cap) => (
        <Entity
          key={cap.abbr}
          name={`${cap.capital}, ${cap.abbr}`}
          position={Cartesian3.fromDegrees(cap.longitude, cap.latitude)}
          properties={makeCapitalProperties(cap.abbr, cap.state)}
        >
          <PointGraphics
            pixelSize={7}
            color={STAR_COLOR}
            outlineColor={Color.BLACK}
            outlineWidth={1.5}
            scaleByDistance={pointScale}
            distanceDisplayCondition={displayCondition}
          />
          <LabelGraphics
            text={`${cap.capital} (${cap.abbr})`}
            font="10px JetBrains Mono, monospace"
            fillColor={CAPITAL_COLOR}
            style={LabelStyle.FILL_AND_OUTLINE}
            outlineColor={Color.BLACK}
            outlineWidth={2}
            pixelOffset={labelOffset}
            verticalOrigin={VerticalOrigin.CENTER}
            scaleByDistance={labelScale}
            translucencyByDistance={labelFade}
            distanceDisplayCondition={displayCondition}
          />
        </Entity>
      ))}
    </>
  )
}
