import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Circle, ExternalLink } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import './DeploymentProgress.css'

const deploymentSteps = [
  'Repository cloned',
  'Project analyzed',
  'Dockerfiles generated',
  'Frontend image built',
  'Backend image built',
  'Images pushed to registry',
  'Kubernetes config generated',
  'Deploying to Kubernetes',
  'Running health checks',
  'Deployment complete',
]

const stageLogs = [
  {
    time: '14:33:42',
    type: 'INFO',
    message: 'Cloning repository github.com/alex/demoshop...',
  },
  {
    time: '14:33:51',
    type: 'SUCCESS',
    message: 'Repository cloned successfully',
  },
  {
    time: '14:34:02',
    type: 'INFO',
    message: 'Analyzing project structure...',
  },
  {
    time: '14:34:10',
    type: 'SUCCESS',
    message: 'React frontend detected',
  },
  {
    time: '14:34:12',
    type: 'SUCCESS',
    message: 'Spring Boot backend detected',
  },
  {
    time: '14:34:15',
    type: 'INFO',
    message: 'Generating Dockerfiles...',
  },
  {
    time: '14:34:18',
    type: 'SUCCESS',
    message: 'Frontend image built successfully',
  },
  {
    time: '14:34:20',
    type: 'SUCCESS',
    message: 'Backend image built successfully',
  },
  {
    time: '14:34:22',
    type: 'SUCCESS',
    message: 'All images pushed successfully',
  },
  {
    time: '14:34:26',
    type: 'INFO',
    message: 'Generating Kubernetes configuration...',
  },
  {
    time: '14:34:30',
    type: 'INFO',
    message: 'Applying manifests to cluster namespace: production',
  },
  {
    time: '14:34:38',
    type: 'INFO',
    message: 'Waiting for pods to become ready...',
  },
  {
    time: '14:34:45',
    type: 'SUCCESS',
    message: 'frontend-deployment: 2/2 pods running',
  },
  {
    time: '14:35:00',
    type: 'SUCCESS',
    message: 'backend-deployment: 2/2 pods running',
  },
  {
    time: '14:35:10',
    type: 'INFO',
    message: 'Running health checks on all services...',
  },
  {
    time: '14:35:20',
    type: 'SUCCESS',
    message: 'All health checks passed',
  },
  {
    time: '14:35:21',
    type: 'SUCCESS',
    message: '🚀 Deployment complete — https://demoshop.deployx.app',
  },
]

export default function DeploymentProgress() {
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

  // 0 = just started
  // 1 = 10%
  // 2 = 20%
  // ...
  // 10 = 100%
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setStage((previousStage) => {
        if (previousStage >= 10) {
          clearInterval(timer)
          return 10
        }

        return previousStage + 1
      })
    }, 850)

    return () => clearInterval(timer)
  }, [])

  const completed = stage === 10
  const progress = stage * 10

  /*
    At 0%:
      0 completed
      step 0 active

    At 10%:
      step 0 completed
      step 1 active

    ...

    At 90%:
      first 9 completed
      final step active

    At 100%:
      all 10 completed
  */
  const completedSteps = completed ? 10 : stage

  const activeStep =
    completed ? -1 : Math.min(stage, deploymentSteps.length - 1)

  // Show more log lines as deployment progresses
  const visibleLogCount = Math.min(
    stageLogs.length,
    Math.max(2, Math.floor(stage * 1.7) + 2)
  )

  const visibleLogs = stageLogs.slice(0, visibleLogCount)

  return (
    <div className="dashboard">
      <Sidebar userName="Shraddha" />

      <div className="dashboard__content">
        <Topbar
          title={`Deploying ${displayName}`}
          onNewDeployment={() => navigate('/new-deployment')}
        />

        <main className="dashboard__main deployment-main">
          <section className="deployment-page">

            {/* Breadcrumb */}
            <div className="deployment-breadcrumb">
              <span>Projects</span>
              <span>›</span>
              <span>{displayName}</span>
              <span>›</span>
              <strong>Deploy</strong>
            </div>

            {/* Heading */}
            <div className="deployment-heading">
              <h1>Deploying {displayName}</h1>
              <p>Production · v1.4.2</p>
            </div>

            {/* Main progress card */}
            <div
              className={`deployment-progress-card ${
                completed
                  ? 'deployment-progress-card--complete'
                  : ''
              }`}
            >
              {/* Circular progress */}
              <div
                className={`deployment-circle ${
                  completed
                    ? 'deployment-circle--complete'
                    : ''
                }`}
                style={{
                  '--progress': `${progress * 3.6}deg`,
                }}
              >
                <div className="deployment-circle-inner">
                  <strong>{progress}%</strong>
                  <span>
                    {completed ? 'Complete' : 'Deploying'}
                  </span>
                </div>
              </div>

              {/* Right side */}
              <div className="deployment-progress-info">

                <div className="deployment-progress-title">
                  <h2>
                    {completed
                      ? '✓ Deployment complete'
                      : 'Deployment in progress...'}
                  </h2>

                  <span>
                    {completedSteps}/10 steps
                  </span>
                </div>

                {/* Horizontal progress */}
                <div className="deployment-progress-track">
                  <div
                    className="deployment-progress-fill"
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                {/* Current operation */}
                {!completed && (
                  <div className="deployment-current-step">
                    <span>•</span>

                    <strong>
                      {deploymentSteps[activeStep]}...
                    </strong>
                  </div>
                )}
              </div>
            </div>

            {/* Application live card */}
            {completed && (
              <div className="deployment-live-card">
                <div className="deployment-live-icon">
                  <Check size={25} />
                </div>

                <div className="deployment-live-info">
                  <h2>
                    Your application is live 🚀
                  </h2>

                  <p>
                    https://demoshop.deployx.app
                  </p>
                </div>

                <div className="deployment-live-actions">
                  <button
                    type="button"
                    className="open-app-btn"
                    onClick={() =>
                      window.open(
                        'https://demoshop.deployx.app',
                        '_blank'
                      )
                    }
                  >
                    <ExternalLink size={16} />
                    Open App
                  </button>

                  <button
                    type="button"
                    className="view-dashboard-btn"
                    onClick={() =>
                      navigate('/project-dashboard', {
                        state: {
                          repository,
                        },
                      })
                    }
                  >
                    View Dashboard
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pipeline + Logs */}
            <div className="deployment-lower-grid">

              {/* Pipeline */}
              <div className="deployment-panel pipeline-panel">
                <div className="deployment-panel-title">
                  PIPELINE
                </div>

                <div className="pipeline-list">
                  {deploymentSteps.map((step, index) => {
                    const isComplete =
                      index < completedSteps

                    const isCurrent =
                      index === activeStep

                    return (
                      <div
                        className={`pipeline-item ${
                          isComplete
                            ? 'pipeline-item--complete'
                            : ''
                        } ${
                          isCurrent
                            ? 'pipeline-item--current'
                            : ''
                        }`}
                        key={step}
                      >
                        <div className="pipeline-icon">
                          {isComplete ? (
                            <Check size={14} />
                          ) : isCurrent ? (
                            <Circle
                              size={10}
                              className="pipeline-active-dot"
                            />
                          ) : (
                            <Circle size={9} />
                          )}
                        </div>

                        <span>{step}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Logs */}
              <div className="deployment-panel logs-panel">

                <div className="logs-header">
                  <div className="terminal-controls">
                    <span className="terminal-dot terminal-dot--red" />
                    <span className="terminal-dot terminal-dot--yellow" />
                    <span className="terminal-dot terminal-dot--green" />
                  </div>

                  <span className="logs-file">
                    deployment.log
                  </span>

                  <span
                    className={`logs-status ${
                      completed
                        ? 'logs-status--done'
                        : ''
                    }`}
                  >
                    <span />
                    {completed ? 'Done' : 'Live'}
                  </span>
                </div>

                <div className="logs-content">
                  {visibleLogs.map((log, index) => (
                    <div
                      className="log-line"
                      key={`${log.time}-${index}`}
                    >
                      <span className="log-time">
                        {log.time}
                      </span>

                      <span
                        className={`log-type ${
                          log.type === 'SUCCESS'
                            ? 'log-type--success'
                            : ''
                        }`}
                      >
                        {log.type}
                      </span>

                      <span className="log-message">
                        {log.message}
                      </span>
                    </div>
                  ))}

                  {!completed && (
                    <span className="log-cursor">
                      ▌
                    </span>
                  )}
                </div>
              </div>

            </div>
          </section>
        </main>
      </div>
    </div>
  )
}