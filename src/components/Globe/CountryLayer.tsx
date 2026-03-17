import { useCallback } from 'react'
import { GeoJsonDataSource } from 'resium'
import {
  ArcType,
  Color,
  ColorMaterialProperty,
  ConstantProperty,
  GeoJsonDataSource as CesiumGeoJsonDataSource,
} from 'cesium'

const COUNTRIES_URL = '/data/countries.geo.json'

const FILL_COLOR = Color.fromCssColorString('#00ff41').withAlpha(0.08)
const STROKE_COLOR = Color.fromCssColorString('#00ff41').withAlpha(0.6)

export function CountryLayer() {
  const handleLoad = useCallback((dataSource: CesiumGeoJsonDataSource) => {
    const entities = dataSource.entities.values

    for (const entity of entities) {
      // Tag every entity for the click handler
      if (entity.properties) {
        entity.properties.addProperty('entityType', 'country')
      }

      // Style polygons with visible fill and outline.
      // ArcType.NONE avoids the expensive rhumb-line subdivision that
      // crashes on very complex polygons (Russia, Canada, etc.).
      if (entity.polygon) {
        entity.polygon.material = new ColorMaterialProperty(FILL_COLOR)
        entity.polygon.outline = new ConstantProperty(true)
        entity.polygon.outlineColor = new ConstantProperty(STROKE_COLOR)
        entity.polygon.outlineWidth = new ConstantProperty(1)
        entity.polygon.arcType = new ConstantProperty(ArcType.GEODESIC)
      }

      // Style polylines
      if (entity.polyline) {
        entity.polyline.material = new ColorMaterialProperty(STROKE_COLOR)
        entity.polyline.width = new ConstantProperty(1.5)
      }
    }
  }, [])

  return (
    <GeoJsonDataSource
      data={COUNTRIES_URL}
      fill={FILL_COLOR}
      stroke={STROKE_COLOR}
      strokeWidth={1.5}
      clampToGround={false}
      onLoad={handleLoad}
    />
  )
}
