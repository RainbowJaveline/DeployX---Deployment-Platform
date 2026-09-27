import { useState } from 'react'
import Sidebar from '../components/dashboard/Sidebar'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  MoreHorizontal,
  Rocket,
  Check,
} from 'lucide-react'
import Topbar from '../components/dashboard/Topbar'
import './ProjectDashboard.css'

export default function ProjectDashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  const repository = location.state?.repository || {
    name: 'demoshop',
    owner: 'alex',
  }

  const displayName =
    repository.name?.toLowerCase() === 'demoshop'
      ? 'DemoShop'
      : repository.name || 'DemoShop'

  const [activeTab, setActiveTab] = useState('Overview')
  const [showToast, setShowToast] = useState(true)

  const tabs = [
    'Overview',
    'Deployments',
    'Logs',
    'Metrics',
    'Settings',
  ]

  function handleRedeploy() {
    navigate('/deployment-progress', {
      state: {
        repository,
      },
    })
  }

  function handleOpenApp() {
    window.open(
      'https://demoshop.deployx.app',
      '_blank'
    )
  }

  return (
    <div className="project-dashboard">
        <Sidebar userName="Shraddha" />

    <div className="project-dashboard__content">

      <Topbar
        title={displayName}
        onNewDeployment={() => navigate('/new-deployment')}
      />

      <main className="project-dashboard__main">

        {/* Breadcrumb */}
        <div className="project-breadcrumb">
          <span>Projects</span>
          <span>›</span>
          <strong>{displayName}</strong>
        </div>

        {/* Project Header */}
        <section className="project-header-card">

          <div className="project-header-left">

            <div className="project-avatar">
              D
            </div>

            <div className="project-title-area">

              <div className="project-title-row">

                <h1>{displayName}</h1>

                <span className="environment-badge">
                  Production
                </span>

                <span className="running-badge">
                  <span />
                  Running
                </span>

              </div>

              <p>
                https://demoshop.deployx.app
              </p>

            </div>

          </div>

          <div className="project-header-actions">

            <button
              type="button"
              className="project-open-btn"
              onClick={handleOpenApp}
            >
              <ExternalLink size={16} />
              Open App
            </button>

            <button
              type="button"
              className="project-redeploy-btn"
              onClick={handleRedeploy}
            >
              <Rocket size={16} />
              Redeploy
            </button>

            <button
              type="button"
              className="project-more-btn"
              aria-label="More options"
            >
              <MoreHorizontal size={18} />
            </button>

          </div>

        </section>

        {/* Tabs */}
        <nav className="project-tabs">

          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={
                activeTab === tab
                  ? 'project-tab project-tab--active'
                  : 'project-tab'
              }
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}

        </nav>

        {/* Only Overview for now */}
        {activeTab === 'Overview' ? (
          <>
            {/* Stats */}
            <section className="project-stats-grid">

              <div className="project-stat-card">

                <span className="project-stat-label">
                  HEALTH
                </span>

                <strong className="project-health-value">
                  <span />
                  Healthy
                </strong>

                <p>All services operational</p>

              </div>

              <div className="project-stat-card">

                <span className="project-stat-label">
                  VERSION
                </span>

                <strong>v1.4.2</strong>

                <p>12 min ago</p>

              </div>

              <div className="project-stat-card">

                <span className="project-stat-label">
                  UPTIME
                </span>

                <strong>99.9%</strong>

                <p>Last 30 days</p>

              </div>

              <div className="project-stat-card">

                <span className="project-stat-label">
                  AVG RESPONSE
                </span>

                <strong>182ms</strong>

                <p>p95: 340ms</p>

              </div>

            </section>

            {/* Architecture + Services */}
            <section className="project-content-grid">

              {/* Architecture */}
              <div className="project-panel architecture-panel">

                <div className="project-panel-header">
                  Architecture
                </div>

                <div className="architecture-content">

                  <div className="architecture-node architecture-node--frontend">
                    <div className="architecture-node-icon">
                      R
                    </div>

                    <div>
                      <strong>React</strong>
                      <span>
                        Frontend · 2 instances
                      </span>
                    </div>
                  </div>

                  <div className="architecture-connector architecture-connector--blue">
                    <span />
                  </div>

                  <div className="architecture-node architecture-node--backend">
                    <div className="architecture-node-icon">
                      S
                    </div>

                    <div>
                      <strong>Spring Boot</strong>
                      <span>
                        Backend · 2 instances
                      </span>
                    </div>
                  </div>

                  <div className="architecture-connector architecture-connector--green">
                    <span />
                  </div>

                  <div className="architecture-node architecture-node--database">
                    <div className="architecture-node-icon">
                      P
                    </div>

                    <div>
                      <strong>PostgreSQL</strong>
                      <span>
                        Database · 1 replica
                      </span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Services */}
              <div className="project-panel services-panel">

                <div className="project-panel-header">
                  Services
                </div>

                <div className="service-list">

                  {/* Frontend */}
                  <div className="service-row">

                    <div className="service-main">

                      <div className="service-icon">
                        F
                      </div>

                      <div>
                        <strong>Frontend</strong>
                        <span>
                          React · 2 replicas
                        </span>
                      </div>

                    </div>

                    <div className="service-metrics">
                      <span>CPU 38%</span>
                      <span>MEM 210Mi</span>
                    </div>

                    <span className="service-health">
                      <span />
                      Healthy
                    </span>

                  </div>

                  {/* Backend */}
                  <div className="service-row">

                    <div className="service-main">

                      <div className="service-icon">
                        B
                      </div>

                      <div>
                        <strong>Backend</strong>
                        <span>
                          Spring Boot · 2 replicas
                        </span>
                      </div>

                    </div>

                    <div className="service-metrics">
                      <span>CPU 62%</span>
                      <span>MEM 380Mi</span>
                    </div>

                    <span className="service-health">
                      <span />
                      Healthy
                    </span>

                  </div>

                  {/* PostgreSQL */}
                  <div className="service-row">

                    <div className="service-main">

                      <div className="service-icon">
                        P
                      </div>

                      <div>
                        <strong>PostgreSQL</strong>
                        <span>
                          Database · 1 replica
                        </span>
                      </div>

                    </div>

                    <div className="service-metrics">
                      <span>CPU 12%</span>
                      <span>MEM 128Mi</span>
                    </div>

                    <span className="service-health">
                      <span />
                      Healthy
                    </span>

                  </div>

                </div>

                {/* Usage */}
                <div className="service-usage">

                  <div className="usage-item">

                    <div className="usage-label">
                      <span>CPU</span>
                      <strong>62%</strong>
                    </div>

                    <div className="usage-track">
                      <div
                        className="usage-fill"
                        style={{ width: '62%' }}
                      />
                    </div>

                  </div>

                  <div className="usage-item">

                    <div className="usage-label">
                      <span>Memory</span>
                      <strong>48%</strong>
                    </div>

                    <div className="usage-track">
                      <div
                        className="usage-fill"
                        style={{ width: '48%' }}
                      />
                    </div>

                  </div>

                </div>

              </div>

            </section>
          </>
        ) : (
          <div className="project-tab-placeholder">
            <h2>{activeTab}</h2>
            <p>
              This section will be built next.
            </p>
          </div>
        )}

      </main>
        </div>
      {/* Success Toast */}
      {showToast && (
        <div className="project-success-toast">

          <div className="toast-check">
            <Check size={17} />
          </div>

          <span>
            {displayName} deployed successfully!
          </span>

          <button
            type="button"
            onClick={() => setShowToast(false)}
            aria-label="Close notification"
          >
            ×
          </button>

        </div>
      )}

    </div>
  )
}