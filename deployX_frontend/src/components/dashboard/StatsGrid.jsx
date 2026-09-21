import Sparkline from './Sparkline'
import './StatsGrid.css'

const STATS = [
  {
    label: 'Total Deployments',
    value: '6',
    caption: 'All environments',
    color: '#8b7ffb',
    trend: [3, 4, 3, 5, 4, 6, 5, 6],
  },
  {
    label: 'Running',
    value: '5',
    caption: '87.5% uptime',
    color: '#3ecf8e',
    trend: [4, 4, 5, 4, 5, 5, 5, 5],
  },
  {
    label: 'Successful',
    value: '18',
    caption: 'Last 30 days',
    color: '#3ecf8e',
    trend: [10, 11, 12, 12, 14, 15, 16, 18],
  },
  {
    label: 'Failed',
    value: '1',
    caption: 'Action required',
    color: '#f0616b',
    trend: [0, 1, 0, 1, 0, 1, 0, 1],
    isAlert: true,
  },
]

export default function StatsGrid() {
  return (
    <div className="stats-grid">
      {STATS.map((stat) => (
        <article className={`stat-card${stat.isAlert ? ' stat-card--alert' : ''}`} key={stat.label}>
          <p className="stat-card__label">{stat.label}</p>
          <p className="stat-card__value">{stat.value}</p>
          <p className="stat-card__caption">{stat.caption}</p>
          <div className="stat-card__chart">
            <Sparkline points={stat.trend} color={stat.color} />
          </div>
        </article>
      ))}
    </div>
  )
}
