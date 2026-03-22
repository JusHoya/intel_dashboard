import { create } from 'zustand'
import type { MosaicNode } from 'react-mosaic-component'
import type { LayoutPreset, PanelId } from '../types'

const STORAGE_KEY = 'sigint-layout'

// ---------------------------------------------------------------------------
// Preset layout definitions
// ---------------------------------------------------------------------------

/** Default: Globe+News left (65%) | Financial+Signals right (35%) */
const DEFAULT_LAYOUT: MosaicNode<PanelId> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [65, 35],
  children: [
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [65, 35],
      children: ['globe', 'news'],
    },
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [65, 35],
      children: ['financial', 'signals'],
    },
  ],
}

/** Full Globe: Globe dominant (85%) | thin right sidebar with Financial+Signals */
const FULL_GLOBE_LAYOUT: MosaicNode<PanelId> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [85, 15],
  children: [
    'globe',
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: ['financial', 'signals'],
    },
  ],
}

/** Trading Floor: Financial dominant (60%) | Globe+News stacked right (40%) */
const TRADING_FLOOR_LAYOUT: MosaicNode<PanelId> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [60, 40],
  children: [
    'financial',
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: ['globe', 'news'],
    },
  ],
}

/** Analyst Desk: Globe (50%) | News(40%) + (Financial+Signals)(60%) right column */
const ANALYST_DESK_LAYOUT: MosaicNode<PanelId> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [50, 50],
  children: [
    'globe',
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [40, 60],
      children: [
        'news',
        {
          type: 'split',
          direction: 'row',
          splitPercentages: [50, 50],
          children: ['financial', 'signals'],
        },
      ],
    },
  ],
}

/** News Room: News dominant (50%) | Globe+Financial stacked right (50%) */
const NEWS_ROOM_LAYOUT: MosaicNode<PanelId> = {
  type: 'split',
  direction: 'row',
  splitPercentages: [50, 50],
  children: [
    'news',
    {
      type: 'split',
      direction: 'column',
      splitPercentages: [50, 50],
      children: ['globe', 'financial'],
    },
  ],
}

export const PRESET_LAYOUTS: Record<LayoutPreset, MosaicNode<PanelId>> = {
  default: DEFAULT_LAYOUT,
  fullGlobe: FULL_GLOBE_LAYOUT,
  tradingFloor: TRADING_FLOOR_LAYOUT,
  analystDesk: ANALYST_DESK_LAYOUT,
  newsRoom: NEWS_ROOM_LAYOUT,
}

export const PRESET_LABELS: Record<LayoutPreset, string> = {
  default: 'DEFAULT',
  fullGlobe: 'FULL GLOBE',
  tradingFloor: 'TRADING',
  analystDesk: 'ANALYST',
  newsRoom: 'NEWSROOM',
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

interface PersistedLayout {
  preset: LayoutPreset
  layout: MosaicNode<PanelId>
}

function loadPersistedLayout(): PersistedLayout | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedLayout
    if (parsed && parsed.preset && parsed.layout) return parsed
    return null
  } catch {
    return null
  }
}

function persistLayout(preset: LayoutPreset, layout: MosaicNode<PanelId>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ preset, layout }))
  } catch {
    // Silently ignore storage errors
  }
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

interface LayoutState {
  preset: LayoutPreset
  layout: MosaicNode<PanelId>

  /** Switch to a named preset layout */
  setPreset: (preset: LayoutPreset) => void
  /** Update the layout (e.g. from user drag/resize) without changing the preset label */
  setLayout: (layout: MosaicNode<PanelId> | null) => void
  /** Reset the current layout back to its preset definition */
  resetToPreset: () => void
}

const persisted = loadPersistedLayout()

export const useLayoutStore = create<LayoutState>((set, get) => ({
  preset: persisted?.preset ?? 'default',
  layout: persisted?.layout ?? DEFAULT_LAYOUT,

  setPreset: (preset) => {
    const layout = PRESET_LAYOUTS[preset]
    persistLayout(preset, layout)
    set({ preset, layout })
  },

  setLayout: (layout) => {
    if (!layout) return
    const { preset } = get()
    persistLayout(preset, layout)
    set({ layout })
  },

  resetToPreset: () => {
    const { preset } = get()
    const layout = PRESET_LAYOUTS[preset]
    persistLayout(preset, layout)
    set({ layout })
  },
}))
