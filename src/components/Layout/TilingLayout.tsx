import { Mosaic, MosaicWindow } from 'react-mosaic-component'
import type { MosaicNode } from 'react-mosaic-component'
import 'react-mosaic-component/react-mosaic-component.css'

import type { PanelId } from '../../types'
import { useLayoutStore } from '../../store/layout'
import { InfoPanel } from '../Panels/InfoPanel'
import { FinancialPanel } from '../Financial'
import { NewsPanel } from '../News'
import { SignalPanel } from '../Signals'
import { useGlobeStore } from '../../store/globe'
import { GlobeViewer, CountryLayer, CityMarkers, FlightLayer, TrajectoryLayer, Photorealistic3DLayer, SatelliteLayer, USDetailLayer, StateCapitalMarkers } from '../Globe'

export const PANEL_TITLES: Record<PanelId, string> = {
  globe: 'GLOBE',
  financial: 'FINANCIAL',
  news: 'INTEL FEED',
  signals: 'SIGNALS',
}

/** Wrapper that shows InfoPanel when an entity is selected, SignalPanel otherwise */
function SignalOrInfoPanel() {
  const selectedEntity = useGlobeStore((s) => s.selectedEntity)
  return selectedEntity ? <InfoPanel /> : <SignalPanel />
}

function renderTile(id: PanelId, path: number[]) {
  const title = PANEL_TITLES[id]

  return (
    <MosaicWindow<PanelId> path={path} title={title}>
      {id === 'globe' ? (
        <div id="globe-container" style={{ width: '100%', height: '100%' }}>
          <GlobeViewer>
            <CountryLayer />
            <CityMarkers />
            <StateCapitalMarkers />
            <FlightLayer />
            <TrajectoryLayer />
            <SatelliteLayer />
            <USDetailLayer />
            <Photorealistic3DLayer />
          </GlobeViewer>
        </div>
      ) : id === 'financial' ? (
        <FinancialPanel />
      ) : id === 'signals' ? (
        <SignalOrInfoPanel />
      ) : id === 'news' ? (
        <NewsPanel />
      ) : null}
    </MosaicWindow>
  )
}

export function TilingLayout() {
  const layout = useLayoutStore((s) => s.layout)
  const setLayout = useLayoutStore((s) => s.setLayout)

  const handleChange = (newNode: MosaicNode<PanelId> | null) => {
    setLayout(newNode)
  }

  return (
    <div className="flex-1" style={{ minHeight: 0 }}>
      <Mosaic<PanelId>
        renderTile={renderTile}
        value={layout}
        onChange={handleChange}
        className="mosaic-blueprint-theme bp5-dark"
      />
    </div>
  )
}
