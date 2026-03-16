import type { PanelId } from '../../types'

interface PlaceholderPanelProps {
  title: string
  id: PanelId
}

export function PlaceholderPanel({ title, id }: PlaceholderPanelProps) {
  return (
    <div
      data-panel-id={id}
      className="flex h-full w-full flex-col border border-[#1a1a2e] bg-[#0d0d12]"
    >
      <div className="border-b border-[#1a1a2e] px-3 py-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#00ff41]">
          {title}
        </span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className="font-mono text-sm text-neutral-600">
          [ FEED OFFLINE ]
        </span>
      </div>
    </div>
  )
}
