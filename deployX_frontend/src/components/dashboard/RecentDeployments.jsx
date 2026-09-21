import { ChevronRight } from 'lucide-react'
import './DashboardShared.css'
import './RecentDeployments.css'

const DEPLOYMENTS = [
  {
    initial: 'D',
    name: 'DemoShop',
    env: 'Production',
    version: 'v1.4.2',
    status: 'Healthy',
    time: '12 min ago',
  },
  {
    initial: 'P',
    name: 'Portfolio',
    env: 'Production',
    version: 'v2.1.0',
    status: 'Healthy',
    time: '2 hours ago',
  },
  {
    initial: 'E',
    name: 'E-commerce',
    env: 'Production',
    version: 'v1.0.3',
    status: 'Failed',
    time: '5 hours ago',
  },
]

export default function RecentDeployments() {
  return (
    <section className="panel recent-deployments">
      <header className="panel__header">
        <h3 className="panel__title">Recent Deployments</h3>
        <a href="#view-all" className="panel__link">
          View all →
        </a>
      </header>

      <ul className="deployment-list">
        {DEPLOYMENTS.map((d) => (
          <li className="deployment-row" key={d.name}>
            <span className={`deployment-row__avatar deployment-row__avatar--${d.initial.toLowerCase()}`}>
              {d.initial}
            </span>

            <div className="deployment-row__main">
              <div className="deployment-row__name-line">
                <span className="deployment-row__name">{d.name}</span>
                <span className="deployment-row__tag">{d.env}</span>
              </div>
              <span className="deployment-row__version">{d.version}</span>
            </div>

            <div className="deployment-row__meta">
              <span
                className={`status-pill ${
                  d.status === 'Healthy' ? 'status-pill--healthy' : 'status-pill--failed'
                }`}
              >
                <span className="status-pill__dot" />
                {d.status}
              </span>
              <span className="deployment-row__time">{d.time}</span>
            </div>

            <ChevronRight size={18} className="deployment-row__chevron" />
          </li>
        ))}
      </ul>
    </section>
  )
}
