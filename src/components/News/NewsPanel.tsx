import { useNewsStore } from '../../store/news'
import { useNewsFeed } from '../../feeds/news'
import { NewsFeed } from './NewsFeed'
import { VideoPlayer } from './VideoPlayer'
import type { NewsViewMode } from '../../types/news'

const VIEW_MODES: { id: NewsViewMode; label: string }[] = [
  { id: 'feed', label: 'FEED' },
  { id: 'video', label: 'VIDEO' },
]

export function NewsPanel() {
  // Activate the news data feed
  useNewsFeed()

  const viewMode = useNewsStore((s) => s.viewMode)
  const setViewMode = useNewsStore((s) => s.setViewMode)
  const filter = useNewsStore((s) => s.filter)
  const clearFilter = useNewsStore((s) => s.clearFilter)

  return (
    <div className="flex h-full w-full flex-col border border-[#1a1a2e] bg-[#0d0d12]">
      {/* Header with view mode tabs */}
      <div className="flex items-center justify-between border-b border-[#1a1a2e] px-3 py-1.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00ff41]">
            INTEL FEED
          </span>
          {/* Active filter badge */}
          {filter.country && (
            <button
              type="button"
              onClick={clearFilter}
              className="flex items-center gap-1 rounded border border-[#00ff41]/30 bg-[#00ff41]/5 px-1.5 py-0.5 font-mono text-[10px] text-[#00ff41] transition-colors hover:bg-[#00ff41]/10"
            >
              {filter.country}
              <span className="text-[#00ff41]/50">&times;</span>
            </button>
          )}
        </div>
        <div className="flex gap-1">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setViewMode(mode.id)}
              className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                viewMode === mode.id
                  ? 'bg-[#00ff41]/10 text-[#00ff41]'
                  : 'text-neutral-600 hover:text-neutral-400'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'feed' ? <NewsFeed /> : <VideoPlayer />}
      </div>
    </div>
  )
}
