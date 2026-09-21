import { useMemo } from 'react'
import './StarField.css'

// Deterministic pseudo-random scattering so the layout doesn't
// shift between renders, but still feels organic rather than gridded.
function seededRandom(seed) {
  let value = seed
  return () => {
    value = (value * 9301 + 49297) % 233280
    return value / 233280
  }
}

export default function StarField({ count = 36 }) {
  const dots = useMemo(() => {
    const rand = seededRandom(42)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      top: rand() * 100,
      left: rand() * 100,
      size: rand() > 0.85 ? 3 : 2,
      opacity: 0.15 + rand() * 0.35,
    }))
  }, [count])

  return (
    <div className="star-field" aria-hidden="true">
      {dots.map((dot) => (
        <span
          key={dot.id}
          className="star-field__dot"
          style={{
            top: `${dot.top}%`,
            left: `${dot.left}%`,
            width: dot.size,
            height: dot.size,
            opacity: dot.opacity,
          }}
        />
      ))}
    </div>
  )
}
