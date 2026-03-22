import { Mosaic, MosaicWindow } from 'react-mosaic-component'
import type { MosaicNode } from 'react-mosaic-component'
import 'react-mosaic-component/react-mosaic-component.css'

import type { PanelId } from '../../types'
import { InfoPanel } from '../Panels/InfoPanel'
import { FinancialPanel } from '../Financial'
import { NewsPanel } from '../News'
import { GlobeViewer, CountryLayer, CityMarkers, FlightLayer, TrajectoryLayer, Photorealistic3DLayer } from '../Globe'

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
            <TrajectoryLayer />
            <Photorealistic3DLayer />
          </GlobeViewer>
        </div>
      ) : id === 'financial' ? (
        <FinancialPanel />
      ) : id === 'signals' ? (
        <InfoPanel />
      ) : id === 'news' ? (
        <NewsPanel />
      ) : null}
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
