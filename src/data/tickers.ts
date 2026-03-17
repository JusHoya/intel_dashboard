import type { AssetClass } from '../types/market'

/** Default ticker definition for the watchlist */
export interface TickerDef {
  symbol: string
  name: string
  assetClass: AssetClass
  /** Binance symbol for crypto (e.g. BTCUSDT) */
  binanceSymbol?: string
  /** ISO country codes this ticker is linked to */
  countries: string[]
}

/** Default watchlist — crypto + equities */
export const DEFAULT_WATCHLIST: readonly TickerDef[] = [
  // Crypto
  { symbol: 'BTC/USD', name: 'Bitcoin', assetClass: 'crypto', binanceSymbol: 'btcusdt', countries: [] },
  { symbol: 'ETH/USD', name: 'Ethereum', assetClass: 'crypto', binanceSymbol: 'ethusdt', countries: [] },
  { symbol: 'SOL/USD', name: 'Solana', assetClass: 'crypto', binanceSymbol: 'solusdt', countries: [] },
  { symbol: 'XRP/USD', name: 'XRP', assetClass: 'crypto', binanceSymbol: 'xrpusdt', countries: [] },
  { symbol: 'BNB/USD', name: 'BNB', assetClass: 'crypto', binanceSymbol: 'bnbusdt', countries: [] },
  { symbol: 'ADA/USD', name: 'Cardano', assetClass: 'crypto', binanceSymbol: 'adausdt', countries: [] },
  { symbol: 'DOGE/USD', name: 'Dogecoin', assetClass: 'crypto', binanceSymbol: 'dogeusdt', countries: [] },
  { symbol: 'AVAX/USD', name: 'Avalanche', assetClass: 'crypto', binanceSymbol: 'avaxusdt', countries: [] },

  // US Equities
  { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'equity', countries: ['US'] },
  { symbol: 'MSFT', name: 'Microsoft', assetClass: 'equity', countries: ['US'] },
  { symbol: 'GOOGL', name: 'Alphabet', assetClass: 'equity', countries: ['US'] },
  { symbol: 'AMZN', name: 'Amazon', assetClass: 'equity', countries: ['US'] },
  { symbol: 'NVDA', name: 'NVIDIA', assetClass: 'equity', countries: ['US'] },
  { symbol: 'TSLA', name: 'Tesla', assetClass: 'equity', countries: ['US'] },

  // International Equities
  { symbol: 'TSM', name: 'TSMC', assetClass: 'equity', countries: ['TW', 'CN'] },
  { symbol: 'BABA', name: 'Alibaba', assetClass: 'equity', countries: ['CN'] },
  { symbol: 'TM', name: 'Toyota Motor', assetClass: 'equity', countries: ['JP'] },
  { symbol: 'SHEL', name: 'Shell plc', assetClass: 'equity', countries: ['GB', 'NL'] },
  { symbol: 'SAP', name: 'SAP SE', assetClass: 'equity', countries: ['DE'] },
  { symbol: 'VALE', name: 'Vale S.A.', assetClass: 'equity', countries: ['BR'] },
] as const

/** Map of ISO alpha-2 country codes to associated ticker symbols */
export const COUNTRY_TICKER_MAP: Record<string, string[]> = {
  US: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'BTC/USD', 'ETH/USD', 'SOL/USD'],
  CN: ['BABA', 'TSM', 'BNB/USD'],
  JP: ['TM', 'ETH/USD'],
  GB: ['SHEL'],
  DE: ['SAP'],
  BR: ['VALE'],
  TW: ['TSM'],
  NL: ['SHEL'],
  KR: ['SOL/USD'],
  SG: ['BNB/USD'],
  AE: ['BTC/USD', 'ETH/USD'],
  IN: ['BTC/USD'],
  AU: ['BTC/USD'],
  CA: ['BTC/USD', 'ETH/USD'],
  CH: ['BTC/USD'],
  HK: ['BABA'],
}

/** Map of GeoJSON country names to ISO alpha-2 codes (for geo-linking from globe clicks) */
export const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  'United States of America': 'US',
  'United States': 'US',
  'China': 'CN',
  'Japan': 'JP',
  'United Kingdom': 'GB',
  'Germany': 'DE',
  'Brazil': 'BR',
  'Taiwan': 'TW',
  'Netherlands': 'NL',
  'South Korea': 'KR',
  'Republic of Korea': 'KR',
  'Singapore': 'SG',
  'United Arab Emirates': 'AE',
  'India': 'IN',
  'Australia': 'AU',
  'Canada': 'CA',
  'Switzerland': 'CH',
  'Hong Kong': 'HK',
  'France': 'FR',
  'Russia': 'RU',
  'Saudi Arabia': 'SA',
  'Mexico': 'MX',
  'Indonesia': 'ID',
  'Turkey': 'TR',
  'Italy': 'IT',
  'Spain': 'ES',
  'Iran': 'IR',
  'Israel': 'IL',
  'Ukraine': 'UA',
  'Poland': 'PL',
  'Sweden': 'SE',
  'Norway': 'NO',
  'Nigeria': 'NG',
  'Egypt': 'EG',
  'South Africa': 'ZA',
  'Argentina': 'AR',
  'Colombia': 'CO',
  'Thailand': 'TH',
  'Vietnam': 'VN',
  'Philippines': 'PH',
  'Malaysia': 'MY',
  'Pakistan': 'PK',
  'Ireland': 'IE',
}
