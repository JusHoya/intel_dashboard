import { useNewsStore } from '../../store/news'
import { NEWS_CHANNELS } from '../../data/channels'
import type { YouTubeChannel } from '../../types/news'

/**
 * Builds the embed URL for a YouTube channel.
 * Prefers the channel-based live_stream URL (auto-resolves to current live).
 * Falls back to a specific videoId if provided.
 */
function getEmbedUrl(channel: YouTubeChannel): string | null {
  if (channel.embedBlocked) return null
  if (channel.channelId) {
    return `https://www.youtube.com/embed/live_stream?channel=${channel.channelId}&autoplay=0&mute=1`
  }
  if (channel.videoId) {
    return `https://www.youtube.com/embed/${channel.videoId}?autoplay=0&mute=1`
  }
  return null
}

export function VideoPlayer() {
  const selectedChannelId = useNewsStore((s) => s.selectedChannelId)
  const selectChannel = useNewsStore((s) => s.selectChannel)

  // Use channel name as identifier since the new channel format uses name-based lookup
  const activeChannel = NEWS_CHANNELS.find((c) => c.name === selectedChannelId) ?? NEWS_CHANNELS[0]

  return (
    <div className="flex h-full flex-col">
      {/* Channel selector */}
      <div className="flex flex-wrap gap-1 border-b border-[#1a1a2e] px-2 py-1.5">
        {NEWS_CHANNELS.map((channel) => (
          <button
            key={channel.name}
            type="button"
            onClick={() => selectChannel(channel.name)}
            className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              channel.name === activeChannel.name
                ? 'bg-[#00ff41]/10 text-[#00ff41]'
                : channel.embedBlocked
                  ? 'text-neutral-700 line-through'
                  : 'text-neutral-600 hover:text-neutral-400'
            }`}
            title={channel.notes ?? channel.name}
            disabled={channel.embedBlocked}
          >
            {channel.name}
          </button>
        ))}
      </div>

      {/* Video embed */}
      <div className="relative flex-1 bg-black">
        {(() => {
          const embedUrl = getEmbedUrl(activeChannel)
          if (!embedUrl) {
            return (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0a0a0f',
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    color: '#ff4444',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  EMBED RESTRICTED
                </span>
                <span
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 10,
                    color: '#555',
                  }}
                >
                  {activeChannel.notes ?? `${activeChannel.name} blocks iframe embeds`}
                </span>
              </div>
            )
          }
          return (
            <iframe
              key={activeChannel.channelId ?? activeChannel.videoId}
              src={embedUrl}
              title={activeChannel.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          )
        })()}
      </div>

      {/* Channel info bar */}
      <div className="flex items-center justify-between border-t border-[#1a1a2e] px-3 py-1">
        <span className="font-mono text-[10px] text-neutral-600">
          LIVE · {activeChannel.name}
        </span>
        <span className="font-mono text-[10px] text-neutral-700">
          {activeChannel.notes ?? ''}
        </span>
      </div>
    </div>
  )
}
