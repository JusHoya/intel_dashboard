export type {
  SignalCategory,
  Severity,
  TimeHorizon,
  SignalStatus,
  AssetDirection,
  AssetClass,
  AssetImpact,
  IntelSignal,
  NewsItem,
} from './types.ts'

export type { CategoryDef } from './categories.ts'
export { SIGNAL_CATEGORIES, getCategoryDef, CATEGORY_MAP } from './categories.ts'
export { scoreSignal, determineSeverity } from './scoring.ts'
export { generateSignals } from './engine.ts'
