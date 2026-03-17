import { describe, it, expect, beforeEach } from 'vitest'
import { useMarketStore } from '../../src/store/market'

describe('market store', () => {
  beforeEach(() => {
    // Reset store between tests
    useMarketStore.setState({
      tickers: useMarketStore.getState().tickers,
      watchlist: useMarketStore.getState().watchlist,
      selectedTicker: null,
      viewMode: 'watchlist',
      candles: [],
      geoLinkedSymbols: [],
    })
  })

  it('initializes with default watchlist tickers', () => {
    const { tickers, watchlist } = useMarketStore.getState()
    expect(watchlist.length).toBeGreaterThan(0)
    expect(watchlist).toContain('BTC/USD')
    expect(watchlist).toContain('ETH/USD')
    expect(watchlist).toContain('AAPL')
    expect(tickers['BTC/USD']).toBeDefined()
    expect(tickers['BTC/USD'].name).toBe('Bitcoin')
    expect(tickers['BTC/USD'].assetClass).toBe('crypto')
  })

  it('initializes tickers with zero prices', () => {
    const { tickers } = useMarketStore.getState()
    expect(tickers['BTC/USD'].price).toBe(0)
    expect(tickers['AAPL'].price).toBe(0)
  })

  it('selects a ticker and switches to chart view', () => {
    useMarketStore.getState().selectTicker('BTC/USD')
    const state = useMarketStore.getState()
    expect(state.selectedTicker).toBe('BTC/USD')
    expect(state.viewMode).toBe('chart')
  })

  it('clears ticker selection and returns to watchlist view', () => {
    useMarketStore.getState().selectTicker('BTC/USD')
    useMarketStore.getState().clearTicker()
    const state = useMarketStore.getState()
    expect(state.selectedTicker).toBeNull()
    expect(state.viewMode).toBe('watchlist')
    expect(state.candles).toEqual([])
  })

  it('updates ticker price and maintains sparkline', () => {
    const store = useMarketStore.getState()
    store.updateTicker('BTC/USD', { price: 50000, lastUpdate: Date.now() })

    let ticker = useMarketStore.getState().tickers['BTC/USD']
    expect(ticker.price).toBe(50000)
    expect(ticker.sparkline).toContain(50000)

    // Second update should add to sparkline
    useMarketStore.getState().updateTicker('BTC/USD', { price: 51000, lastUpdate: Date.now() })
    ticker = useMarketStore.getState().tickers['BTC/USD']
    expect(ticker.price).toBe(51000)
    expect(ticker.sparkline.length).toBe(2)
    expect(ticker.prevPrice).toBe(50000)
  })

  it('caps sparkline at 30 points', () => {
    for (let i = 0; i < 35; i++) {
      useMarketStore.getState().updateTicker('BTC/USD', {
        price: 50000 + i * 100,
        lastUpdate: Date.now(),
      })
    }
    const ticker = useMarketStore.getState().tickers['BTC/USD']
    expect(ticker.sparkline.length).toBe(30)
  })

  it('ignores update for unknown symbol', () => {
    const before = { ...useMarketStore.getState().tickers }
    useMarketStore.getState().updateTicker('FAKE_TICKER', { price: 100 })
    const after = useMarketStore.getState().tickers
    expect(after).toEqual(before)
  })

  it('sets view mode', () => {
    useMarketStore.getState().setViewMode('heatmap')
    expect(useMarketStore.getState().viewMode).toBe('heatmap')
  })

  it('sets and appends candles', () => {
    const candles = [
      { time: 1000, open: 100, high: 110, low: 90, close: 105 },
      { time: 2000, open: 105, high: 115, low: 95, close: 110 },
    ]
    useMarketStore.getState().setCandles(candles)
    expect(useMarketStore.getState().candles).toEqual(candles)

    // Append new candle
    useMarketStore.getState().appendCandle({ time: 3000, open: 110, high: 120, low: 100, close: 115 })
    expect(useMarketStore.getState().candles.length).toBe(3)
  })

  it('replaces last candle if same timestamp on append', () => {
    useMarketStore.getState().setCandles([
      { time: 1000, open: 100, high: 110, low: 90, close: 105 },
    ])
    useMarketStore.getState().appendCandle({ time: 1000, open: 100, high: 115, low: 90, close: 112 })
    const candles = useMarketStore.getState().candles
    expect(candles.length).toBe(1)
    expect(candles[0].close).toBe(112)
  })

  it('sets geo-linked symbols', () => {
    useMarketStore.getState().setGeoLinkedSymbols(['AAPL', 'MSFT'])
    expect(useMarketStore.getState().geoLinkedSymbols).toEqual(['AAPL', 'MSFT'])
  })

  it('equity tickers have country associations', () => {
    const { tickers } = useMarketStore.getState()
    expect(tickers['AAPL'].countries).toContain('US')
    expect(tickers['BABA'].countries).toContain('CN')
    expect(tickers['TM'].countries).toContain('JP')
  })

  it('crypto tickers have empty country associations', () => {
    const { tickers } = useMarketStore.getState()
    expect(tickers['BTC/USD'].countries).toEqual([])
    expect(tickers['ETH/USD'].countries).toEqual([])
  })
})
