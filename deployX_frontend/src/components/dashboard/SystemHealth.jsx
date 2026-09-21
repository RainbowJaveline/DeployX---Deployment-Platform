import './DashboardShared.css'
import './SystemHealth.css'

const SERVICES = [
  { name: 'Frontend Service', detail: '2 replicas', status: 'Healthy' },
  { name: 'Backend Service', detail: '2 replicas', status: 'Healthy' },
  { name: 'PostgreSQL', detail: '5 GB storage', status: 'Healthy' },
  { name: 'Kubernetes Cluster', detail: '4 nodes', status: 'Healthy' },
]

export default function SystemHealth() {
  return (
    <section className="panel system-health">
      <header className="panel__header">
        <h3 className="panel__title">System Health</h3>
        <span className="system-health__indicator" aria-hidden="true" />
      </header>

      <ul className="system-health__list">
        {SERVICES.map((service) => (
          <li className="system-health__row" key={service.name}>
            <div className="system-health__main">
              <span className="system-health__name">{service.name}</span>
              <span className="system-health__detail">{service.detail}</span>
            </div>

            <span className="status-pill status-pill--healthy">
              <span className="status-pill__dot" />
              {service.status}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
