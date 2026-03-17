import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarketHeatmap } from '../../src/components/Financial/MarketHeatmap'
import { useMarketStore } from '../../src/store/market'

describe('MarketHeatmap', () => {
  beforeEach(() => {
    // Reset tickers to zero price
    const tickers = { ...useMarketStore.getState().tickers }
    for (const key of Object.keys(tickers)) {
      tickers[key] = { ...tickers[key], price: 0 }
    }
    useMarketStore.setState({ tickers })
  })

  it('shows waiting message when no prices loaded', () => {
    render(<MarketHeatmap />)
    expect(screen.getByText('WAITING FOR MARKET DATA...')).toBeTruthy()
  })

  it('renders ticker cells when prices are available', () => {
    const tickers = { ...useMarketStore.getState().tickers }
    tickers['BTC/USD'] = {
      ...tickers['BTC/USD'],
      price: 50000,
      changePercent24h: 2.5,
      volume24h: 1_000_000,
    }
    tickers['ETH/USD'] = {
      ...tickers['ETH/USD'],
      price: 3000,
      changePercent24h: -1.2,
      volume24h: 500_000,
    }
    useMarketStore.setState({ tickers })

    render(<MarketHeatmap />)
    expect(screen.getByText('BTC/USD')).toBeTruthy()
    expect(screen.getByText('ETH/USD')).toBeTruthy()
  })

  it('displays change percentages on cells', () => {
    const tickers = { ...useMarketStore.getState().tickers }
    tickers['BTC/USD'] = {
      ...tickers['BTC/USD'],
      price: 50000,
      changePercent24h: 3.7,
      volume24h: 1_000_000,
    }
    useMarketStore.setState({ tickers })

    render(<MarketHeatmap />)
    expect(screen.getByText('+3.7%')).toBeTruthy()
  })
})
