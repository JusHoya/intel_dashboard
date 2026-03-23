import { useEffect, useRef } from 'react'
import { useSignalStore } from '../store/signals.ts'
import { generateSignals } from '../signals/engine.ts'
import type { NewsItem as SignalNewsItem } from '../signals/types.ts'
import type { NewsItem as AppNewsItem } from '../types/news'

/**
 * Hook that connects the news feed to the signal engine.
 *
 * Watches a source of news items and runs them through the signal engine
 * whenever new items appear. Tracks processed article IDs to avoid
 * re-processing the same articles.
 *
 * Bridges the app's NewsItem type (publishedAt: string) to the signal
 * engine's NewsItem type (publishedAt: number) automatically.
 */
export function useSignalProcessor(newsItems: readonly AppNewsItem[]) {
  const addSignals = useSignalStore((s) => s.addSignals)
  const processedIds = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Filter to only unprocessed articles
    const newItems = newsItems.filter((item) => !processedIds.current.has(item.id))
    if (newItems.length === 0) return

    // Mark as processed
    for (const item of newItems) {
      processedIds.current.add(item.id)
    }

    // Cap the processed set to prevent unbounded growth (keep last 5000)
    if (processedIds.current.size > 5000) {
      const entries = Array.from(processedIds.current)
      processedIds.current = new Set(entries.slice(entries.length - 5000))
    }

    // Convert app NewsItem[] to signal engine NewsItem[]
    const signalNewsItems: SignalNewsItem[] = newItems.map((item) => ({
      id: item.id,
      title: item.title,
      source: item.source,
      url: item.url,
      tone: item.tone,
      sourceCountry: item.sourceCountry,
      publishedAt: typeof item.publishedAt === 'number'
        ? item.publishedAt
        : new Date(item.publishedAt).getTime() || Date.now(),
    }))

    // Generate signals from new articles
    const signals = generateSignals(signalNewsItems)
    if (signals.length > 0) {
      addSignals(signals)
    }
  }, [newsItems, addSignals])
}
