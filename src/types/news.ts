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
  id: string
  name: string
  videoId: string
  region: string
  category: 'business' | 'world' | 'regional'
}

/** Active filter state for news */
export interface NewsFilter {
  country: string | null
  topic: string | null
}
