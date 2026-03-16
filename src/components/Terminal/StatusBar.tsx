import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/app'
import type { FeedStatus } from '../../types'

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}

function formatUtcClock(date: Date): string {
  return [date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':')
}

const STATUS_COLOR: Record<FeedStatus, string> = {
  online: 'bg-[#00ff41]',
  degraded: 'bg-[#ffb000]',
  offline: 'bg-[#ff0040]',
}

export function StatusBar() {
  const sessionStart = useAppStore((s) => s.sessionStart)
  const feedHealth = useAppStore((s) => s.feedHealth)

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const uptime = formatDuration(now.getTime() - sessionStart.getTime())
  const utcClock = formatUtcClock(now)

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9998] flex h-7 items-center justify-between border-t px-3 font-mono text-xs select-none"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text-dim)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-2">
        <span className="glow tracking-wider" style={{ color: 'var(--color-primary)' }}>
          SIGINT DASHBOARD v0.1.0
        </span>
      </div>

      {/* Center section — feed health indicators */}
      <div className="flex items-center gap-3">
        {feedHealth.length === 0 && (
          <span style={{ color: 'var(--color-text-muted)' }}>NO FEEDS</span>
        )}
        {feedHealth.map((feed) => (
          <div key={feed.name} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_COLOR[feed.status]}`}
            />
            <span className="uppercase tracking-wide">{feed.name}</span>
          </div>
        ))}
      </div>

      {/* Right section — uptime + UTC clock */}
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--color-text-muted)' }}>UPTIME</span>
        <span>{uptime}</span>

        <span
          className="mx-1 inline-block h-3 w-px"
          style={{ backgroundColor: 'var(--color-border)' }}
        />

        <span style={{ color: 'var(--color-text-muted)' }}>UTC</span>
        <span>{utcClock}</span>
      </div>
    </div>
  )
}
