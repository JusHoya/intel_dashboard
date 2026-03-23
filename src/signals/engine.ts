import type { IntelSignal, NewsItem, SignalCategory, TimeHorizon, AssetImpact, Severity } from './types.ts'
import { SIGNAL_CATEGORIES, type CategoryDef } from './categories.ts'
import { scoreSignal, determineSeverity } from './scoring.ts'

/** Minimum confidence threshold to emit a signal */
const MIN_CONFIDENCE = 0.3

/** Time window (ms) for grouping similar signals: 1 hour */
const GROUPING_WINDOW_MS = 60 * 60 * 1000

/** Counter for generating unique signal IDs */
let signalCounter = 0

function generateId(): string {
  signalCounter++
  return `sig-${Date.now()}-${signalCounter}`
}

/**
 * Check if a news headline matches a category's keyword patterns.
 * Returns the number of keyword matches (0 = no match).
 */
function matchCategory(headline: string, category: CategoryDef): number {
  const lower = headline.toLowerCase()
  let hits = 0
  for (const kw of category.keywords) {
    if (lower.includes(kw.toLowerCase())) {
      hits++
    }
  }
  return hits
}

/**
 * Map severity to a default time horizon.
 * Higher severity events tend to have more immediate market impact.
 */
function inferTimeHorizon(severity: Severity): TimeHorizon {
  switch (severity) {
    case 'critical': return 'immediate'
    case 'high': return 'short'
    case 'medium': return 'medium'
    case 'low': return 'long'
  }
}

/**
 * Scale asset impact confidence based on the overall signal confidence.
 * Default asset confidences are adjusted proportionally.
 */
function scaleAssetImpacts(defaultAssets: readonly AssetImpact[], signalConfidence: number): AssetImpact[] {
  return defaultAssets.map((asset) => ({
    ...asset,
    confidence: Math.round(asset.confidence * signalConfidence * 100) / 100,
  }))
}

/**
 * Extract country references from headline text.
 * Matches known country names and returns ISO codes.
 */
const HEADLINE_COUNTRY_MAP: Record<string, string> = {
  'united states': 'US', 'u.s.': 'US', 'us ': 'US', 'america': 'US',
  'china': 'CN', 'chinese': 'CN', 'beijing': 'CN',
  'russia': 'RU', 'russian': 'RU', 'moscow': 'RU', 'kremlin': 'RU',
  'ukraine': 'UA', 'ukrainian': 'UA', 'kyiv': 'UA',
  'iran': 'IR', 'iranian': 'IR', 'tehran': 'IR',
  'israel': 'IL', 'israeli': 'IL', 'tel aviv': 'IL',
  'saudi': 'SA', 'riyadh': 'SA',
  'north korea': 'KP', 'pyongyang': 'KP',
  'south korea': 'KR', 'seoul': 'KR',
  'japan': 'JP', 'japanese': 'JP', 'tokyo': 'JP',
  'germany': 'DE', 'german': 'DE', 'berlin': 'DE',
  'france': 'FR', 'french': 'FR', 'paris': 'FR',
  'united kingdom': 'GB', 'britain': 'GB', 'british': 'GB', 'london': 'GB',
  'india': 'IN', 'indian': 'IN', 'delhi': 'IN',
  'brazil': 'BR', 'brazilian': 'BR',
  'turkey': 'TR', 'turkish': 'TR', 'ankara': 'TR',
  'taiwan': 'TW', 'taiwanese': 'TW', 'taipei': 'TW',
  'mexico': 'MX', 'mexican': 'MX',
  'australia': 'AU', 'australian': 'AU',
  'canada': 'CA', 'canadian': 'CA',
  'europe': 'EU', 'european': 'EU',
  'nato': 'NATO',
}

function extractCountries(headline: string, sourceCountry: string): string[] {
  const lower = headline.toLowerCase()
  const countries = new Set<string>()

  // Always include source country if available
  if (sourceCountry) {
    countries.add(sourceCountry.toUpperCase())
  }

  for (const [term, iso] of Object.entries(HEADLINE_COUNTRY_MAP)) {
    if (lower.includes(term)) {
      countries.add(iso)
    }
  }

  return Array.from(countries)
}

/**
 * Build a grouping key for deduplication.
 * Signals with the same category and overlapping countries within the time window are merged.
 */
function groupingKey(category: SignalCategory, countries: string[]): string {
  const sorted = [...countries].sort()
  return `${category}:${sorted.join(',')}`
}

/**
 * Generate intelligence signals from an array of news items.
 *
 * For each article:
 * 1. Check against all category keyword patterns
 * 2. If matched, score confidence and determine severity
 * 3. Group similar signals (same category + geography within time window)
 * 4. Merge duplicates to increase confidence
 *
 * This is a pure function with no side effects.
 */
export function generateSignals(newsItems: readonly NewsItem[]): IntelSignal[] {
  // Intermediate signals before grouping
  interface RawSignal {
    category: SignalCategory
    categoryDef: CategoryDef
    confidence: number
    severity: Severity
    countries: string[]
    summary: string
    sources: string[]
    timestamp: number
    assets: AssetImpact[]
    timeHorizon: TimeHorizon
  }

  const rawSignals: RawSignal[] = []

  for (const item of newsItems) {
    for (const catDef of SIGNAL_CATEGORIES) {
      const hits = matchCategory(item.title, catDef)
      if (hits === 0) continue

      const confidence = scoreSignal(item.title, item.source, item.tone, catDef)
      if (confidence < MIN_CONFIDENCE) continue

      const severity = determineSeverity(item.title, catDef.severityKeywords)
      const countries = extractCountries(item.title, item.sourceCountry)
      const timeHorizon = inferTimeHorizon(severity)
      const assets = scaleAssetImpacts(catDef.defaultAssets, confidence)

      rawSignals.push({
        category: catDef.id,
        categoryDef: catDef,
        confidence,
        severity,
        countries,
        summary: item.title,
        sources: [item.source],
        timestamp: item.publishedAt,
        assets,
        timeHorizon,
      })
    }
  }

  // Group and deduplicate
  const groups = new Map<string, RawSignal[]>()

  for (const raw of rawSignals) {
    const key = groupingKey(raw.category, raw.countries)

    const existing = groups.get(key)
    if (existing) {
      // Check if within time window of the group's latest entry
      const latest = existing[existing.length - 1]
      if (Math.abs(raw.timestamp - latest.timestamp) <= GROUPING_WINDOW_MS) {
        existing.push(raw)
        continue
      }
    }

    groups.set(key, [raw])
  }

  // Merge groups into final signals
  const signals: IntelSignal[] = []

  for (const group of groups.values()) {
    // Use the highest-confidence signal as the base
    const sorted = [...group].sort((a, b) => b.confidence - a.confidence)
    const primary = sorted[0]

    // Merge sources (deduplicated)
    const allSources = new Set<string>()
    for (const s of group) {
      for (const src of s.sources) {
        allSources.add(src)
      }
    }

    // Merge countries (deduplicated)
    const allCountries = new Set<string>()
    for (const s of group) {
      for (const c of s.countries) {
        allCountries.add(c)
      }
    }

    // Confidence boost from corroboration: each additional source adds up to 0.05
    const corroborationBoost = Math.min(0.15, (allSources.size - 1) * 0.05)
    const mergedConfidence = Math.min(1, primary.confidence + corroborationBoost)

    // Use highest severity from group
    const severityRank: Record<Severity, number> = { low: 0, medium: 1, high: 2, critical: 3 }
    let highestSeverity = primary.severity
    for (const s of group) {
      if (severityRank[s.severity] > severityRank[highestSeverity]) {
        highestSeverity = s.severity
      }
    }

    // Build summary: use primary summary, note additional sources
    let summary = primary.summary
    if (group.length > 1) {
      summary += ` [+${group.length - 1} corroborating report${group.length > 2 ? 's' : ''}]`
    }

    const signal: IntelSignal = {
      id: generateId(),
      timestamp: primary.timestamp,
      category: primary.category,
      sources: Array.from(allSources),
      countries: Array.from(allCountries),
      confidence: Math.round(mergedConfidence * 100) / 100,
      severity: highestSeverity,
      summary,
      affectedAssets: scaleAssetImpacts(primary.categoryDef.defaultAssets, mergedConfidence),
      timeHorizon: inferTimeHorizon(highestSeverity),
      status: 'active',
    }

    signals.push(signal)
  }

  // Sort by confidence descending, then by timestamp descending
  signals.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence
    return b.timestamp - a.timestamp
  })

  return signals
}
