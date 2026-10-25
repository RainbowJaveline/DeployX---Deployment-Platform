import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Circle, ExternalLink } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import { getDeploymentLogs, getDeploymentStatus, startDeployment } from '../utils/api'
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

  const refresh = useCallback(async () => {
    if (!deploymentId) return
    try {
      const [status, nextLogs] = await Promise.all([
        getDeploymentStatus(deploymentId),
        getDeploymentLogs(deploymentId),
      ])
      setDeployment(status)
      setLogs(nextLogs)
      setError('')
      return status.status
    } catch (err) {
      setError(err.message || 'Could not load deployment progress.')
      return null
    }
  }, [deploymentId])

  useEffect(() => {
    if (!deploymentId) return undefined
    let cancelled = false
    let timer
    const poll = async () => {
      const status = await refresh()
      if (!cancelled && !terminalStatuses.has(status)) timer = setTimeout(poll, 2000)
    }
    poll()
    return () => { cancelled = true; clearTimeout(timer) }
  }, [deployment?.status, deploymentId, refresh])

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
              <h1>{running ? 'Deployment is running' : failed ? 'Deployment failed' : 'Deploying application'}</h1>
              <p>{repoName}</p>
            </div>

            <section className={`deployment-progress-card${running ? ' deployment-progress-card--complete' : ''}`} aria-live="polite">
              <div className={`deployment-circle${running ? ' deployment-circle--complete' : ''}`} style={{ '--progress': running ? '100%' : '35%' }}>
                <div className="deployment-circle-inner">
                  {running ? <Check size={32} /> : <Circle size={24} />}
                  <span>{status}</span>
                </div>
              </div>
              <div className="deployment-progress-info">
                <h2>{running ? 'Application passed its health check' : failed ? 'Worker reported an error' : 'Worker is processing the repository'}</h2>
                {deploymentId && <p>Deployment ID: <code>{deploymentId}</code></p>}
                {deployment?.applicationUrl && <p>Application URL: <a href={deployment.applicationUrl} target="_blank" rel="noreferrer">{deployment.applicationUrl}</a></p>}
                {deployment?.failureSummary && <p role="alert">{deployment.failureSummary}</p>}
                {running && deployment?.applicationUrl && (
                  <button type="button" className="open-app-btn" onClick={() => window.open(deployment.applicationUrl, '_blank', 'noopener,noreferrer')}>
                    <ExternalLink size={16} /> Open application
                  </button>
                )}
                {failed && (
                  <button type="button" className="view-dashboard-btn" disabled={retrying} onClick={async () => {
                    setRetrying(true)
                    setError('')
                    try {
                      await startDeployment(deploymentId)
                      await refresh()
                    } catch (err) {
                      setError(err.message || 'Could not retry this deployment.')
                    } finally {
                      setRetrying(false)
                    }
                  }}>{retrying ? 'Retrying…' : 'Retry deployment'}</button>
                )}
              </div>
            </section>

            {error && <p role="alert" className="cd-error-msg">{error}</p>}

            <div className="deployment-panel logs-panel">
              <div className="logs-header">
                <span className="logs-file">deployment.log</span>
                <span className={`logs-status${running ? ' logs-status--done' : ''}`}><span />{running ? 'Done' : failed ? 'Failed' : 'Live'}</span>
              </div>
              <div className="logs-content" aria-live="polite">
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
