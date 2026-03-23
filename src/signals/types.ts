export type SignalCategory =
  | 'conflict'
  | 'sanctions'
  | 'energy'
  | 'political'
  | 'disaster'
  | 'cyber'
  | 'monetary'
  | 'supply-chain'

export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type TimeHorizon = 'immediate' | 'short' | 'medium' | 'long'
export type SignalStatus = 'active' | 'developing' | 'resolved'
export type AssetDirection = 'bullish' | 'bearish' | 'volatile'
export type AssetClass = 'equity' | 'crypto' | 'commodity' | 'forex' | 'bond' | 'prediction'

export interface AssetImpact {
  ticker: string
  assetClass: AssetClass
  direction: AssetDirection
  confidence: number // 0-1
  reasoning: string
}

export interface IntelSignal {
  id: string
  timestamp: number // unix ms
  category: SignalCategory
  sources: string[] // source domains/names
  countries: string[] // affected countries
  confidence: number // 0-1
  severity: Severity
  summary: string
  affectedAssets: AssetImpact[]
  timeHorizon: TimeHorizon
  status: SignalStatus
}

/** News item shape consumed by the signal engine (from GDELT or similar feed) */
export interface NewsItem {
  id: string
  title: string
  source: string
  url: string
  tone: number // GDELT avg tone (negative = negative sentiment)
  sourceCountry: string // ISO alpha-2
  publishedAt: number // unix ms
}
