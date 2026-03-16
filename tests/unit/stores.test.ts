import { useLayoutStore } from '../../src/store/layout'
import { useGlobeStore } from '../../src/store/globe'
import { useAppStore } from '../../src/store/app'
import type { GlobeEntity, FeedHealth } from '../../src/types'

// Reset all stores between tests to avoid leaking state
afterEach(() => {
  useLayoutStore.setState({ preset: 'default' })
  useGlobeStore.setState({ selectedEntity: null, globeReady: false })
  useAppStore.setState({
    feedHealth: [],
    scanlinesEnabled: true,
  })
})

describe('useLayoutStore', () => {
  it('has "default" as the default preset', () => {
    const { preset } = useLayoutStore.getState()
    expect(preset).toBe('default')
  })

  it('setPreset changes the preset', () => {
    useLayoutStore.getState().setPreset('fullGlobe')
    expect(useLayoutStore.getState().preset).toBe('fullGlobe')

    useLayoutStore.getState().setPreset('tradingFloor')
    expect(useLayoutStore.getState().preset).toBe('tradingFloor')
  })
})

describe('useGlobeStore', () => {
  it('selectedEntity starts as null', () => {
    expect(useGlobeStore.getState().selectedEntity).toBeNull()
  })

  it('globeReady starts as false', () => {
    expect(useGlobeStore.getState().globeReady).toBe(false)
  })

  it('selectEntity sets the selected entity', () => {
    const entity: GlobeEntity = {
      id: 'test-1',
      type: 'country',
      name: 'Test Country',
      coordinates: { latitude: 40.0, longitude: -74.0 },
    }
    useGlobeStore.getState().selectEntity(entity)
    expect(useGlobeStore.getState().selectedEntity).toEqual(entity)
  })

  it('clearSelection sets selectedEntity back to null', () => {
    const entity: GlobeEntity = {
      id: 'test-2',
      type: 'city',
      name: 'Test City',
      coordinates: { latitude: 51.5, longitude: -0.1 },
    }
    useGlobeStore.getState().selectEntity(entity)
    expect(useGlobeStore.getState().selectedEntity).not.toBeNull()

    useGlobeStore.getState().clearSelection()
    expect(useGlobeStore.getState().selectedEntity).toBeNull()
  })

  it('setGlobeReady updates the globeReady flag', () => {
    useGlobeStore.getState().setGlobeReady(true)
    expect(useGlobeStore.getState().globeReady).toBe(true)

    useGlobeStore.getState().setGlobeReady(false)
    expect(useGlobeStore.getState().globeReady).toBe(false)
  })
})

describe('useAppStore', () => {
  it('sessionStart is a Date', () => {
    const { sessionStart } = useAppStore.getState()
    expect(sessionStart).toBeInstanceOf(Date)
  })

  it('scanlinesEnabled starts as true', () => {
    expect(useAppStore.getState().scanlinesEnabled).toBe(true)
  })

  it('toggleScanlines toggles the scanlinesEnabled flag', () => {
    useAppStore.getState().toggleScanlines()
    expect(useAppStore.getState().scanlinesEnabled).toBe(false)

    useAppStore.getState().toggleScanlines()
    expect(useAppStore.getState().scanlinesEnabled).toBe(true)
  })

  it('updateFeedHealth updates the feedHealth array', () => {
    const feeds: FeedHealth[] = [
      { name: 'Reuters', status: 'online', lastUpdate: new Date() },
      { name: 'Bloomberg', status: 'degraded', lastUpdate: null },
    ]
    useAppStore.getState().updateFeedHealth(feeds)
    expect(useAppStore.getState().feedHealth).toEqual(feeds)
    expect(useAppStore.getState().feedHealth).toHaveLength(2)
  })
})
