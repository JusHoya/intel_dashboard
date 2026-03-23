/* ── Paper Trading Tracker ──────────────────────────────────────────────
   In-memory paper trading system that opens positions based on signals
   and tracks unrealized P&L against current market prices.  No real
   money involved — purely for evaluating signal accuracy in real time. */

import { randomUUID } from 'node:crypto'

/* ── Types ──────────────────────────────────────────────────────────── */

export interface PaperPosition {
  id: string
  signalId: string
  ticker: string
  direction: 'long' | 'short'
  entryPrice: number
  entryDate: string
  quantity: number
  currentPrice: number
  unrealizedPnL: number
  status: 'open' | 'closed'
  exitPrice?: number
  exitDate?: string
  realizedPnL?: number
}

export interface TradeRequest {
  signalId: string
  ticker: string
  direction: 'long' | 'short'
  entryPrice: number
  quantity: number
}

export interface PerformanceSummary {
  totalPositions: number
  openPositions: number
  closedPositions: number
  totalInvested: number
  totalUnrealizedPnL: number
  totalRealizedPnL: number
  netPnL: number
  winRate: number
  positions: PaperPosition[]
}

/* ── In-memory store ────────────────────────────────────────────────── */

const positions: PaperPosition[] = []

/* ── Public API ─────────────────────────────────────────────────────── */

export function getOpenPositions(): PaperPosition[] {
  return positions.filter((p) => p.status === 'open')
}

export function getAllPositions(): PaperPosition[] {
  return [...positions]
}

export function openPosition(req: TradeRequest): PaperPosition {
  const pos: PaperPosition = {
    id: randomUUID(),
    signalId: req.signalId,
    ticker: req.ticker,
    direction: req.direction,
    entryPrice: req.entryPrice,
    entryDate: new Date().toISOString().slice(0, 10),
    quantity: req.quantity,
    currentPrice: req.entryPrice,
    unrealizedPnL: 0,
    status: 'open',
  }
  positions.push(pos)
  return pos
}

export function closePosition(positionId: string, exitPrice: number): PaperPosition | null {
  const pos = positions.find((p) => p.id === positionId && p.status === 'open')
  if (!pos) return null

  pos.status = 'closed'
  pos.exitPrice = exitPrice
  pos.exitDate = new Date().toISOString().slice(0, 10)
  pos.currentPrice = exitPrice

  const rawPnL = (exitPrice - pos.entryPrice) * pos.quantity
  pos.realizedPnL = pos.direction === 'short' ? -rawPnL : rawPnL
  pos.unrealizedPnL = 0

  return pos
}

export function updateCurrentPrice(ticker: string, price: number): number {
  let updated = 0
  for (const pos of positions) {
    if (pos.ticker === ticker && pos.status === 'open') {
      pos.currentPrice = price
      const rawPnL = (price - pos.entryPrice) * pos.quantity
      pos.unrealizedPnL = pos.direction === 'short'
        ? parseFloat((-rawPnL).toFixed(2))
        : parseFloat(rawPnL.toFixed(2))
      updated++
    }
  }
  return updated
}

export function getPerformanceSummary(): PerformanceSummary {
  const open = positions.filter((p) => p.status === 'open')
  const closed = positions.filter((p) => p.status === 'closed')

  const totalInvested = positions.reduce(
    (sum, p) => sum + p.entryPrice * p.quantity, 0,
  )
  const totalUnrealizedPnL = open.reduce(
    (sum, p) => sum + p.unrealizedPnL, 0,
  )
  const totalRealizedPnL = closed.reduce(
    (sum, p) => sum + (p.realizedPnL ?? 0), 0,
  )

  const wins = closed.filter((p) => (p.realizedPnL ?? 0) > 0).length
  const winRate = closed.length > 0 ? wins / closed.length : 0

  return {
    totalPositions: positions.length,
    openPositions: open.length,
    closedPositions: closed.length,
    totalInvested: parseFloat(totalInvested.toFixed(2)),
    totalUnrealizedPnL: parseFloat(totalUnrealizedPnL.toFixed(2)),
    totalRealizedPnL: parseFloat(totalRealizedPnL.toFixed(2)),
    netPnL: parseFloat((totalRealizedPnL + totalUnrealizedPnL).toFixed(2)),
    winRate: parseFloat(winRate.toFixed(4)),
    positions: [...positions],
  }
}
