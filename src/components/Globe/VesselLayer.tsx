import { useState, useEffect, useCallback } from 'react'
import { Entity, BillboardGraphics, LabelGraphics } from 'resium'
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
import { useGlobeStore } from '../../store/globe'

const SERVER = 'http://localhost:3001'

interface VesselPosition {
  mmsi: string
  name: string
  latitude: number
  longitude: number
  course: number
  speed: number
  heading: number
  shipType: string
  flag: string
  destination: string
  lastUpdate: number
}

const VESSEL_COLOR = '#44aaff'

/** Create a ship icon SVG as data URL */
function makeShipIcon(heading: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <g transform="rotate(${heading}, 12, 12)">
      <polygon points="12,2 6,20 12,16 18,20" fill="${VESSEL_COLOR}" stroke="#003366" stroke-width="1"/>
    </g>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

const displayCondition = new DistanceDisplayCondition(0, 12_000_000)
const labelDisplay = new DistanceDisplayCondition(0, 2_000_000)
const labelScale = new NearFarScalar(100_000, 1.0, 2_000_000, 0.3)
const labelFade = new NearFarScalar(200_000, 1.0, 2_000_000, 0.0)
const billboardScale = new NearFarScalar(100_000, 0.8, 10_000_000, 0.2)
const labelOffset = new Cartesian2(14, 0)

function makeVesselProperties(vessel: VesselPosition): PropertyBag {
  const bag = new PropertyBag()
  bag.addProperty('entityType', new ConstantProperty('vessel'))
  bag.addProperty('mmsi', new ConstantProperty(vessel.mmsi))
  bag.addProperty('shipType', new ConstantProperty(vessel.shipType))
  bag.addProperty('speed', new ConstantProperty(vessel.speed))
  bag.addProperty('flag', new ConstantProperty(vessel.flag))
  bag.addProperty('destination', new ConstantProperty(vessel.destination))
  return bag
}

/**
 * Renders vessel/ship position markers on the globe.
 * Uses AIS data from server proxy (mock data for now).
 * Ship icons with heading rotation, blue coloring.
 */
export function VesselLayer() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const showVessels = useGlobeStore((s) => s.showVessels)
  const [vessels, setVessels] = useState<VesselPosition[]>([])

  const fetchVessels = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER}/api/vessels`)
      if (!res.ok) return
      const data = (await res.json()) as { vessels: VesselPosition[] }
      setVessels(data.vessels)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!showVessels) return
    fetchVessels()
    const interval = setInterval(fetchVessels, 120_000) // refresh every 2 min
    return () => clearInterval(interval)
  }, [showVessels, fetchVessels])

  if (viewMode === 'photorealistic' || !showVessels || vessels.length === 0) return null

  return (
    <>
      {vessels.map((vessel) => (
        <Entity
          key={vessel.mmsi}
          name={`${vessel.name} (${vessel.flag})`}
          position={Cartesian3.fromDegrees(vessel.longitude, vessel.latitude)}
          properties={makeVesselProperties(vessel)}
        >
          <BillboardGraphics
            image={makeShipIcon(vessel.heading)}
            width={20}
            height={20}
            scaleByDistance={billboardScale}
            distanceDisplayCondition={displayCondition}
          />
          <LabelGraphics
            text={vessel.name}
            font="9px JetBrains Mono, monospace"
            fillColor={Color.fromCssColorString(VESSEL_COLOR)}
            style={LabelStyle.FILL_AND_OUTLINE}
            outlineColor={Color.BLACK}
            outlineWidth={2}
            pixelOffset={labelOffset}
            verticalOrigin={VerticalOrigin.CENTER}
            scaleByDistance={labelScale}
            translucencyByDistance={labelFade}
            distanceDisplayCondition={labelDisplay}
          />
        </Entity>
      ))}
    </>
  )
}
