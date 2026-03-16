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
import { FINANCIAL_CENTERS } from '../../data/cities'

const PHOSPHOR_GREEN = Color.fromCssColorString('#00ff41')

/** Near/far scalar to fade labels at extreme distance */
const labelScaleByDistance = new NearFarScalar(1_000_000, 1.0, 20_000_000, 0.4)

/** Near/far scalar to fade dots at extreme distance */
const pointScaleByDistance = new NearFarScalar(1_000_000, 1.0, 20_000_000, 0.6)

/** Offset label to the right of the dot */
const labelPixelOffset = new Cartesian2(8, 0)

/** Build a PropertyBag with entityType set to 'city' */
function makeCityProperties(): PropertyBag {
  const bag = new PropertyBag()
  bag.addProperty('entityType', new ConstantProperty('city'))
  return bag
}

/** Renders markers for major financial centers on the globe */
export function CityMarkers() {
  return (
    <>
      {FINANCIAL_CENTERS.map((city) => (
        <Entity
          key={city.id}
          name={city.name}
          position={Cartesian3.fromDegrees(city.longitude, city.latitude)}
          properties={makeCityProperties()}
        >
          <PointGraphics
            pixelSize={6}
            color={PHOSPHOR_GREEN}
            outlineColor={Color.BLACK}
            outlineWidth={1}
            scaleByDistance={pointScaleByDistance}
          />
          <LabelGraphics
            text={city.name}
            font="11px JetBrains Mono, monospace"
            fillColor={PHOSPHOR_GREEN}
            style={LabelStyle.FILL_AND_OUTLINE}
            outlineColor={Color.BLACK}
            outlineWidth={2}
            pixelOffset={labelPixelOffset}
            verticalOrigin={VerticalOrigin.CENTER}
            scaleByDistance={labelScaleByDistance}
          />
        </Entity>
      ))}
    </>
  )
}
