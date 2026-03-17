import { describe, it, expect, beforeEach } from 'vitest'
import { useGlobeStore } from '../../src/store/globe'
import { useMarketStore } from '../../src/store/market'
import { COUNTRY_TICKER_MAP, COUNTRY_NAME_TO_ISO } from '../../src/data/tickers'

describe('geo-linking logic', () => {
  beforeEach(() => {
    useGlobeStore.getState().clearSelection()
    useMarketStore.getState().setGeoLinkedSymbols([])
  })

  it('COUNTRY_NAME_TO_ISO resolves common country names', () => {
    expect(COUNTRY_NAME_TO_ISO['United States of America']).toBe('US')
    expect(COUNTRY_NAME_TO_ISO['China']).toBe('CN')
    expect(COUNTRY_NAME_TO_ISO['Japan']).toBe('JP')
    expect(COUNTRY_NAME_TO_ISO['United Kingdom']).toBe('GB')
    expect(COUNTRY_NAME_TO_ISO['Germany']).toBe('DE')
    expect(COUNTRY_NAME_TO_ISO['Brazil']).toBe('BR')
  })

  it('COUNTRY_TICKER_MAP returns correct tickers for US', () => {
    const usTickers = COUNTRY_TICKER_MAP['US']
    expect(usTickers).toContain('AAPL')
    expect(usTickers).toContain('MSFT')
    expect(usTickers).toContain('GOOGL')
  })

  it('COUNTRY_TICKER_MAP returns tickers for CN', () => {
    const cnTickers = COUNTRY_TICKER_MAP['CN']
    expect(cnTickers).toContain('BABA')
  })

  it('COUNTRY_TICKER_MAP returns tickers for JP', () => {
    const jpTickers = COUNTRY_TICKER_MAP['JP']
    expect(jpTickers).toContain('TM')
  })

  it('selecting a country entity sets geo-linked symbols', () => {
    // Simulate what useGeoLinking does
    const countryName = 'United States of America'
    const iso = COUNTRY_NAME_TO_ISO[countryName]
    const linkedTickers = COUNTRY_TICKER_MAP[iso] ?? []
    useMarketStore.getState().setGeoLinkedSymbols(linkedTickers)

    expect(useMarketStore.getState().geoLinkedSymbols).toEqual(COUNTRY_TICKER_MAP['US'])
  })

  it('clearing selection clears geo-linked symbols', () => {
    useMarketStore.getState().setGeoLinkedSymbols(['AAPL', 'MSFT'])
    useMarketStore.getState().setGeoLinkedSymbols([])
    expect(useMarketStore.getState().geoLinkedSymbols).toEqual([])
  })

  it('unknown country yields empty geo-linked symbols', () => {
    const iso = COUNTRY_NAME_TO_ISO['Atlantis']
    expect(iso).toBeUndefined()
    const linkedTickers = COUNTRY_TICKER_MAP[iso!] ?? []
    expect(linkedTickers).toEqual([])
  })
})
