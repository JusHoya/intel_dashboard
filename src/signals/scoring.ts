import type { CategoryDef } from './categories.ts'
import type { Severity } from './types.ts'

/** High-credibility news sources that receive a confidence boost */
const TIER_1_SOURCES: readonly string[] = [
  'reuters', 'ap', 'bbc', 'bloomberg', 'associated press', 'afp',
  'financial times', 'wall street journal', 'wsj', 'nytimes', 'new york times',
  'the economist', 'guardian', 'washington post', 'al jazeera',
]

/** Mid-tier sources with moderate credibility */
const TIER_2_SOURCES: readonly string[] = [
  'cnn', 'cnbc', 'fox', 'sky news', 'dw', 'france24', 'nhk',
  'abc news', 'cbs news', 'nbc news', 'politico', 'axios',
  'the hill', 'foreign policy', 'defense one',
]

/**
 * Determine source quality score based on the source domain/name.
 * Returns a value between 0 and 1.
 */
function scoreSourceQuality(source: string): number {
  const normalized = source.toLowerCase()
  if (TIER_1_SOURCES.some((s) => normalized.includes(s))) return 1.0
  if (TIER_2_SOURCES.some((s) => normalized.includes(s))) return 0.7
  return 0.4 // unknown source
}

/**
 * Compute keyword density: fraction of category keywords found in the headline.
 * Returns a value between 0 and 1.
 */
function scoreKeywordDensity(headline: string, keywords: readonly string[]): number {
  const lower = headline.toLowerCase()
  let matchCount = 0
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      matchCount++
    }
  }
  // Normalize: 1 match = baseline, diminishing returns after 3
  if (matchCount === 0) return 0
  return Math.min(1, matchCount / 3)
}

/**
 * Score tone intensity. GDELT tone ranges roughly from -10 to +10.
 * More negative tone = more significant for conflict/disaster categories.
 * Returns a value between 0 and 1.
 */
function scoreToneIntensity(tone: number): number {
  const magnitude = Math.abs(tone)
  // Tone magnitude of 5+ is strongly polarized
  return Math.min(1, magnitude / 5)
}

/**
 * Determine severity level based on which severity keywords appear in the headline.
 * Checks from critical down to low, returning the highest matching severity.
 */
export function determineSeverity(
  headline: string,
  severityKeywords: Record<Severity, string[]>,
): Severity {
  const lower = headline.toLowerCase()
  const levels: Severity[] = ['critical', 'high', 'medium', 'low']

  for (const level of levels) {
    for (const kw of severityKeywords[level]) {
      if (lower.includes(kw.toLowerCase())) {
        return level
      }
    }
  }
  return 'low' // default if no severity keywords matched
}

/**
 * Compute overall signal confidence score from a news headline.
 *
 * Combines four factors:
 *   - Keyword density (40% weight): how many category keywords appear
 *   - Source quality (25% weight): credibility of the news source
 *   - Tone intensity (20% weight): strength of sentiment in GDELT tone
 *   - Severity bonus (15% weight): higher severity = higher confidence
 *
 * @returns confidence score between 0 and 1
 */
export function scoreSignal(
  headline: string,
  source: string,
  tone: number,
  category: CategoryDef,
): number {
  const keywordScore = scoreKeywordDensity(headline, category.keywords)
  const sourceScore = scoreSourceQuality(source)
  const toneScore = scoreToneIntensity(tone)

  const severity = determineSeverity(headline, category.severityKeywords)
  const severityScore: Record<Severity, number> = {
    low: 0.2,
    medium: 0.5,
    high: 0.8,
    critical: 1.0,
  }

  const weighted =
    keywordScore * 0.4 +
    sourceScore * 0.25 +
    toneScore * 0.2 +
    severityScore[severity] * 0.15

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, weighted))
}
