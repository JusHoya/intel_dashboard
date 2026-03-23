/* ── Backtesting Framework ──────────────────────────────────────────────
   Evaluates signal accuracy against historical market data.
   Signal categories map geopolitical event keywords to financial instruments
   and expected directional moves. */

/* ── Types ──────────────────────────────────────────────────────────── */

export type SignalCategory =
  | 'military_conflict'
  | 'sanctions'
  | 'trade_war'
  | 'energy_crisis'
  | 'nuclear_threat'
  | 'economic_crisis'
  | 'diplomatic_breakthrough'
  | 'cyber_attack'

export interface BacktestConfig {
  startDate: string            // YYYY-MM-DD
  endDate: string              // YYYY-MM-DD
  categories: SignalCategory[] // which signal categories to test
  holdPeriodDays: number       // how long to hold after signal (default: 5)
  confidenceThreshold: number  // minimum confidence to act on (default: 0.5)
}

export interface BacktestResult {
  totalSignals: number
  correctDirection: number
  accuracy: number             // correctDirection / totalSignals
  avgReturn: number
  maxDrawdown: number
  sharpeRatio: number
  byCategory: Record<string, {
    signals: number
    accuracy: number
    avgReturn: number
  }>
  trades: BacktestTrade[]
}

export interface BacktestTrade {
  signalId: string
  category: string
  ticker: string
  direction: 'long' | 'short'
  entryDate: string
  entryPrice: number
  exitDate: string
  exitPrice: number
  returnPct: number
  correct: boolean
}

/* ── Signal category definitions ────────────────────────────────────── */

interface CategoryDef {
  keywords: string[]
  tickers: { symbol: string; direction: 'long' | 'short' }[]
}

export const SIGNAL_CATEGORIES: Record<SignalCategory, CategoryDef> = {
  military_conflict: {
    keywords: ['war', 'military', 'airstrike', 'invasion', 'troops', 'combat', 'bombing', 'army', 'missile strike'],
    tickers: [
      { symbol: 'LMT', direction: 'long' },   // Lockheed Martin — defense
      { symbol: 'GLD', direction: 'long' },    // Gold ETF — safe haven
      { symbol: 'SPY', direction: 'short' },   // S&P 500 — risk-off
    ],
  },
  sanctions: {
    keywords: ['sanctions', 'embargo', 'blacklist', 'ban', 'restrict', 'tariff retaliation'],
    tickers: [
      { symbol: 'USO', direction: 'long' },    // Oil — supply disruption
      { symbol: 'EEM', direction: 'short' },   // Emerging markets — risk
      { symbol: 'GLD', direction: 'long' },    // Gold — safe haven
    ],
  },
  trade_war: {
    keywords: ['trade war', 'tariff', 'trade dispute', 'trade deal', 'import duty', 'export ban'],
    tickers: [
      { symbol: 'FXI', direction: 'short' },   // China ETF
      { symbol: 'SPY', direction: 'short' },   // S&P 500 — risk-off
      { symbol: 'GLD', direction: 'long' },    // Gold — safe haven
    ],
  },
  energy_crisis: {
    keywords: ['energy crisis', 'oil shortage', 'gas pipeline', 'OPEC cut', 'refinery', 'oil price surge', 'fuel shortage'],
    tickers: [
      { symbol: 'USO', direction: 'long' },    // Oil
      { symbol: 'XLE', direction: 'long' },    // Energy sector ETF
      { symbol: 'SPY', direction: 'short' },   // Broad market — headwind
    ],
  },
  nuclear_threat: {
    keywords: ['nuclear', 'nuclear test', 'warhead', 'ICBM', 'uranium enrichment', 'nuclear deal'],
    tickers: [
      { symbol: 'GLD', direction: 'long' },    // Gold — panic safe haven
      { symbol: 'TLT', direction: 'long' },    // Treasury bonds — flight to safety
      { symbol: 'SPY', direction: 'short' },   // S&P 500 — risk-off
    ],
  },
  economic_crisis: {
    keywords: ['recession', 'default', 'bailout', 'bank collapse', 'inflation surge', 'debt crisis', 'credit crunch'],
    tickers: [
      { symbol: 'TLT', direction: 'long' },    // Treasuries — flight to safety
      { symbol: 'GLD', direction: 'long' },    // Gold
      { symbol: 'SPY', direction: 'short' },   // Equities — sell-off
    ],
  },
  diplomatic_breakthrough: {
    keywords: ['peace deal', 'ceasefire', 'diplomatic', 'treaty', 'accord', 'agreement signed', 'normalization'],
    tickers: [
      { symbol: 'SPY', direction: 'long' },    // Risk-on rally
      { symbol: 'EEM', direction: 'long' },    // Emerging markets benefit
      { symbol: 'GLD', direction: 'short' },   // Gold drops on stability
    ],
  },
  cyber_attack: {
    keywords: ['cyber attack', 'hack', 'data breach', 'ransomware', 'cyber warfare', 'infrastructure attack'],
    tickers: [
      { symbol: 'HACK', direction: 'long' },   // Cybersecurity ETF
      { symbol: 'SPY', direction: 'short' },   // Broad market risk-off
    ],
  },
}

/* ── GDELT event type ───────────────────────────────────────────────── */

export interface GdeltArticle {
  url: string
  title: string
  seendate: string            // YYYYMMDDTHHMMSS
  domain: string
  language: string
  tone: number
  socialimage?: string
}

/* ── Signal generation from GDELT articles ──────────────────────────── */

interface GeneratedSignal {
  id: string
  category: SignalCategory
  confidence: number
  date: string                // YYYY-MM-DD
  tickers: { symbol: string; direction: 'long' | 'short' }[]
  articleTitle: string
  tone: number
}

/** Score how well an article title matches a signal category */
function matchCategory(title: string, category: SignalCategory): number {
  const lower = title.toLowerCase()
  const def = SIGNAL_CATEGORIES[category]
  let hits = 0
  for (const kw of def.keywords) {
    if (lower.includes(kw.toLowerCase())) {
      hits++
    }
  }
  if (hits === 0) return 0
  // Confidence = fraction of keywords matched, capped at 1.0
  // Boost multi-keyword matches: 1 hit = base, 2+ hits = stronger
  return Math.min(1.0, (hits / def.keywords.length) + (hits > 1 ? 0.2 : 0))
}

export function generateSignals(
  articles: GdeltArticle[],
  categories: SignalCategory[],
): GeneratedSignal[] {
  const signals: GeneratedSignal[] = []

  for (const article of articles) {
    // Parse date from GDELT seendate format (YYYYMMDDTHHMMSS)
    const dateStr = article.seendate
    const year = dateStr.slice(0, 4)
    const month = dateStr.slice(4, 6)
    const day = dateStr.slice(6, 8)
    const date = `${year}-${month}-${day}`

    for (const cat of categories) {
      const confidence = matchCategory(article.title, cat)
      if (confidence > 0) {
        const def = SIGNAL_CATEGORIES[cat]
        // Tone intensity boosts confidence (GDELT tone is -100 to +100)
        const toneBoost = Math.min(0.15, Math.abs(article.tone) / 100 * 0.15)
        const finalConfidence = Math.min(1.0, confidence + toneBoost)

        signals.push({
          id: `sig_${cat}_${date}_${signals.length}`,
          category: cat,
          confidence: parseFloat(finalConfidence.toFixed(3)),
          date,
          tickers: def.tickers,
          articleTitle: article.title,
          tone: article.tone,
        })
      }
    }
  }

  // Deduplicate: keep highest-confidence signal per category per day
  const best = new Map<string, GeneratedSignal>()
  for (const sig of signals) {
    const key = `${sig.category}_${sig.date}`
    const existing = best.get(key)
    if (!existing || sig.confidence > existing.confidence) {
      best.set(key, sig)
    }
  }

  return Array.from(best.values()).sort(
    (a, b) => a.date.localeCompare(b.date) || b.confidence - a.confidence,
  )
}

/* ── Backtest execution ─────────────────────────────────────────────── */

/** Add business days to a date string (YYYY-MM-DD), skipping weekends */
function addBusinessDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  let added = 0
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1)
    const dow = d.getUTCDay()
    if (dow !== 0 && dow !== 6) added++
  }
  return d.toISOString().slice(0, 10)
}

/** Convert YYYY-MM-DD to Unix timestamp (seconds) */
function dateToUnix(dateStr: string): number {
  return Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 1000)
}

interface OhlcvData {
  dates: number[]
  open: number[]
  high: number[]
  low: number[]
  close: number[]
  volume: number[]
}

/** Find the closing price for the nearest available date */
function findPrice(ohlcv: OhlcvData, targetDate: string): { price: number; date: string } | null {
  const targetUnix = dateToUnix(targetDate)
  const DAY_SECS = 86400

  // Look for exact or nearest date within +/- 3 days
  let bestIdx = -1
  let bestDist = Infinity

  for (let i = 0; i < ohlcv.dates.length; i++) {
    const dist = Math.abs(ohlcv.dates[i] - targetUnix)
    if (dist < bestDist && dist <= 3 * DAY_SECS) {
      bestDist = dist
      bestIdx = i
    }
  }

  if (bestIdx === -1) return null

  const d = new Date(ohlcv.dates[bestIdx] * 1000)
  const dateStr = d.toISOString().slice(0, 10)
  return { price: ohlcv.close[bestIdx], date: dateStr }
}

export interface PriceFetcher {
  (symbol: string, startDate: string, endDate: string): Promise<OhlcvData | null>
}

export async function runBacktest(
  config: BacktestConfig,
  signals: GeneratedSignal[],
  fetchPrices: PriceFetcher,
): Promise<BacktestResult> {
  const filteredSignals = signals.filter(
    (s) => s.confidence >= config.confidenceThreshold,
  )

  // Collect all unique tickers we need prices for
  const tickerSet = new Set<string>()
  for (const sig of filteredSignals) {
    for (const t of sig.tickers) {
      tickerSet.add(t.symbol)
    }
  }

  // Extend date range by holdPeriodDays + buffer for weekends/holidays
  const extendedEnd = addBusinessDays(config.endDate, config.holdPeriodDays + 5)

  // Fetch all price data in parallel
  const priceData = new Map<string, OhlcvData>()
  const fetches = Array.from(tickerSet).map(async (symbol) => {
    const data = await fetchPrices(symbol, config.startDate, extendedEnd)
    if (data) priceData.set(symbol, data)
  })
  await Promise.all(fetches)

  // Execute trades
  const trades: BacktestTrade[] = []

  for (const sig of filteredSignals) {
    for (const ticker of sig.tickers) {
      const ohlcv = priceData.get(ticker.symbol)
      if (!ohlcv) continue

      const entry = findPrice(ohlcv, sig.date)
      if (!entry) continue

      const exitDateTarget = addBusinessDays(sig.date, config.holdPeriodDays)
      const exit = findPrice(ohlcv, exitDateTarget)
      if (!exit) continue

      const rawReturn = (exit.price - entry.price) / entry.price
      const returnPct = ticker.direction === 'short' ? -rawReturn : rawReturn
      const correct =
        (ticker.direction === 'long' && exit.price > entry.price) ||
        (ticker.direction === 'short' && exit.price < entry.price)

      trades.push({
        signalId: sig.id,
        category: sig.category,
        ticker: ticker.symbol,
        direction: ticker.direction,
        entryDate: entry.date,
        entryPrice: parseFloat(entry.price.toFixed(2)),
        exitDate: exit.date,
        exitPrice: parseFloat(exit.price.toFixed(2)),
        returnPct: parseFloat((returnPct * 100).toFixed(4)),
        correct,
      })
    }
  }

  // Aggregate metrics
  const totalSignals = trades.length
  const correctDirection = trades.filter((t) => t.correct).length
  const accuracy = totalSignals > 0 ? correctDirection / totalSignals : 0
  const avgReturn = totalSignals > 0
    ? trades.reduce((sum, t) => sum + t.returnPct, 0) / totalSignals
    : 0

  // Max drawdown: running peak-to-trough on cumulative returns
  let cumReturn = 0
  let peak = 0
  let maxDrawdown = 0
  const sortedTrades = [...trades].sort((a, b) => a.entryDate.localeCompare(b.entryDate))
  for (const trade of sortedTrades) {
    cumReturn += trade.returnPct
    if (cumReturn > peak) peak = cumReturn
    const drawdown = peak - cumReturn
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  // Sharpe ratio (annualized, assuming ~252 trading days)
  const returns = trades.map((t) => t.returnPct / 100)
  const meanReturn = returns.length > 0
    ? returns.reduce((s, r) => s + r, 0) / returns.length
    : 0
  const variance = returns.length > 1
    ? returns.reduce((s, r) => s + (r - meanReturn) ** 2, 0) / (returns.length - 1)
    : 0
  const stdDev = Math.sqrt(variance)
  const tradesPerYear = 252 / (config.holdPeriodDays || 5)
  const annualizedReturn = meanReturn * tradesPerYear
  const annualizedStdDev = stdDev * Math.sqrt(tradesPerYear)
  const sharpeRatio = annualizedStdDev > 0
    ? parseFloat((annualizedReturn / annualizedStdDev).toFixed(3))
    : 0

  // By-category breakdown
  const byCategory: Record<string, { signals: number; accuracy: number; avgReturn: number }> = {}
  const catGroups = new Map<string, BacktestTrade[]>()
  for (const trade of trades) {
    const arr = catGroups.get(trade.category) ?? []
    arr.push(trade)
    catGroups.set(trade.category, arr)
  }
  for (const [cat, catTrades] of catGroups) {
    const catCorrect = catTrades.filter((t) => t.correct).length
    byCategory[cat] = {
      signals: catTrades.length,
      accuracy: parseFloat((catCorrect / catTrades.length).toFixed(4)),
      avgReturn: parseFloat(
        (catTrades.reduce((s, t) => s + t.returnPct, 0) / catTrades.length).toFixed(4),
      ),
    }
  }

  return {
    totalSignals,
    correctDirection,
    accuracy: parseFloat(accuracy.toFixed(4)),
    avgReturn: parseFloat(avgReturn.toFixed(4)),
    maxDrawdown: parseFloat(maxDrawdown.toFixed(4)),
    sharpeRatio,
    byCategory,
    trades,
  }
}
