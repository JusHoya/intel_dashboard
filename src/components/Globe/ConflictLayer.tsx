import { useState, useEffect, useRef, useCallback } from 'react'
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
import { useGlobeStore } from '../../store/globe'

const SERVER = 'http://localhost:3001'

interface ConflictEvent {
  id: string
  date: string
  type: string
  subType: string
  country: string
  latitude: number
  longitude: number
  fatalities: number
  description: string
  source: string
}

const CONFLICT_COLOR = Color.fromCssColorString('#ff2222')
const CONFLICT_LABEL_COLOR = Color.fromCssColorString('#ff4444')

const displayCondition = new DistanceDisplayCondition(0, 15_000_000)
const labelDisplay = new DistanceDisplayCondition(0, 3_000_000)
const pointScale = new NearFarScalar(500_000, 1.0, 15_000_000, 0.3)
const labelScale = new NearFarScalar(200_000, 1.0, 3_000_000, 0.3)
const labelFade = new NearFarScalar(500_000, 1.0, 3_000_000, 0.0)
const labelOffset = new Cartesian2(10, 0)

function makeConflictProperties(event: ConflictEvent): PropertyBag {
  const bag = new PropertyBag()
  bag.addProperty('entityType', new ConstantProperty('conflict'))
  bag.addProperty('conflictType', new ConstantProperty(event.type))
  bag.addProperty('subType', new ConstantProperty(event.subType))
  bag.addProperty('country', new ConstantProperty(event.country))
  bag.addProperty('description', new ConstantProperty(event.description))
  return bag
}

/**
 * Renders conflict zone event markers on the globe.
 * Data sourced from GDELT conflict articles via server proxy.
 * Red markers with pulsing effect for active conflict zones.
 */
export function ConflictLayer() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const showConflicts = useGlobeStore((s) => s.showConflicts)
  const [events, setEvents] = useState<ConflictEvent[]>([])
  const fetchedRef = useRef(false)

  const fetchConflicts = useCallback(async () => {
    try {
      const res = await fetch(`${SERVER}/api/conflicts`)
      if (!res.ok) return
      const data = (await res.json()) as { events: ConflictEvent[] }
      setEvents(data.events)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (!showConflicts || fetchedRef.current) return
    fetchedRef.current = true
    fetchConflicts()

    // Refresh every 30 minutes
    const interval = setInterval(fetchConflicts, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [showConflicts, fetchConflicts])

  if (viewMode === 'photorealistic' || !showConflicts || events.length === 0) return null

  return (
    <>
      {events.map((event) => (
        <Entity
          key={event.id}
          name={event.description.slice(0, 80)}
          position={Cartesian3.fromDegrees(event.longitude, event.latitude)}
          properties={makeConflictProperties(event)}
        >
          <PointGraphics
            pixelSize={8}
            color={CONFLICT_COLOR}
            outlineColor={Color.fromCssColorString('#880000')}
            outlineWidth={2}
            scaleByDistance={pointScale}
            distanceDisplayCondition={displayCondition}
          />
          <LabelGraphics
            text={event.subType}
            font="9px JetBrains Mono, monospace"
            fillColor={CONFLICT_LABEL_COLOR}
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
