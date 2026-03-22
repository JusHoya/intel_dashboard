import { useEffect } from 'react'
import { useGlobeStore } from '../store/globe'
import { useMarketStore } from '../store/market'
import { useNewsStore } from '../store/news'
import { COUNTRY_TICKER_MAP, COUNTRY_NAME_TO_ISO } from '../data/tickers'

/**
 * Hook that watches globe entity selection and highlights
 * relevant tickers in the financial panel (geo-linking),
 * and filters news headlines to the selected country.
 *
 * When a country is selected on the globe:
 * 1. Finds matching tickers via the country-ticker mapping
 * 2. Sets the news filter to that country (triggers a re-fetch)
 */
export function useGeoLinking() {
  const selectedEntity = useGlobeStore((s) => s.selectedEntity)
  const setGeoLinkedSymbols = useMarketStore((s) => s.setGeoLinkedSymbols)
  const setNewsFilter = useNewsStore((s) => s.setFilter)
  const clearNewsFilter = useNewsStore((s) => s.clearFilter)

  useEffect(() => {
    if (!selectedEntity || selectedEntity.type !== 'country') {
      setGeoLinkedSymbols([])
      clearNewsFilter()
      return
    }

    const countryName = selectedEntity.name

    // Always geo-link news by country name (doesn't need ISO code)
    setNewsFilter({ country: countryName })

    // Try to resolve country to ISO code for ticker linking
    const isoFromMeta = selectedEntity.metadata?.iso_a2 as string | undefined
    const iso = isoFromMeta || COUNTRY_NAME_TO_ISO[countryName]

    if (iso) {
      const linkedTickers = COUNTRY_TICKER_MAP[iso] ?? []
      setGeoLinkedSymbols(linkedTickers)
    } else {
      setGeoLinkedSymbols([])
    }
  }, [selectedEntity, setGeoLinkedSymbols, setNewsFilter, clearNewsFilter])
}
