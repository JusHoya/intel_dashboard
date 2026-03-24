/**
 * Media Bias Database
 *
 * Ratings based on widely-recognized media bias assessment methodologies.
 * Bias spectrum: far-left → left → center-left → center → center-right → right → far-right
 * Factual reporting: 0-1 scale (1 = highest factual accuracy)
 *
 * Sources: Ad Fontes Media, AllSides, Media Bias/Fact Check (MBFC)
 */

export type BiasRating =
  | 'far-left'
  | 'left'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'right'
  | 'far-right'

export interface MediaBiasEntry {
  /** Display name */
  name: string
  /** Domain fragments to match against GDELT source domains */
  domains: string[]
  /** Political lean on the spectrum */
  bias: BiasRating
  /** Factual reporting reliability (0-1, 1 = most reliable) */
  factual: number
  /** Country of origin */
  country: string
  /** Brief description of editorial stance */
  description: string
}

/**
 * Comprehensive media bias database covering major global sources
 * encountered in GDELT feeds and YouTube channels.
 */
export const MEDIA_BIAS_DB: readonly MediaBiasEntry[] = [
  // === WIRE SERVICES (Generally center, highest factual) ===
  {
    name: 'Reuters',
    domains: ['reuters.com'],
    bias: 'center',
    factual: 0.95,
    country: 'UK',
    description: 'Global wire service with minimal editorial slant',
  },
  {
    name: 'Associated Press',
    domains: ['apnews.com', 'ap.org'],
    bias: 'center',
    factual: 0.95,
    country: 'US',
    description: 'Non-profit wire service, fact-based reporting',
  },
  {
    name: 'AFP',
    domains: ['afp.com', 'france24.com/afp'],
    bias: 'center',
    factual: 0.92,
    country: 'FR',
    description: 'French wire service, global coverage',
  },

  // === US MAINSTREAM — LEFT-LEANING ===
  {
    name: 'CNN',
    domains: ['cnn.com'],
    bias: 'left',
    factual: 0.72,
    country: 'US',
    description: 'US cable news, leans liberal on editorial/opinion',
  },
  {
    name: 'MSNBC',
    domains: ['msnbc.com'],
    bias: 'left',
    factual: 0.65,
    country: 'US',
    description: 'US cable news, progressive editorial lean',
  },
  {
    name: 'New York Times',
    domains: ['nytimes.com'],
    bias: 'center-left',
    factual: 0.88,
    country: 'US',
    description: 'Paper of record, center-left editorial board',
  },
  {
    name: 'Washington Post',
    domains: ['washingtonpost.com'],
    bias: 'center-left',
    factual: 0.86,
    country: 'US',
    description: 'Major US broadsheet, center-left editorial lean',
  },
  {
    name: 'NPR',
    domains: ['npr.org'],
    bias: 'center-left',
    factual: 0.90,
    country: 'US',
    description: 'Public radio, high factual reporting with slight left lean',
  },
  {
    name: 'PBS',
    domains: ['pbs.org'],
    bias: 'center-left',
    factual: 0.90,
    country: 'US',
    description: 'Public broadcasting, high factual with slight left lean',
  },
  {
    name: 'ABC News',
    domains: ['abcnews.go.com'],
    bias: 'center-left',
    factual: 0.80,
    country: 'US',
    description: 'US broadcast network news',
  },
  {
    name: 'CBS News',
    domains: ['cbsnews.com'],
    bias: 'center-left',
    factual: 0.80,
    country: 'US',
    description: 'US broadcast network news',
  },
  {
    name: 'NBC News',
    domains: ['nbcnews.com'],
    bias: 'center-left',
    factual: 0.80,
    country: 'US',
    description: 'US broadcast network news',
  },
  {
    name: 'Politico',
    domains: ['politico.com'],
    bias: 'center-left',
    factual: 0.82,
    country: 'US',
    description: 'Political journalism, slight left lean',
  },
  {
    name: 'The Atlantic',
    domains: ['theatlantic.com'],
    bias: 'center-left',
    factual: 0.85,
    country: 'US',
    description: 'Long-form journalism, center-left editorial',
  },
  {
    name: 'Vox',
    domains: ['vox.com'],
    bias: 'left',
    factual: 0.75,
    country: 'US',
    description: 'Explanatory journalism with progressive lean',
  },
  {
    name: 'HuffPost',
    domains: ['huffpost.com', 'huffingtonpost.com'],
    bias: 'left',
    factual: 0.65,
    country: 'US',
    description: 'Progressive digital news and opinion',
  },
  {
    name: 'Axios',
    domains: ['axios.com'],
    bias: 'center-left',
    factual: 0.82,
    country: 'US',
    description: 'Concise political coverage, slight left lean',
  },

  // === US MAINSTREAM — RIGHT-LEANING ===
  {
    name: 'Fox News',
    domains: ['foxnews.com'],
    bias: 'right',
    factual: 0.58,
    country: 'US',
    description: 'US cable news, conservative editorial lean',
  },
  {
    name: 'Wall Street Journal',
    domains: ['wsj.com'],
    bias: 'center-right',
    factual: 0.88,
    country: 'US',
    description: 'Financial broadsheet, center-right editorial board',
  },
  {
    name: 'New York Post',
    domains: ['nypost.com'],
    bias: 'right',
    factual: 0.55,
    country: 'US',
    description: 'US tabloid with conservative lean',
  },
  {
    name: 'The Hill',
    domains: ['thehill.com'],
    bias: 'center',
    factual: 0.80,
    country: 'US',
    description: 'Congressional/political coverage, mostly centrist',
  },
  {
    name: 'Washington Times',
    domains: ['washingtontimes.com'],
    bias: 'right',
    factual: 0.60,
    country: 'US',
    description: 'Conservative DC newspaper',
  },
  {
    name: 'Washington Examiner',
    domains: ['washingtonexaminer.com'],
    bias: 'right',
    factual: 0.62,
    country: 'US',
    description: 'Conservative political magazine',
  },
  {
    name: 'National Review',
    domains: ['nationalreview.com'],
    bias: 'right',
    factual: 0.72,
    country: 'US',
    description: 'Conservative political magazine, higher factual rigor',
  },
  {
    name: 'Daily Wire',
    domains: ['dailywire.com'],
    bias: 'right',
    factual: 0.55,
    country: 'US',
    description: 'Conservative media outlet',
  },
  {
    name: 'Breitbart',
    domains: ['breitbart.com'],
    bias: 'far-right',
    factual: 0.40,
    country: 'US',
    description: 'Far-right news and opinion',
  },
  {
    name: 'NewsNation',
    domains: ['newsnationnow.com', 'newsnation.com'],
    bias: 'center',
    factual: 0.75,
    country: 'US',
    description: 'US cable news positioning as centrist',
  },

  // === US FINANCIAL ===
  {
    name: 'Bloomberg',
    domains: ['bloomberg.com'],
    bias: 'center-left',
    factual: 0.90,
    country: 'US',
    description: 'Financial news, high factual, slight left lean on editorial',
  },
  {
    name: 'CNBC',
    domains: ['cnbc.com'],
    bias: 'center',
    factual: 0.82,
    country: 'US',
    description: 'Business/financial news, generally centrist',
  },
  {
    name: 'Financial Times',
    domains: ['ft.com'],
    bias: 'center',
    factual: 0.92,
    country: 'UK',
    description: 'Global financial broadsheet, high factual accuracy',
  },
  {
    name: 'Forbes',
    domains: ['forbes.com'],
    bias: 'center-right',
    factual: 0.75,
    country: 'US',
    description: 'Business magazine, free-market editorial lean',
  },
  {
    name: 'Business Insider',
    domains: ['businessinsider.com'],
    bias: 'center-left',
    factual: 0.72,
    country: 'US',
    description: 'Business/tech news with slight left lean',
  },
  {
    name: 'MarketWatch',
    domains: ['marketwatch.com'],
    bias: 'center',
    factual: 0.78,
    country: 'US',
    description: 'Financial news and data',
  },

  // === UK ===
  {
    name: 'BBC',
    domains: ['bbc.com', 'bbc.co.uk'],
    bias: 'center',
    factual: 0.90,
    country: 'UK',
    description: 'British public broadcaster, high factual accuracy',
  },
  {
    name: 'The Guardian',
    domains: ['theguardian.com'],
    bias: 'center-left',
    factual: 0.82,
    country: 'UK',
    description: 'British broadsheet, progressive editorial lean',
  },
  {
    name: 'The Telegraph',
    domains: ['telegraph.co.uk'],
    bias: 'center-right',
    factual: 0.75,
    country: 'UK',
    description: 'British broadsheet, conservative lean',
  },
  {
    name: 'Sky News',
    domains: ['skynews.com', 'news.sky.com'],
    bias: 'center',
    factual: 0.80,
    country: 'UK',
    description: 'UK 24/7 news channel',
  },
  {
    name: 'The Independent',
    domains: ['independent.co.uk'],
    bias: 'center-left',
    factual: 0.78,
    country: 'UK',
    description: 'British digital broadsheet, liberal lean',
  },
  {
    name: 'Daily Mail',
    domains: ['dailymail.co.uk'],
    bias: 'right',
    factual: 0.45,
    country: 'UK',
    description: 'British tabloid, right-leaning editorial',
  },
  {
    name: 'The Economist',
    domains: ['economist.com'],
    bias: 'center',
    factual: 0.92,
    country: 'UK',
    description: 'Global affairs magazine, classical liberal perspective',
  },

  // === INTERNATIONAL ===
  {
    name: 'Al Jazeera',
    domains: ['aljazeera.com'],
    bias: 'center-left',
    factual: 0.75,
    country: 'QA',
    description: 'Qatari state-funded, strong Middle East coverage',
  },
  {
    name: 'DW News',
    domains: ['dw.com'],
    bias: 'center-left',
    factual: 0.85,
    country: 'DE',
    description: 'German public international broadcaster',
  },
  {
    name: 'France 24',
    domains: ['france24.com'],
    bias: 'center',
    factual: 0.82,
    country: 'FR',
    description: 'French public international news',
  },
  {
    name: 'NHK World',
    domains: ['nhk.or.jp', 'www3.nhk.or.jp'],
    bias: 'center',
    factual: 0.88,
    country: 'JP',
    description: 'Japanese public broadcaster, factual and measured',
  },
  {
    name: 'ABC Australia',
    domains: ['abc.net.au'],
    bias: 'center-left',
    factual: 0.85,
    country: 'AU',
    description: 'Australian Broadcasting Corporation',
  },
  {
    name: 'NDTV',
    domains: ['ndtv.com'],
    bias: 'center-left',
    factual: 0.72,
    country: 'IN',
    description: 'Indian news network, liberal lean',
  },
  {
    name: 'Times of India',
    domains: ['timesofindia.indiatimes.com', 'indiatimes.com'],
    bias: 'center',
    factual: 0.68,
    country: 'IN',
    description: 'India largest English-language newspaper',
  },
  {
    name: 'South China Morning Post',
    domains: ['scmp.com'],
    bias: 'center',
    factual: 0.72,
    country: 'HK',
    description: 'Hong Kong broadsheet, moderate editorial',
  },
  {
    name: 'Arirang',
    domains: ['arirang.com', 'arirang.co.kr'],
    bias: 'center',
    factual: 0.78,
    country: 'KR',
    description: 'South Korean international broadcaster',
  },
  {
    name: 'Yonhap',
    domains: ['en.yna.co.kr', 'yonhapnews.co.kr'],
    bias: 'center',
    factual: 0.85,
    country: 'KR',
    description: 'South Korean wire service',
  },
  {
    name: 'Haaretz',
    domains: ['haaretz.com'],
    bias: 'center-left',
    factual: 0.82,
    country: 'IL',
    description: 'Israeli broadsheet, liberal lean',
  },
  {
    name: 'Jerusalem Post',
    domains: ['jpost.com'],
    bias: 'center-right',
    factual: 0.72,
    country: 'IL',
    description: 'Israeli newspaper, center-right lean',
  },
  {
    name: 'Foreign Policy',
    domains: ['foreignpolicy.com'],
    bias: 'center',
    factual: 0.88,
    country: 'US',
    description: 'International affairs magazine, analytical',
  },
  {
    name: 'Defense One',
    domains: ['defenseone.com'],
    bias: 'center',
    factual: 0.85,
    country: 'US',
    description: 'Defense and national security coverage',
  },

  // === STATE-AFFILIATED (important context for bias assessment) ===
  {
    name: 'RT',
    domains: ['rt.com'],
    bias: 'far-right',
    factual: 0.25,
    country: 'RU',
    description: 'Russian state media, propaganda outlet',
  },
  {
    name: 'TASS',
    domains: ['tass.com'],
    bias: 'right',
    factual: 0.30,
    country: 'RU',
    description: 'Russian state news agency',
  },
  {
    name: 'Xinhua',
    domains: ['xinhuanet.com', 'xinhua.net'],
    bias: 'center',
    factual: 0.35,
    country: 'CN',
    description: 'Chinese state news agency, CCP-aligned',
  },
  {
    name: 'CGTN',
    domains: ['cgtn.com'],
    bias: 'center',
    factual: 0.35,
    country: 'CN',
    description: 'Chinese state international broadcaster',
  },
  {
    name: 'TRT World',
    domains: ['trtworld.com'],
    bias: 'center-right',
    factual: 0.55,
    country: 'TR',
    description: 'Turkish state broadcaster, government-aligned',
  },
  {
    name: 'Press TV',
    domains: ['presstv.ir', 'presstv.com'],
    bias: 'far-left',
    factual: 0.25,
    country: 'IR',
    description: 'Iranian state media, propaganda outlet',
  },
] as const

/**
 * Color scheme for bias ratings — designed for the terminal CRT aesthetic.
 */
export const BIAS_COLORS: Record<BiasRating, string> = {
  'far-left': '#ff00ff',   // magenta
  'left': '#6688ff',       // blue
  'center-left': '#44aaff', // light blue
  'center': '#888888',     // neutral gray
  'center-right': '#ffaa44', // orange
  'right': '#ff6644',      // red-orange
  'far-right': '#ff0044',  // red
}

/** Short labels for compact display */
export const BIAS_LABELS: Record<BiasRating, string> = {
  'far-left': 'FL',
  'left': 'L',
  'center-left': 'CL',
  'center': 'C',
  'center-right': 'CR',
  'right': 'R',
  'far-right': 'FR',
}

/** Human-readable labels */
export const BIAS_NAMES: Record<BiasRating, string> = {
  'far-left': 'Far Left',
  'left': 'Left',
  'center-left': 'Center-Left',
  'center': 'Center',
  'center-right': 'Center-Right',
  'right': 'Right',
  'far-right': 'Far Right',
}

/**
 * Look up bias info for a given news source domain.
 * Returns the first match, or null if the source is unknown.
 */
export function getMediaBias(sourceDomain: string): MediaBiasEntry | null {
  const normalized = sourceDomain.toLowerCase().replace(/^www\./, '')
  for (const entry of MEDIA_BIAS_DB) {
    for (const domain of entry.domains) {
      if (normalized.includes(domain) || domain.includes(normalized)) {
        return entry
      }
    }
  }
  return null
}

/**
 * Numeric representation of bias for aggregation/charting.
 * Range: -3 (far-left) to +3 (far-right), 0 = center
 */
export const BIAS_NUMERIC: Record<BiasRating, number> = {
  'far-left': -3,
  'left': -2,
  'center-left': -1,
  'center': 0,
  'center-right': 1,
  'right': 2,
  'far-right': 3,
}

/**
 * Compute the aggregate bias balance for a set of articles.
 * Returns { score, label, distribution } where score is the average
 * numeric bias (-3 to +3) across all articles with known sources.
 */
export function computeBiasBalance(
  sources: string[],
): {
  score: number
  label: string
  distribution: Record<BiasRating, number>
  knownCount: number
  totalCount: number
} {
  const distribution: Record<BiasRating, number> = {
    'far-left': 0,
    'left': 0,
    'center-left': 0,
    'center': 0,
    'center-right': 0,
    'right': 0,
    'far-right': 0,
  }

  let sum = 0
  let known = 0

  for (const source of sources) {
    const entry = getMediaBias(source)
    if (entry) {
      distribution[entry.bias]++
      sum += BIAS_NUMERIC[entry.bias]
      known++
    }
  }

  const score = known > 0 ? sum / known : 0
  let label: string
  if (score <= -2) label = 'STRONG LEFT'
  else if (score <= -1) label = 'LEFT LEAN'
  else if (score <= -0.3) label = 'SLIGHT LEFT'
  else if (score < 0.3) label = 'BALANCED'
  else if (score < 1) label = 'SLIGHT RIGHT'
  else if (score < 2) label = 'RIGHT LEAN'
  else label = 'STRONG RIGHT'

  return { score, label, distribution, knownCount: known, totalCount: sources.length }
}
