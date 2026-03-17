interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  positive?: boolean
}

/** Minimal SVG sparkline for inline price history */
export function Sparkline({ data, width = 60, height = 20, positive }: SparklineProps) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="opacity-30">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="#3a3a4a"
          strokeWidth={1}
        />
      </svg>
    )
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width
      const y = padding + ((max - val) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  // Color based on whether the trend is positive (comparing first to last)
  const isUp = positive ?? data[data.length - 1] >= data[0]
  const color = isUp ? '#00ff41' : '#ff0040'

  return (
    <svg width={width} height={height}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
}
