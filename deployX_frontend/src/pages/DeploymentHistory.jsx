import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Circle, ExternalLink, Github, LoaderCircle, RotateCw, Search } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import { getDeploymentLogs, getDeploymentStatus, getMyDeployments, startDeployment, subscribeDeploymentLogs } from '../utils/api'
import { firstNameOf, getStoredName } from '../utils/user'
import './DeploymentHistory.css'

const stages = [
  { title: 'Repository cloned', status: 'CLONING' },
  { title: 'Image built', status: 'BUILDING' },
  { title: 'Container started', status: 'DEPLOYING' },
  { title: 'Health check passed', status: 'RUNNING' },
]
const stageIndex = { CLONING: 0, BUILDING: 1, DEPLOYING: 2, RUNNING: 3 }
const statusNames = {
  CREATED: 'Draft', CLONING: 'Cloning', BUILDING: 'Building', DEPLOYING: 'Starting',
  RUNNING: 'Running', FAILED: 'Failed', TERMINATED: 'Stopped',
}

function dateLabel(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const elapsed = Math.max(0, Date.now() - date.getTime())
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function durationLabel(item) {
  if (!item.startedAt) return '—'
  const start = new Date(item.startedAt).getTime()
  const end = item.finishedAt ? new Date(item.finishedAt).getTime() : Date.now()
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return '—'
  const seconds = Math.floor((end - start) / 1000)
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

function sameRepository(a, b) {
  return (a?.repositoryOwner || '').toLowerCase() === (b?.repositoryOwner || '').toLowerCase()
    && (a?.repositoryName || '').toLowerCase() === (b?.repositoryName || '').toLowerCase()
}

export default function DeploymentHistory() {
  const { deploymentId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [deployment, setDeployment] = useState(null)
  const [history, setHistory] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [logQuery, setLogQuery] = useState('')
  const firstName = firstNameOf(getStoredName()) || 'there'

  const refresh = useCallback(async () => {
    const [status, nextLogs, allDeployments] = await Promise.all([
      getDeploymentStatus(deploymentId),
      getDeploymentLogs(deploymentId),
      getMyDeployments(),
    ])
    setDeployment(status)
    setLogs(nextLogs)
    const related = allDeployments.filter((item) => sameRepository(item, status))
    if (!related.some((item) => item.deploymentId === status.deploymentId)) related.unshift(status)
    setHistory(related)
  }, [deploymentId])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([getDeploymentStatus(deploymentId), getDeploymentLogs(deploymentId), getMyDeployments()])
      .then(([status, nextLogs, allDeployments]) => {
        if (!active) return
        setDeployment(status)
        setLogs(nextLogs)
        const related = allDeployments.filter((item) => sameRepository(item, status))
        if (!related.some((item) => item.deploymentId === status.deploymentId)) related.unshift(status)
        setHistory(related)
      })
      .catch((err) => { if (active) setError(err.message || 'Could not load this deployment.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [deploymentId])

  useEffect(() => {
    if (!deploymentId || !deployment || ['RUNNING', 'FAILED', 'TERMINATED'].includes(deployment.status)) return undefined
    let disposed = false
    let fallbackTimer
    const poll = async () => {
      try {
        const [status, nextLogs, allDeployments] = await Promise.all([
          getDeploymentStatus(deploymentId), getDeploymentLogs(deploymentId), getMyDeployments(),
        ])
        if (disposed) return
        setDeployment(status)
        setLogs(nextLogs)
        const related = allDeployments.filter((item) => sameRepository(item, status))
        if (!related.some((item) => item.deploymentId === status.deploymentId)) related.unshift(status)
        setHistory(related)
        if (!['RUNNING', 'FAILED', 'TERMINATED'].includes(status.status)) fallbackTimer = setTimeout(poll, 3000)
      } catch (err) {
        if (!disposed) setError(err.message || 'Could not refresh deployment status.')
      }
    }
    const unsubscribe = subscribeDeploymentLogs(deploymentId, {
      onInit: ({ status, logs: initialLogs }) => {
        if (status) setDeployment(status)
        if (Array.isArray(initialLogs)) setLogs(initialLogs)
      },
      onLog: (log) => setLogs((previous) => [...previous, log]),
      onStatus: (nextStatus) => setDeployment(nextStatus),
      onComplete: () => {},
      onError: () => { if (!fallbackTimer) poll() },
    })
    return () => {
      disposed = true
      unsubscribe?.()
      if (fallbackTimer) clearTimeout(fallbackTimer)
    }
  }, [deploymentId, deployment?.status, retrying])

  const filteredLogs = useMemo(() => {
    const needle = logQuery.trim().toLowerCase()
    if (!needle) return logs
    return logs.filter((log) => `${log.level || ''} ${log.message || ''}`.toLowerCase().includes(needle))
  }, [logs, logQuery])

  const repoName = deployment?.repositoryName || location.state?.repository?.repository || 'Deployment'
  const status = deployment?.status || 'CREATED'
  const completedStage = status === 'RUNNING' ? 3 : stageIndex[status]
  const activeIndex = status === 'RUNNING' ? -1 : stageIndex[status]
  const failed = status === 'FAILED'
  const running = status === 'RUNNING'

  async function handleRetry() {
    setRetrying(true)
    setError('')
    try {
      const next = await startDeployment(deploymentId)
      setDeployment(next)
      await refresh()
    } catch (err) {
      setError(err.message || 'Could not retry this deployment.')
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="dashboard deployment-history-screen">
      <Sidebar userName={firstName} />
      <div className="dashboard__content">
        <Topbar title="Deployments" onNewDeployment={() => navigate('/new-deployment')} />
        <main className="dashboard__main deployment-history-main">
          <div className="history-breadcrumb"><Link to="/projects">Projects</Link><span>›</span><span>{repoName}</span><span>›</span><strong>Deployments</strong></div>
          <div className="history-heading">
            <div>
              <h1>Deployments</h1>
              <p>{repoName} <span>·</span> {deployment?.environment || 'Production'}</p>
            </div>
            {running && deployment?.applicationUrl ? (
              <a className="history-action-button" href={deployment.applicationUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Open app</a>
            ) : failed ? (
              <button type="button" className="history-action-button" onClick={handleRetry} disabled={retrying}><RotateCw size={15} /> {retrying ? 'Retrying…' : 'Retry deployment'}</button>
            ) : null}
          </div>

          {error && <div className="history-error" role="alert">{error}</div>}
          {loading ? <div className="history-loading"><span /> Loading deployment details…</div> : !deployment ? null : (
            <>
              <section className="history-pipeline-card">
                <div className="history-section-label">DEPLOYMENT LIFECYCLE <span className={`history-current-state history-current-state--${status.toLowerCase()}`}>{statusNames[status] || status}</span></div>
                <div className="history-pipeline" aria-label={`Deployment status: ${statusNames[status] || status}`}>
                  {stages.map((stage, index) => {
                    const complete = running || (completedStage !== undefined && index < completedStage)
                    const active = !failed && !running && index === activeIndex
                    return (
                      <div className={`history-stage${complete ? ' history-stage--complete' : ''}${active ? ' history-stage--active' : ''}${failed ? ' history-stage--unknown' : ''}`} key={stage.status}>
                        <span className="history-stage-icon">{complete ? <Check size={14} /> : active ? <LoaderCircle size={15} /> : <Circle size={14} />}</span>
                        <span className="history-stage-title">{stage.title}</span>
                      </div>
                    )
                  })}
                </div>
                {failed && <p className="history-pipeline-note">The worker failed during this attempt. Check the deployment logs to see the error.</p>}
              </section>

              <section className="history-table-card">
                <div className="history-table-title"><div><h2>Deployment history</h2><p>{history.length} {history.length === 1 ? 'attempt' : 'attempts'} for this repository</p></div><span className="history-repository"><Github size={14} /> {deployment.repositoryOwner ? `${deployment.repositoryOwner}/` : ''}{repoName}</span></div>
                <div className="history-table-wrap">
                  <div className="history-table history-table--header"><span>DEPLOYMENT</span><span>COMMIT</span><span>BRANCH</span><span>STATUS</span><span>DURATION</span><span>DEPLOYED</span><span /></div>
                  {history.map((item) => {
                    const itemStatus = item.status || 'CREATED'
                    const selected = item.deploymentId === deploymentId
                    return (
                      <div className={`history-table history-table--row${selected ? ' history-table--selected' : ''}`} key={item.deploymentId}>
                        <div><strong>{item.environment || 'Production'}</strong><small>{item.deploymentId.slice(0, 8)}</small></div>
                        <code>{item.commitHash ? item.commitHash.slice(0, 7) : '—'}</code>
                        <span className="history-branch">{item.branch || '—'}</span>
                        <span className={`history-status history-status--${itemStatus.toLowerCase()}`}><i />{statusNames[itemStatus] || itemStatus}</span>
                        <span>{durationLabel(item)}</span>
                        <span>{dateLabel(item.startedAt || item.createdAt)}</span>
                        <button type="button" className="history-row-action" onClick={() => navigate(`/deployments/${item.deploymentId}`, { state: location.state })}>{selected ? 'Logs' : 'View'}</button>
                      </div>
                    )
                  })}
                  {!history.length && <div className="history-no-rows">No deployment history is available for this repository.</div>}
                </div>
              </section>

              <section className="history-logs-card" id="deployment-logs">
                <div className="history-logs-heading"><div><span>WORKER OUTPUT</span><h2>Deployment logs</h2></div><label><Search size={14} /><input value={logQuery} onChange={(event) => setLogQuery(event.target.value)} placeholder="Filter logs" /></label></div>
                <div className="history-terminal">
                  <div className="history-terminal-bar"><span className="history-terminal-dots"><i /><i /><i /></span><span>deployment.log</span><span className={running ? 'history-terminal-done' : failed ? 'history-terminal-failed' : 'history-terminal-live'}><i />{statusNames[status] || status}</span></div>
                  <div className="history-terminal-body">
                    {filteredLogs.map((log, index) => (
                      <div className="history-log-line" key={`${log.timestamp || ''}-${index}`}>
                        <time>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</time>
                        <strong className={`history-log-level history-log-level--${(log.level || 'info').toLowerCase()}`}>{log.level || 'INFO'}</strong>
                        <span>{log.message}</span>
                      </div>
                    ))}
                    {!filteredLogs.length && <p>{logs.length ? 'No logs match your filter.' : 'No worker logs are available yet.'}</p>}
                  </div>
                </div>
              </section>

              <button type="button" className="history-back-link" onClick={() => navigate('/projects')}><ArrowLeft size={15} /> Back to projects</button>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
