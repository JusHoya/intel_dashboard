import { useNewsStore } from '../../store/news'
import { NEWS_CHANNELS, DEFAULT_CHANNEL_ID } from '../../data/channels'

export function VideoPlayer() {
  const selectedChannelId = useNewsStore((s) => s.selectedChannelId)
  const selectChannel = useNewsStore((s) => s.selectChannel)

  const activeId = selectedChannelId ?? DEFAULT_CHANNEL_ID
  const activeChannel = NEWS_CHANNELS.find((c) => c.id === activeId) ?? NEWS_CHANNELS[0]

  return (
    <div className="flex h-full flex-col">
      {/* Channel selector */}
      <div className="flex flex-wrap gap-1 border-b border-[#1a1a2e] px-2 py-1.5">
        {NEWS_CHANNELS.map((channel) => (
          <button
            key={channel.id}
            type="button"
            onClick={() => selectChannel(channel.id)}
            className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider transition-colors ${
              channel.id === activeId
                ? 'bg-[#00ff41]/10 text-[#00ff41]'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
            title={`${channel.name} (${channel.region})`}
          >
            {channel.name}
          </button>
        ))}
      </div>

      {/* Video embed */}
      <div className="relative flex-1 bg-black">
        <iframe
          key={activeChannel.videoId}
          src={`https://www.youtube.com/embed/${activeChannel.videoId}?autoplay=1&mute=1&rel=0`}
          title={activeChannel.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>

      {/* Channel info bar */}
      <div className="flex items-center justify-between border-t border-[#1a1a2e] px-3 py-1">
        <span className="font-mono text-[10px] text-neutral-600">
          LIVE · {activeChannel.name}
        </span>
        <span className="font-mono text-[10px] text-neutral-700">
          {activeChannel.region} · {activeChannel.category.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
