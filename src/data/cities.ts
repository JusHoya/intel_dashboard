/** A major financial center city */
export interface FinancialCenter {
  id: string
  name: string
  country: string
  latitude: number
  longitude: number
}

/** Major global financial center cities */
export const FINANCIAL_CENTERS: readonly FinancialCenter[] = [
  { id: 'nyc', name: 'New York', country: 'US', latitude: 40.7128, longitude: -74.006 },
  { id: 'lon', name: 'London', country: 'GB', latitude: 51.5074, longitude: -0.1278 },
  { id: 'tyo', name: 'Tokyo', country: 'JP', latitude: 35.6762, longitude: 139.6503 },
  { id: 'hkg', name: 'Hong Kong', country: 'HK', latitude: 22.3193, longitude: 114.1694 },
  { id: 'sgp', name: 'Singapore', country: 'SG', latitude: 1.3521, longitude: 103.8198 },
  { id: 'fra', name: 'Frankfurt', country: 'DE', latitude: 50.1109, longitude: 8.6821 },
  { id: 'sha', name: 'Shanghai', country: 'CN', latitude: 31.2304, longitude: 121.4737 },
  { id: 'syd', name: 'Sydney', country: 'AU', latitude: -33.8688, longitude: 151.2093 },
  { id: 'dxb', name: 'Dubai', country: 'AE', latitude: 25.2048, longitude: 55.2708 },
  { id: 'bom', name: 'Mumbai', country: 'IN', latitude: 19.076, longitude: 72.8777 },
  { id: 'gru', name: 'São Paulo', country: 'BR', latitude: -23.5505, longitude: -46.6333 },
  { id: 'yyz', name: 'Toronto', country: 'CA', latitude: 43.6532, longitude: -79.3832 },
  { id: 'zrh', name: 'Zurich', country: 'CH', latitude: 47.3769, longitude: 8.5417 },
  { id: 'icn', name: 'Seoul', country: 'KR', latitude: 37.5665, longitude: 126.978 },
  { id: 'ord', name: 'Chicago', country: 'US', latitude: 41.8781, longitude: -87.6298 },
] as const
