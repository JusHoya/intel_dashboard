import { describe, it, expect } from 'vitest'
import { DEFAULT_WATCHLIST, COUNTRY_TICKER_MAP, COUNTRY_NAME_TO_ISO } from '../../src/data/tickers'

describe('ticker data', () => {
  it('has a non-empty default watchlist', () => {
    expect(DEFAULT_WATCHLIST.length).toBeGreaterThan(0)
  })

  it('every watchlist entry has required fields', () => {
    for (const ticker of DEFAULT_WATCHLIST) {
      expect(ticker.symbol).toBeTruthy()
      expect(ticker.name).toBeTruthy()
      expect(['crypto', 'equity', 'commodity', 'forex']).toContain(ticker.assetClass)
      expect(Array.isArray(ticker.countries)).toBe(true)
    }
  })

  it('crypto tickers have binanceSymbol defined', () => {
    const cryptos = DEFAULT_WATCHLIST.filter((t) => t.assetClass === 'crypto')
    expect(cryptos.length).toBeGreaterThan(0)
    for (const c of cryptos) {
      expect(c.binanceSymbol).toBeTruthy()
    }
  })

  it('equity tickers have at least one country', () => {
    const equities = DEFAULT_WATCHLIST.filter((t) => t.assetClass === 'equity')
    expect(equities.length).toBeGreaterThan(0)
    for (const e of equities) {
      expect(e.countries.length).toBeGreaterThan(0)
    }
  })

  it('has unique symbols in watchlist', () => {
    const symbols = DEFAULT_WATCHLIST.map((t) => t.symbol)
    expect(new Set(symbols).size).toBe(symbols.length)
  })

  it('COUNTRY_TICKER_MAP maps to valid watchlist symbols', () => {
    const validSymbols = new Set(DEFAULT_WATCHLIST.map((t) => t.symbol))
    for (const [, tickers] of Object.entries(COUNTRY_TICKER_MAP)) {
      for (const ticker of tickers) {
        expect(validSymbols.has(ticker)).toBe(true)
      }
    }
  })

  it('COUNTRY_NAME_TO_ISO maps to 2-letter ISO codes', () => {
    for (const [name, iso] of Object.entries(COUNTRY_NAME_TO_ISO)) {
      expect(name).toBeTruthy()
      expect(iso.length).toBe(2)
      expect(iso).toBe(iso.toUpperCase())
    }
  })

  it('US has multiple tickers in geo-linking map', () => {
    expect(COUNTRY_TICKER_MAP['US'].length).toBeGreaterThan(3)
  })
})
