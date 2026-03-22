import { useEffect, useRef, useCallback } from 'react'
import { useNewsStore } from '../store/news'
import { useAppStore } from '../store/app'
import type { NewsItem } from '../types/news'

const POLL_INTERVAL_MS = 300_000 // 5 minutes (matches server cache TTL)
const SERVER_BASE = 'http://localhost:3001'

/**
 * Hook that polls the server for GDELT news headlines.
 * Respects the current filter in the news store (country/topic).
 * Updates the news store and feed health indicator.
 */
export function useNewsFeed() {
  const setItems = useNewsStore((s) => s.setItems)
  const setLoading = useNewsStore((s) => s.setLoading)
  const filter = useNewsStore((s) => s.filter)
  const updateFeedHealth = useAppStore((s) => s.updateFeedHealth)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter.country) params.set('country', filter.country)
      if (filter.topic) params.set('topic', filter.topic)
      params.set('limit', '50')

      const response = await fetch(`${SERVER_BASE}/api/news?${params.toString()}`)
      if (!response.ok) throw new Error(`News API returned ${response.status}`)

      const data = (await response.json()) as { articles: NewsItem[] }

      if (!mountedRef.current) return

      setItems(data.articles)
      updateFeedHealth([
        { name: 'NEWS', status: 'online', lastUpdate: new Date() },
      ])
    } catch {
      if (!mountedRef.current) return
      updateFeedHealth([
        { name: 'NEWS', status: 'offline', lastUpdate: null },
      ])
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [filter.country, filter.topic, setItems, setLoading, updateFeedHealth])

  useEffect(() => {
    mountedRef.current = true

    // Fetch immediately, then poll
    fetchNews()

    // Clear any existing timer before setting a new one
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(fetchNews, POLL_INTERVAL_MS)

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [fetchNews])
}
