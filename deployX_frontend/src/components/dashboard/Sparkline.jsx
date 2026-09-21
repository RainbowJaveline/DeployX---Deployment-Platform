import './Sparkline.css'

// Renders a lightweight line+fill sparkline from an array of numeric points.
// Kept dependency-free (no chart library) since each card only needs a
// simple trend glance, not an interactive chart.
export default function Sparkline({ points, color = 'var(--accent-bright)', height = 46 }) {
  const width = 100
  const max = Math.max(...points)
  const min = Math.min(...points)
  const range = max - min || 1

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((p - min) / range) * (height - 6) - 3
    return [x, y]
  })

  const linePath = coords
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  const gradientId = `spark-${color.replace(/[^a-zA-Z0-9]/g, '')}`

  return (
    <svg
      className="sparkline"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
