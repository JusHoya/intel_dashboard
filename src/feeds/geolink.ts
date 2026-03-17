import { useEffect } from 'react'
import { useGlobeStore } from '../store/globe'
import { useMarketStore } from '../store/market'
import { COUNTRY_TICKER_MAP, COUNTRY_NAME_TO_ISO } from '../data/tickers'

/**
 * Hook that watches globe entity selection and highlights
 * relevant tickers in the financial panel (geo-linking).
 *
 * When a country is selected on the globe, finds matching tickers
 * via the country-ticker mapping and updates geoLinkedSymbols.
 */
export function useGeoLinking() {
  const selectedEntity = useGlobeStore((s) => s.selectedEntity)
  const setGeoLinkedSymbols = useMarketStore((s) => s.setGeoLinkedSymbols)

  useEffect(() => {
    if (!selectedEntity || selectedEntity.type !== 'country') {
      setGeoLinkedSymbols([])
      return
    }

    // Try to resolve country to ISO code
    const countryName = selectedEntity.name
    const isoFromMeta = selectedEntity.metadata?.iso_a2 as string | undefined
    const iso = isoFromMeta || COUNTRY_NAME_TO_ISO[countryName]

    if (!iso) {
      setGeoLinkedSymbols([])
      return
    }

    const linkedTickers = COUNTRY_TICKER_MAP[iso] ?? []
    setGeoLinkedSymbols(linkedTickers)
  }, [selectedEntity, setGeoLinkedSymbols])
}
