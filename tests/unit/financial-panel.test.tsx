import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sparkline } from '../../src/components/Financial/Sparkline'

// Mock WebSocket and feeds to avoid real connections in tests
vi.mock('../../src/feeds/crypto', () => ({
  useCryptoFeed: vi.fn(),
  fetchCryptoCandles: vi.fn().mockResolvedValue([]),
  subscribeCryptoKline: vi.fn().mockReturnValue(() => {}),
}))

vi.mock('../../src/feeds/stocks', () => ({
  useStockFeed: vi.fn(),
}))

describe('Sparkline component', () => {
  it('renders an SVG element', () => {
    const { container } = render(<Sparkline data={[100, 102, 101, 105]} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeTruthy()
  })

  it('renders a flat line when data has fewer than 2 points', () => {
    const { container } = render(<Sparkline data={[100]} />)
    const line = container.querySelector('line')
    expect(line).toBeTruthy()
  })

  it('renders a polyline when data has 2+ points', () => {
    const { container } = render(<Sparkline data={[100, 102, 101, 105]} />)
    const polyline = container.querySelector('polyline')
    expect(polyline).toBeTruthy()
  })

  it('uses green stroke for upward trend', () => {
    const { container } = render(<Sparkline data={[100, 105]} />)
    const polyline = container.querySelector('polyline')
    expect(polyline?.getAttribute('stroke')).toBe('#00ff41')
  })

  it('uses red stroke for downward trend', () => {
    const { container } = render(<Sparkline data={[105, 100]} />)
    const polyline = container.querySelector('polyline')
    expect(polyline?.getAttribute('stroke')).toBe('#ff0040')
  })

  it('respects explicit positive prop', () => {
    const { container } = render(<Sparkline data={[105, 100]} positive={true} />)
    const polyline = container.querySelector('polyline')
    expect(polyline?.getAttribute('stroke')).toBe('#00ff41')
  })

  it('accepts custom width and height', () => {
    const { container } = render(<Sparkline data={[1, 2, 3]} width={100} height={40} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('100')
    expect(svg?.getAttribute('height')).toBe('40')
  })
})

describe('FinancialPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', async () => {
    // Dynamically import to ensure mocks are applied
    const { FinancialPanel } = await import('../../src/components/Financial/FinancialPanel')
    render(<FinancialPanel />)
    expect(screen.getByText('FINANCIAL')).toBeTruthy()
  })

  it('renders view mode tabs', async () => {
    const { FinancialPanel } = await import('../../src/components/Financial/FinancialPanel')
    render(<FinancialPanel />)
    expect(screen.getByText('LIST')).toBeTruthy()
    expect(screen.getByText('CHART')).toBeTruthy()
    expect(screen.getByText('HEAT')).toBeTruthy()
  })

  it('renders column headers in watchlist mode', async () => {
    const { FinancialPanel } = await import('../../src/components/Financial/FinancialPanel')
    render(<FinancialPanel />)
    expect(screen.getByText('Symbol')).toBeTruthy()
    expect(screen.getByText('Price')).toBeTruthy()
  })
})
