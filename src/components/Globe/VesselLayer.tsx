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

const VESSEL_LABEL_COLOR = Color.fromCssColorString('#44aaff')

/**
 * Create a proper ship/vessel icon SVG rotated by heading.
 * Ship shape: hull with bow (pointed front) and stern (flat back).
 */
function makeShipIcon(heading: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <g transform="rotate(${heading}, 14, 14)">
      <!-- Hull -->
      <path d="M14,3 L19,12 L19,22 Q14,26 14,26 Q14,26 9,22 L9,12 Z"
            fill="#44aaff" stroke="#1a4a7a" stroke-width="1.2" stroke-linejoin="round"/>
      <!-- Bridge/superstructure -->
      <rect x="11" y="13" width="6" height="4" rx="1" fill="#2266aa" stroke="#1a4a7a" stroke-width="0.5"/>
      <!-- Bow marker -->
      <circle cx="14" cy="6" r="1.5" fill="#88ccff"/>
    </g>
  </svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

const displayCondition = new DistanceDisplayCondition(0, 15_000_000)
const labelDisplay = new DistanceDisplayCondition(0, 3_000_000)
const labelScale = new NearFarScalar(100_000, 1.0, 3_000_000, 0.3)
const labelFade = new NearFarScalar(200_000, 1.0, 3_000_000, 0.0)
const billboardScale = new NearFarScalar(100_000, 1.0, 12_000_000, 0.25)
const labelOffset = new Cartesian2(16, 0)

function makeVesselProperties(vessel: VesselPosition): PropertyBag {
  const bag = new PropertyBag()
  bag.addProperty('entityType', new ConstantProperty('vessel'))
  bag.addProperty('mmsi', new ConstantProperty(vessel.mmsi))
  bag.addProperty('shipType', new ConstantProperty(vessel.shipType))
  bag.addProperty('speed', new ConstantProperty(`${vessel.speed.toFixed(1)} kn`))
  bag.addProperty('flag', new ConstantProperty(vessel.flag))
  bag.addProperty('destination', new ConstantProperty(vessel.destination))
  bag.addProperty('heading', new ConstantProperty(`${vessel.heading.toFixed(0)}°`))
  return bag
}

/**
 * Renders vessel/ship position markers on the globe.
 * Uses AIS data from server proxy.
 * Ship-shaped icons rotated by heading, blue coloring.
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
    } catch {
      console.warn('[vessels] Failed to fetch vessel data')
    }
  }, [])

  useEffect(() => {
    if (!showVessels) {
      setVessels([])
      return
    }
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
            width={24}
            height={24}
            scaleByDistance={billboardScale}
            distanceDisplayCondition={displayCondition}
          />
          <LabelGraphics
            text={`${vessel.name}`}
            font="9px JetBrains Mono, monospace"
            fillColor={VESSEL_LABEL_COLOR}
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
