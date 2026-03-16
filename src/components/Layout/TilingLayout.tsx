import { Mosaic, MosaicWindow } from 'react-mosaic-component'
import type { MosaicNode } from 'react-mosaic-component'
import 'react-mosaic-component/react-mosaic-component.css'

import type { PanelId } from '../../types'
import { PlaceholderPanel } from '../Panels/PlaceholderPanel'
import { InfoPanel } from '../Panels/InfoPanel'
import { GlobeViewer, CountryLayer, CityMarkers, FlightLayer } from '../Globe'

export const PANEL_TITLES: Record<PanelId, string> = {
  globe: 'GLOBE',
  financial: 'FINANCIAL',
  news: 'INTEL FEED',
  signals: 'ENTITY INTEL',
}

const INITIAL_LAYOUT: MosaicNode<PanelId> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [65, 35],
  children: [
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [65, 35],
      children: ['globe', 'news'],
    },
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [65, 35],
      children: ['financial', 'signals'],
    },
  ],
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
            <FlightLayer />
          </GlobeViewer>
        </div>
      ) : id === 'signals' ? (
        <InfoPanel />
      ) : (
        <PlaceholderPanel title={title} id={id} />
      )}
    </MosaicWindow>
  )
}

export function TilingLayout() {
  return (
    <div className="flex-1" style={{ minHeight: 0 }}>
      <Mosaic<PanelId>
        renderTile={renderTile}
        initialValue={INITIAL_LAYOUT}
        className="mosaic-blueprint-theme bp5-dark"
      />
    </div>
  )
}
