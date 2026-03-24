import { useState } from 'react'
import { CCTV_FEEDS, type CCTVFeed } from '../../data/cctvFeeds'

/**
 * CCTV Panel — displays public traffic camera and city webcam feeds.
 * Uses YouTube live stream embeds for real-time video.
 */
export function CCTVPanel() {
  const [selectedFeed, setSelectedFeed] = useState<CCTVFeed>(CCTV_FEEDS[0])

  return (
    <div className="flex h-full flex-col">
      {/* Feed selector */}
      <div className="flex flex-wrap gap-1 border-b border-[#1a1a2e] px-2 py-1.5">
        {CCTV_FEEDS.map((feed) => (
          <button
            key={feed.id}
            type="button"
            onClick={() => setSelectedFeed(feed)}
            className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              feed.id === selectedFeed.id
                ? 'bg-[#ff4444]/10 text-[#ff4444]'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
            title={`${feed.name} — ${feed.location}`}
          >
            {feed.name}
          </button>
        ))}
      </div>

      {/* Video embed */}
      <div className="relative flex-1 bg-black">
        {selectedFeed.type === 'youtube' ? (
          <iframe
            key={selectedFeed.id}
            src={selectedFeed.url}
            title={selectedFeed.name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-mono text-xs text-neutral-600">
              FEED UNAVAILABLE
            </span>
          </div>
        )}

        {/* Overlay: recording indicator */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(0,0,0,0.6)',
            padding: '3px 8px',
            borderRadius: 2,
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#ff0000',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#ff4444', letterSpacing: '0.1em' }}>
            LIVE
          </span>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex items-center justify-between border-t border-[#1a1a2e] px-3 py-1">
        <span className="font-mono text-[10px] text-neutral-600">
          CCTV · {selectedFeed.name}
        </span>
        <span className="font-mono text-[10px] text-neutral-700">
          {selectedFeed.location}
        </span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
