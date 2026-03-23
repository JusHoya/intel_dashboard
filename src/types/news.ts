/** View modes for the news panel */
export type NewsViewMode = 'feed' | 'video'

/** A news article from GDELT or other source */
export interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  sourceCountry: string
  publishedAt: string
  imageUrl: string | null
  tone: number // GDELT tone score: negative = negative sentiment, positive = positive
  language: string
  domain: string
}

/** A curated YouTube live news channel */
export interface YouTubeChannel {
  /** Display name of the channel/network */
  name: string
  /** YouTube channel ID (used for live_stream embed URL) */
  channelId?: string
  /** Specific video ID (fallback if channelId live_stream doesn't work) */
  videoId?: string
  /** Whether embedding is known to be blocked by the channel */
  embedBlocked?: boolean
  /** Brief note about the channel */
  notes?: string
}

/** Active filter state for news */
export interface NewsFilter {
  country: string | null
  topic: string | null
}
