import type { YouTubeChannel } from '../types/news'

/**
 * Curated list of live news YouTube channels.
 *
 * Video IDs point to each channel's 24/7 live stream.  These are
 * relatively stable but may change if the channel re-creates their
 * live stream — check periodically and update as needed.
 */
export const NEWS_CHANNELS: YouTubeChannel[] = [
  // ── Business / Financial ──────────────────────────────────────────
  {
    id: 'bloomberg',
    name: 'Bloomberg TV',
    videoId: 'dp8PhLsUcFEgm', // Bloomberg Global Financial News
    region: 'US',
    category: 'business',
  },
  {
    id: 'cnbc',
    name: 'CNBC',
    videoId: '9NyxcX3rhQs', // CNBC Live
    region: 'US',
    category: 'business',
  },
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance',
    videoId: 'SyyGMCfkMyo', // Yahoo Finance Live
    region: 'US',
    category: 'business',
  },

  // ── World News ────────────────────────────────────────────────────
  {
    id: 'aljazeera',
    name: 'Al Jazeera',
    videoId: 'gCNeDWCI0vo', // Al Jazeera English Live
    region: 'QA',
    category: 'world',
  },
  {
    id: 'france24',
    name: 'France 24',
    videoId: 'h3MuIUNCCzI', // France 24 English Live
    region: 'FR',
    category: 'world',
  },
  {
    id: 'dw',
    name: 'DW News',
    videoId: 'GE_SfNVNyqk', // DW News Live
    region: 'DE',
    category: 'world',
  },
  {
    id: 'skynews',
    name: 'Sky News',
    videoId: 'siyW0GOBtUo', // Sky News Live
    region: 'GB',
    category: 'world',
  },
  {
    id: 'abc-au',
    name: 'ABC News AU',
    videoId: 'W1ilCy6XrmI', // ABC News Australia Live
    region: 'AU',
    category: 'world',
  },

  // ── Regional ──────────────────────────────────────────────────────
  {
    id: 'ndtv',
    name: 'NDTV',
    videoId: 'RDLhGMIGCb0', // NDTV 24x7 Live
    region: 'IN',
    category: 'regional',
  },
  {
    id: 'nhk',
    name: 'NHK World',
    videoId: 'f0lYkdA-Bh4', // NHK World Japan Live
    region: 'JP',
    category: 'regional',
  },
  {
    id: 'arirang',
    name: 'Arirang TV',
    videoId: 'vJm6Kpaqm08', // Arirang TV Korea Live
    region: 'KR',
    category: 'regional',
  },
]

/** Default channel to show when no selection is made */
export const DEFAULT_CHANNEL_ID = 'aljazeera'
