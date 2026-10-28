import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Activity, Circle, CircleCheck, ExternalLink, Rocket } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import { getDeploymentLogs, getDeploymentStatus, startDeployment, subscribeDeploymentLogs } from '../utils/api'
import './DeploymentProgress.css'

const terminalStatuses = new Set(['RUNNING', 'FAILED', 'TERMINATED'])

export default function DeploymentProgress() {
  const location = useLocation()
  const navigate = useNavigate()
  const deploymentId = location.state?.deploymentId || new URLSearchParams(location.search).get('deploymentId')
  const [deployment, setDeployment] = useState(null)
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const logsContainerRef = useRef(null)

  // Auto-scroll terminal logs to bottom when new lines stream in
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight
    }
  }, [logs])

  // Real-time log streaming using Server-Sent Events (SSE) with graceful fallback
  useEffect(() => {
    if (!deploymentId) return undefined

    let unsubscribe = null
    let fallbackTimer = null

    const fallbackPoll = async () => {
      try {
        const [status, nextLogs] = await Promise.all([
          getDeploymentStatus(deploymentId),
          getDeploymentLogs(deploymentId),
        ])
        setDeployment(status)
        setLogs(nextLogs)
        if (!terminalStatuses.has(status.status)) {
          fallbackTimer = setTimeout(fallbackPoll, 3000)
        }
      } catch (err) {
        setError(err.message || 'Could not load deployment progress.')
      }
    }

    unsubscribe = subscribeDeploymentLogs(deploymentId, {
      onInit: (data) => {
        if (data.status) setDeployment(data.status)
        if (Array.isArray(data.logs)) setLogs(data.logs)
        setError('')
      },
      onLog: (newLog) => {
        setLogs((prev) => [...prev, newLog])
      },
      onStatus: (newStatus) => {
        setDeployment(newStatus)
      },
      onComplete: () => {
        // Stream completed
      },
      onError: () => {
        if (!fallbackTimer) {
          fallbackPoll()
        }
      },
    })

    return () => {
      if (unsubscribe) unsubscribe()
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [deploymentId, retrying])

  const repoName = deployment?.repositoryName || location.state?.repository?.repository ||
    location.state?.repository?.repositoryUrl?.split('/').filter(Boolean).pop() || 'Repository'
  const status = deployment?.status || location.state?.status || 'QUEUED'
  const failed = status === 'FAILED'
  const running = status === 'RUNNING'

  return (
    <div className="dashboard">
      <Sidebar userName="there" />
      <div className="dashboard__content">
        <Topbar title="Deployment" onNewDeployment={() => navigate('/new-deployment')} />
        <main className="dashboard__main deployment-main">
          <section className="deployment-page">
            <div className="deployment-heading">
              <div className="deployment-heading__eyebrow">DEPLOYMENTS <span>/</span> {repoName}</div>
              <h1>{running ? 'Deployment complete' : failed ? 'Deployment failed' : 'Deploying application'}</h1>
              <p>Deployment activity and application details</p>
            </div>

            <section className={`deployment-progress-card${running ? ' deployment-progress-card--complete' : ''}${failed ? ' deployment-progress-card--failed' : ''}`} aria-live="polite">
              <div className={`deployment-circle${running ? ' deployment-circle--complete' : ''}`} style={{ '--progress': running ? '100%' : '35%' }}>
                <div className="deployment-circle-inner">
                  {running ? <strong>100%</strong> : failed ? <Circle size={24} /> : <Activity size={25} />}
                  <span>{running ? 'COMPLETE' : failed ? 'FAILED' : status}</span>
                </div>
              </div>
              <div className="deployment-progress-info">
                <div className="deployment-status-label"><span className={running ? 'is-complete' : failed ? 'is-failed' : 'is-active'} />{running ? 'HEALTH CHECK PASSED' : failed ? 'ACTION REQUIRED' : 'DEPLOYMENT IN PROGRESS'}</div>
                <h2>{running ? 'Your application is up and running' : failed ? 'The deployment could not be completed' : 'Preparing your application'}</h2>
                <p className="deployment-progress-copy">{running ? 'The application responded successfully to its health check.' : failed ? 'Review the worker output below for details, then retry after resolving the issue.' : 'Your repository is being prepared, built, and started by the deployment worker.'}</p>
                <div className="deployment-meta-row">
                  {deploymentId && <div className="deployment-meta"><span>DEPLOYMENT ID</span><code>{deploymentId}</code></div>}
                  {deployment?.applicationUrl && <div className="deployment-meta"><span>APPLICATION URL</span><a href={deployment.applicationUrl} target="_blank" rel="noreferrer">{deployment.applicationUrl}</a></div>}
                </div>
                {deployment?.failureSummary && <p role="alert" className="deployment-failure-summary">{deployment.failureSummary}</p>}
                {failed && (
                  <button type="button" className="view-dashboard-btn" disabled={retrying} onClick={async () => {
                    setRetrying(true)
                    setError('')
                    setLogs([])
                    try {
                      await startDeployment(deploymentId)
                    } catch (err) {
                      setError(err.message || 'Could not retry this deployment.')
                    } finally {
                      setRetrying(false)
                    }
                  }}>{retrying ? 'Retrying…' : 'Retry deployment'}</button>
                )}
              </div>
            </section>

            {running && deployment?.applicationUrl && (
              <section className="deployment-live-card" aria-label="Application is live">
                <div className="deployment-live-icon"><CircleCheck size={28} /></div>
                <div className="deployment-live-info">
                  <h2>Your application is live <Rocket size={16} /></h2>
                  <p>{deployment.applicationUrl}</p>
                </div>
                <div className="deployment-live-actions">
                  <button type="button" className="open-app-btn" onClick={() => window.open(deployment.applicationUrl, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink size={16} /> Open application
                  </button>
                </div>
              </section>
            )}

            {error && <p role="alert" className="cd-error-msg">{error}</p>}

            <div className="deployment-logs-heading">
              <div><span>WORKER OUTPUT</span><h2>Deployment logs</h2></div>
              <span className={`logs-status${running ? ' logs-status--done' : ''}`}><span />{running ? 'Complete' : failed ? 'Failed' : 'Streaming'}</span>
            </div>
            <div className="deployment-panel logs-panel">
              <div className="logs-header">
                <div className="terminal-controls" aria-hidden="true"><i className="terminal-dot terminal-dot--red" /><i className="terminal-dot terminal-dot--yellow" /><i className="terminal-dot terminal-dot--green" /></div>
                <span className="logs-file">deployment.log</span>
              </div>
              <div className="logs-content" aria-live="polite" ref={logsContainerRef}>
                {logs.map((log, index) => (
                  <div className="log-line" key={`${log.timestamp}-${index}`}>
                    <span className="log-time">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                    <span className={`log-type${log.level === 'SUCCESS' ? ' log-type--success' : ''}`}>{log.level}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))}
                {!logs.length && <span>Waiting for worker logs…</span>}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
