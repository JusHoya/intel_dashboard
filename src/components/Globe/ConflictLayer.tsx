import { useMemo } from 'react'
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
import { useSignalStore } from '../../store/signals'

/**
 * Country code → approximate center coordinates for conflict visualization.
 * Used to place markers when signals reference a country.
 */
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
  US: { lat: 39.5, lon: -98.35 }, UA: { lat: 48.38, lon: 31.17 },
  RU: { lat: 55.75, lon: 37.62 }, SY: { lat: 34.80, lon: 38.99 },
  IQ: { lat: 33.31, lon: 44.37 }, AF: { lat: 34.53, lon: 69.17 },
  YE: { lat: 15.37, lon: 44.19 }, SD: { lat: 15.50, lon: 32.56 },
  MM: { lat: 19.76, lon: 96.07 }, SO: { lat: 2.05, lon: 45.32 },
  CD: { lat: -4.32, lon: 15.31 }, ET: { lat: 9.02, lon: 38.75 },
  NG: { lat: 9.06, lon: 7.49 }, ML: { lat: 12.64, lon: -8.00 },
  PS: { lat: 31.95, lon: 35.23 }, IL: { lat: 31.77, lon: 35.22 },
  LB: { lat: 33.89, lon: 35.50 }, PK: { lat: 33.69, lon: 73.04 },
  LY: { lat: 32.90, lon: 13.18 }, MZ: { lat: -12.98, lon: 40.52 },
  CF: { lat: 4.36, lon: 18.55 }, CM: { lat: 3.85, lon: 11.50 },
  HT: { lat: 18.54, lon: -72.34 }, CO: { lat: 4.71, lon: -74.07 },
  MX: { lat: 19.43, lon: -99.13 }, CN: { lat: 39.90, lon: 116.40 },
  IR: { lat: 35.69, lon: 51.39 }, KP: { lat: 39.02, lon: 125.75 },
  TW: { lat: 25.03, lon: 121.57 }, IN: { lat: 28.61, lon: 77.21 },
  SA: { lat: 24.71, lon: 46.68 }, TR: { lat: 39.93, lon: 32.86 },
  EG: { lat: 30.04, lon: 31.24 }, KE: { lat: -1.29, lon: 36.82 },
  VE: { lat: 10.49, lon: -66.88 }, PH: { lat: 14.60, lon: 120.98 },
  TH: { lat: 13.76, lon: 100.50 }, ID: { lat: -6.21, lon: 106.85 },
}

interface ConflictMarker {
  id: string
  lat: number
  lon: number
  label: string
  severity: string
  category: string
  summary: string
}

const SEVERITY_COLORS: Record<string, Color> = {
  critical: Color.fromCssColorString('#ff0040'),
  high: Color.fromCssColorString('#ff4400'),
  medium: Color.fromCssColorString('#ff8800'),
  low: Color.fromCssColorString('#ffaa44'),
}

const displayCondition = new DistanceDisplayCondition(0, 20_000_000)
const labelDisplay = new DistanceDisplayCondition(0, 5_000_000)
const pointScale = new NearFarScalar(500_000, 1.2, 15_000_000, 0.3)
const labelScale = new NearFarScalar(200_000, 1.0, 5_000_000, 0.3)
const labelFade = new NearFarScalar(500_000, 1.0, 5_000_000, 0.0)
const labelOffset = new Cartesian2(10, 0)

function makeConflictProperties(marker: ConflictMarker): PropertyBag {
  const bag = new PropertyBag()
  bag.addProperty('entityType', new ConstantProperty('conflict'))
  bag.addProperty('severity', new ConstantProperty(marker.severity))
  bag.addProperty('category', new ConstantProperty(marker.category))
  bag.addProperty('summary', new ConstantProperty(marker.summary))
  return bag
}

/**
 * Renders conflict zone markers on the globe, driven by the signal engine.
 * Uses signals from categories: conflict, sanctions, disaster, cyber.
 * Each signal with country data becomes a marker at the country's center
 * with jitter to spread multiple events.
 */
export function ConflictLayer() {
  const viewMode = useGlobeStore((s) => s.viewMode)
  const showConflicts = useGlobeStore((s) => s.showConflicts)
  const signals = useSignalStore((s) => s.signals)

  const markers = useMemo<ConflictMarker[]>(() => {
    if (!showConflicts) return []

    // Only show conflict-relevant signal categories
    const conflictCategories = new Set(['conflict', 'sanctions', 'disaster', 'cyber', 'political'])

    return signals
      .filter((s) => conflictCategories.has(s.category) && s.countries.length > 0)
      .flatMap((signal, sIdx) =>
        signal.countries.map((cc, cIdx) => {
          const coords = COUNTRY_COORDS[cc]
          if (!coords) return null

          // Jitter to spread multiple events in the same country
          const jLat = (Math.sin(sIdx * 7 + cIdx * 13) * 0.5) * 3
          const jLon = (Math.cos(sIdx * 11 + cIdx * 7) * 0.5) * 3

          return {
            id: `${signal.id}-${cc}`,
            lat: coords.lat + jLat,
            lon: coords.lon + jLon,
            label: signal.category.toUpperCase(),
            severity: signal.severity,
            category: signal.category,
            summary: signal.summary,
          } as ConflictMarker
        }),
      )
      .filter((m): m is ConflictMarker => m !== null)
      .slice(0, 100) // cap at 100 markers
  }, [signals, showConflicts])

  if (viewMode === 'photorealistic' || !showConflicts || markers.length === 0) return null

  return (
    <>
      {markers.map((marker) => {
        const color = SEVERITY_COLORS[marker.severity] ?? SEVERITY_COLORS.low
        return (
          <Entity
            key={marker.id}
            name={marker.summary.slice(0, 80)}
            position={Cartesian3.fromDegrees(marker.lon, marker.lat)}
            properties={makeConflictProperties(marker)}
          >
            <PointGraphics
              pixelSize={9}
              color={color}
              outlineColor={Color.fromCssColorString('#440000')}
              outlineWidth={2}
              scaleByDistance={pointScale}
              distanceDisplayCondition={displayCondition}
            />
            <LabelGraphics
              text={marker.label}
              font="9px JetBrains Mono, monospace"
              fillColor={color}
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
        )
      })}
    </>
  )
}
