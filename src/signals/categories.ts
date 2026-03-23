import type { SignalCategory, Severity, AssetImpact } from './types.ts'

export interface CategoryDef {
  id: SignalCategory
  name: string
  description: string
  keywords: string[]
  defaultAssets: AssetImpact[]
  severityKeywords: Record<Severity, string[]>
  color: string
}

export const SIGNAL_CATEGORIES: readonly CategoryDef[] = [
  {
    id: 'conflict',
    name: 'Conflict Escalation',
    description: 'Military operations, armed conflict, territorial disputes, and defense mobilizations',
    keywords: [
      'war', 'military', 'troops', 'missile', 'strike', 'bombing', 'invasion',
      'airspace', 'airstrike', 'artillery', 'ceasefire', 'combat', 'deploy',
      'drone strike', 'escalation', 'frontline', 'ground forces', 'hostilities',
      'incursion', 'nato', 'nuclear', 'occupation', 'offensive', 'shelling',
      'warship', 'weapon',
    ],
    defaultAssets: [
      { ticker: 'LMT', assetClass: 'equity', direction: 'bullish', confidence: 0.8, reasoning: 'Defense contractor benefits from conflict escalation' },
      { ticker: 'RTX', assetClass: 'equity', direction: 'bullish', confidence: 0.8, reasoning: 'Raytheon weapons demand rises with military conflict' },
      { ticker: 'NOC', assetClass: 'equity', direction: 'bullish', confidence: 0.75, reasoning: 'Northrop Grumman defense spending increase' },
      { ticker: 'XOM', assetClass: 'equity', direction: 'bullish', confidence: 0.7, reasoning: 'Oil prices spike on conflict-driven supply fears' },
      { ticker: 'GLD', assetClass: 'commodity', direction: 'bullish', confidence: 0.85, reasoning: 'Gold safe haven demand surges during conflict' },
      { ticker: 'BTC/USD', assetClass: 'crypto', direction: 'volatile', confidence: 0.6, reasoning: 'Crypto volatility increases on geopolitical uncertainty' },
    ],
    severityKeywords: {
      low: ['military exercise', 'defense review', 'border patrol', 'troop rotation'],
      medium: ['troop deployment', 'airspace violation', 'military buildup', 'arms shipment'],
      high: ['missile launch', 'airstrike', 'bombing', 'ground offensive', 'shelling'],
      critical: ['nuclear', 'invasion', 'war declared', 'full-scale war', 'occupation'],
    },
    color: '#ef4444', // red
  },
  {
    id: 'sanctions',
    name: 'Sanctions & Trade',
    description: 'Trade restrictions, sanctions packages, tariff changes, and embargo enforcement',
    keywords: [
      'sanctions', 'tariff', 'trade deal', 'embargo', 'trade war', 'export ban',
      'asset freeze', 'blacklist', 'countervailing duty', 'customs', 'decouple',
      'export control', 'free trade', 'import ban', 'quota', 'reciprocal tariff',
      'retaliatory', 'supply restriction', 'trade agreement', 'trade barrier',
      'trade deficit', 'trade surplus', 'wto',
    ],
    defaultAssets: [
      { ticker: 'EEM', assetClass: 'equity', direction: 'bearish', confidence: 0.7, reasoning: 'Emerging market ETF declines on trade restrictions' },
      { ticker: 'FXI', assetClass: 'equity', direction: 'bearish', confidence: 0.7, reasoning: 'China large-cap ETF drops on sanctions/tariff news' },
      { ticker: 'BABA', assetClass: 'equity', direction: 'bearish', confidence: 0.65, reasoning: 'Alibaba affected by US-China trade tensions' },
      { ticker: 'ZIM', assetClass: 'equity', direction: 'volatile', confidence: 0.6, reasoning: 'Shipping company impacted by trade flow changes' },
      { ticker: 'DXY', assetClass: 'forex', direction: 'volatile', confidence: 0.55, reasoning: 'Dollar index reacts to trade policy shifts' },
    ],
    severityKeywords: {
      low: ['trade talks', 'trade review', 'preliminary tariff', 'trade inquiry'],
      medium: ['tariff increase', 'new sanctions', 'export control', 'trade restriction'],
      high: ['trade war', 'embargo', 'full sanctions package', 'retaliatory tariff'],
      critical: ['total embargo', 'financial system exclusion', 'swift ban', 'complete trade halt'],
    },
    color: '#f97316', // orange
  },
  {
    id: 'energy',
    name: 'Energy & Commodities',
    description: 'Oil/gas markets, OPEC decisions, pipeline disruptions, energy infrastructure',
    keywords: [
      'pipeline', 'opec', 'refinery', 'crude oil', 'natural gas', 'energy crisis',
      'barrel', 'brent', 'drilling', 'energy export', 'energy supply',
      'fracking', 'fuel shortage', 'gasoline', 'lng', 'oil embargo',
      'oil price', 'oil production', 'oil reserve', 'petroleum', 'production cut',
      'renewable', 'shale', 'wti',
    ],
    defaultAssets: [
      { ticker: 'XOM', assetClass: 'equity', direction: 'bullish', confidence: 0.8, reasoning: 'ExxonMobil benefits from energy supply disruptions' },
      { ticker: 'CVX', assetClass: 'equity', direction: 'bullish', confidence: 0.8, reasoning: 'Chevron gains on higher oil prices' },
      { ticker: 'USO', assetClass: 'commodity', direction: 'bullish', confidence: 0.85, reasoning: 'US Oil Fund directly tracks crude prices' },
      { ticker: 'UNG', assetClass: 'commodity', direction: 'bullish', confidence: 0.75, reasoning: 'US Natural Gas Fund responds to supply concerns' },
      { ticker: 'SHEL', assetClass: 'equity', direction: 'bullish', confidence: 0.7, reasoning: 'Shell benefits from energy price increases' },
    ],
    severityKeywords: {
      low: ['production report', 'inventory data', 'rig count', 'energy forecast'],
      medium: ['opec meeting', 'production cut', 'pipeline maintenance', 'refinery outage'],
      high: ['pipeline attack', 'supply disruption', 'energy crisis', 'oil embargo'],
      critical: ['major pipeline destruction', 'opec collapse', 'strait blockade', 'energy war'],
    },
    color: '#eab308', // yellow
  },
  {
    id: 'political',
    name: 'Political Instability',
    description: 'Elections, regime change, civil unrest, governance crises',
    keywords: [
      'election', 'coup', 'protest', 'revolution', 'resignation', 'impeach',
      'assassination', 'authoritarian', 'cabinet reshuffle', 'civil unrest',
      'constitutional crisis', 'contested election', 'democracy', 'dictator',
      'emergency powers', 'government collapse', 'martial law', 'opposition',
      'political crisis', 'regime change', 'riot', 'succession', 'uprising',
    ],
    defaultAssets: [
      { ticker: 'EEM', assetClass: 'equity', direction: 'bearish', confidence: 0.65, reasoning: 'Emerging markets sell off on political instability' },
      { ticker: 'GLD', assetClass: 'commodity', direction: 'bullish', confidence: 0.7, reasoning: 'Gold rises as safe haven during political turmoil' },
      { ticker: 'DXY', assetClass: 'forex', direction: 'bullish', confidence: 0.55, reasoning: 'Dollar strengthens as flight to safety' },
      { ticker: 'VIX', assetClass: 'equity', direction: 'bullish', confidence: 0.7, reasoning: 'Volatility index rises on political uncertainty' },
    ],
    severityKeywords: {
      low: ['election poll', 'cabinet change', 'political debate', 'policy proposal'],
      medium: ['mass protest', 'snap election', 'impeachment inquiry', 'political scandal'],
      high: ['coup attempt', 'state of emergency', 'government collapse', 'civil unrest'],
      critical: ['successful coup', 'revolution', 'civil war', 'martial law declared'],
    },
    color: '#a855f7', // purple
  },
  {
    id: 'disaster',
    name: 'Natural Disasters',
    description: 'Earthquakes, hurricanes, floods, wildfires, and climate events',
    keywords: [
      'earthquake', 'hurricane', 'flood', 'tsunami', 'wildfire', 'drought',
      'avalanche', 'blizzard', 'category 5', 'climate emergency', 'cyclone',
      'disaster relief', 'evacuation', 'famine', 'landslide', 'magnitude',
      'monsoon', 'natural disaster', 'relief effort', 'storm surge', 'tornado',
      'typhoon', 'volcanic eruption',
    ],
    defaultAssets: [
      { ticker: 'AIG', assetClass: 'equity', direction: 'bearish', confidence: 0.7, reasoning: 'Insurance companies face claim surges after disasters' },
      { ticker: 'ALL', assetClass: 'equity', direction: 'bearish', confidence: 0.7, reasoning: 'Allstate insurance exposure to natural disaster claims' },
      { ticker: 'CAT', assetClass: 'equity', direction: 'bullish', confidence: 0.65, reasoning: 'Caterpillar benefits from reconstruction demand' },
      { ticker: 'HD', assetClass: 'equity', direction: 'bullish', confidence: 0.6, reasoning: 'Home Depot benefits from rebuilding demand' },
      { ticker: 'WEAT', assetClass: 'commodity', direction: 'bullish', confidence: 0.6, reasoning: 'Wheat prices spike on agricultural disruption' },
    ],
    severityKeywords: {
      low: ['tropical storm', 'minor earthquake', 'wildfire contained', 'flood watch'],
      medium: ['hurricane warning', 'moderate earthquake', 'wildfire spreading', 'flash flood'],
      high: ['major hurricane', 'strong earthquake', 'widespread flooding', 'mega fire'],
      critical: ['catastrophic hurricane', 'massive earthquake', 'tsunami warning', 'volcanic eruption'],
    },
    color: '#22c55e', // green
  },
  {
    id: 'cyber',
    name: 'Technology & Cyber',
    description: 'Cybersecurity incidents, tech regulation, data breaches, AI policy',
    keywords: [
      'hack', 'breach', 'cyber', 'ai regulation', 'data leak', 'ransomware',
      'antitrust', 'botnet', 'critical infrastructure attack', 'cyber espionage',
      'cyberattack', 'cybersecurity', 'ddos', 'deepfake', 'exploit',
      'malware', 'phishing', 'tech ban', 'tech crackdown', 'tech regulation',
      'zero day', 'zero-day',
    ],
    defaultAssets: [
      { ticker: 'CRWD', assetClass: 'equity', direction: 'bullish', confidence: 0.75, reasoning: 'CrowdStrike benefits from increased cybersecurity spending' },
      { ticker: 'PANW', assetClass: 'equity', direction: 'bullish', confidence: 0.75, reasoning: 'Palo Alto Networks gains on cybersecurity demand' },
      { ticker: 'HACK', assetClass: 'equity', direction: 'bullish', confidence: 0.7, reasoning: 'Cybersecurity ETF rises on breach headlines' },
      { ticker: 'AAPL', assetClass: 'equity', direction: 'volatile', confidence: 0.5, reasoning: 'Big tech faces regulatory uncertainty' },
      { ticker: 'GOOGL', assetClass: 'equity', direction: 'volatile', confidence: 0.5, reasoning: 'Alphabet affected by tech regulation changes' },
    ],
    severityKeywords: {
      low: ['data policy', 'security patch', 'minor breach', 'phishing attempt'],
      medium: ['data breach', 'ransomware attack', 'tech regulation proposal', 'significant hack'],
      high: ['critical infrastructure hack', 'major data leak', 'nationwide outage', 'state-sponsored attack'],
      critical: ['power grid attack', 'financial system breach', 'nuclear facility hack', 'internet shutdown'],
    },
    color: '#06b6d4', // cyan
  },
  {
    id: 'monetary',
    name: 'Monetary Policy',
    description: 'Central bank decisions, interest rates, inflation, quantitative easing/tightening',
    keywords: [
      'interest rate', 'central bank', 'fed', 'rate hike', 'rate cut', 'qe', 'qt',
      'inflation', 'basis points', 'bond yield', 'cpi', 'deflation',
      'dovish', 'ecb', 'federal reserve', 'fomc', 'hawkish', 'hyperinflation',
      'monetary easing', 'monetary policy', 'monetary tightening', 'ppi',
      'quantitative easing', 'quantitative tightening', 'stagflation',
      'taper', 'treasury', 'yield curve',
    ],
    defaultAssets: [
      { ticker: 'TLT', assetClass: 'bond', direction: 'volatile', confidence: 0.85, reasoning: '20+ year Treasury bond ETF directly reacts to rate changes' },
      { ticker: 'DXY', assetClass: 'forex', direction: 'volatile', confidence: 0.8, reasoning: 'Dollar index moves on monetary policy shifts' },
      { ticker: 'GLD', assetClass: 'commodity', direction: 'volatile', confidence: 0.7, reasoning: 'Gold reprices on real rate expectations' },
      { ticker: 'BTC/USD', assetClass: 'crypto', direction: 'volatile', confidence: 0.65, reasoning: 'Bitcoin reacts to liquidity and rate expectations' },
      { ticker: 'SPY', assetClass: 'equity', direction: 'volatile', confidence: 0.75, reasoning: 'S&P 500 reprices on rate path changes' },
    ],
    severityKeywords: {
      low: ['inflation data', 'fed minutes', 'economic forecast', 'employment report'],
      medium: ['rate decision', 'rate hike', 'rate cut', 'qe announcement', 'cpi surprise'],
      high: ['emergency rate change', 'unexpected pivot', 'stagflation warning', 'yield curve inversion'],
      critical: ['hyperinflation', 'currency crisis', 'central bank intervention', 'financial system stress'],
    },
    color: '#3b82f6', // blue
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    description: 'Logistics disruptions, shipping delays, manufacturing shutdowns, component shortages',
    keywords: [
      'port closure', 'shipping delay', 'supply shortage', 'chip shortage',
      'factory shutdown', 'backlog', 'bottleneck', 'canal blockage',
      'cargo', 'component shortage', 'container ship', 'dock strike',
      'freight', 'logistics', 'manufacturing halt', 'port congestion',
      'semiconductor shortage', 'shipping disruption', 'stockpile',
      'supply chain', 'warehouse',
    ],
    defaultAssets: [
      { ticker: 'ZIM', assetClass: 'equity', direction: 'bullish', confidence: 0.7, reasoning: 'Shipping rates increase on supply chain disruptions' },
      { ticker: 'FDX', assetClass: 'equity', direction: 'volatile', confidence: 0.6, reasoning: 'FedEx impacted by logistics disruptions' },
      { ticker: 'TSM', assetClass: 'equity', direction: 'volatile', confidence: 0.65, reasoning: 'TSMC affected by semiconductor supply chain issues' },
      { ticker: 'NVDA', assetClass: 'equity', direction: 'volatile', confidence: 0.6, reasoning: 'NVIDIA impacted by chip supply chain dynamics' },
      { ticker: 'CAT', assetClass: 'equity', direction: 'volatile', confidence: 0.55, reasoning: 'Caterpillar affected by manufacturing supply chains' },
    ],
    severityKeywords: {
      low: ['shipping delay', 'minor backlog', 'supply concern', 'inventory adjustment'],
      medium: ['port congestion', 'factory slowdown', 'component shortage', 'freight rate spike'],
      high: ['port closure', 'factory shutdown', 'chip shortage crisis', 'major canal blockage'],
      critical: ['global supply chain collapse', 'major strait closure', 'multi-port shutdown', 'critical shortage'],
    },
    color: '#f59e0b', // amber
  },
] as const

/** Lookup category definition by id */
export function getCategoryDef(id: SignalCategory): CategoryDef | undefined {
  return SIGNAL_CATEGORIES.find((c) => c.id === id)
}

/** Map of category id to definition for O(1) lookup */
export const CATEGORY_MAP: ReadonlyMap<SignalCategory, CategoryDef> = new Map(
  SIGNAL_CATEGORIES.map((c) => [c.id, c]),
)
