import './StatsRow.css'

const STATS = [
  { value: '2m 31s', label: 'Avg deploy time' },
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '0 config', label: 'DevOps needed' },
]

export default function StatsRow() {
  return (
    <dl className="stats-row">
      {STATS.map((stat) => (
        <div className="stats-row__item" key={stat.label}>
          <dt className="stats-row__value">{stat.value}</dt>
          <dd className="stats-row__label">{stat.label}</dd>
        </div>
      ))}
    </dl>
  )
}
