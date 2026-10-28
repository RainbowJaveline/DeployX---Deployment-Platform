import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Github, Layers3, Plus, Search } from 'lucide-react'
import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import { getMyDeployments } from '../utils/api'
import { firstNameOf, getStoredName } from '../utils/user'
import './Projects.css'

const statusLabels = {
  CREATED: 'Draft',
  CLONING: 'Deploying',
  BUILDING: 'Deploying',
  DEPLOYING: 'Deploying',
  RUNNING: 'Running',
  FAILED: 'Failed',
  TERMINATED: 'Stopped',
}

function timeAgo(value) {
  if (!value) return 'Recently'
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime())
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function Projects() {
  const navigate = useNavigate()
  const [deployments, setDeployments] = useState([])
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const firstName = firstNameOf(getStoredName()) || 'there'

  useEffect(() => {
    let active = true
    getMyDeployments()
      .then((items) => { if (active) setDeployments(items) })
      .catch((err) => { if (active) setError(err.message || 'Could not load your projects.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return deployments.filter((item) => {
      const label = statusLabels[item.status] || item.status || 'Unknown'
      const matchesStatus = statusFilter === 'All status' || label === statusFilter
      const searchable = `${item.repositoryName || ''} ${item.repositoryOwner || ''} ${item.projectType || ''}`.toLowerCase()
      return matchesStatus && (!needle || searchable.includes(needle))
    })
  }, [deployments, query, statusFilter])

  const runningCount = deployments.filter((item) => item.status === 'RUNNING').length
  const statusOptions = ['All status', 'Running', 'Deploying', 'Failed', 'Stopped']

  function openDeployment(item) {
    navigate(`/deployments/${item.deploymentId}`, {
      state: {
        deploymentId: item.deploymentId,
        status: item.status,
        repository: {
          repository: item.repositoryName,
          owner: item.repositoryOwner,
          repositoryUrl: item.repositoryUrl,
        },
      },
    })
  }

  return (
    <div className="dashboard projects-screen">
      <Sidebar userName={firstName} />
      <div className="dashboard__content">
        <Topbar title="Projects" onNewDeployment={() => navigate('/new-deployment')} />
        <main className="dashboard__main projects-main">
          <section className="projects-page">
            <div className="projects-page__heading">
              <div>
                <span className="projects-eyebrow">WORKSPACE</span>
                <h1>Projects</h1>
                <p>{deployments.length} {deployments.length === 1 ? 'project' : 'projects'} · {runningCount} running</p>
              </div>
              <button type="button" className="projects-new-button" onClick={() => navigate('/new-deployment')}>
                <Plus size={16} /> New Deployment
              </button>
            </div>

            <div className="projects-toolbar">
              <label className="projects-search">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects..." />
              </label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter projects by status">
                {statusOptions.map((option) => <option key={option}>{option}</option>)}
              </select>
            </div>

            {error && <div className="projects-message projects-message--error" role="alert">{error}</div>}
            {loading ? (
              <div className="projects-message"><span className="projects-spinner" /> Loading your projects…</div>
            ) : !error && filtered.length === 0 ? (
              <div className="projects-empty">
                <span><Layers3 size={22} /></span>
                <h2>{deployments.length ? 'No matching projects' : 'No deployments yet'}</h2>
                <p>{deployments.length ? 'Try a different search or status filter.' : 'Your deployments will appear here once you deploy a repository.'}</p>
                {!deployments.length && <button type="button" onClick={() => navigate('/new-deployment')}><Plus size={16} /> New Deployment</button>}
              </div>
            ) : (
              <div className="projects-list" aria-label="Your deployments">
                {filtered.map((item) => {
                  const name = item.repositoryName || 'Untitled project'
                  const status = statusLabels[item.status] || item.status || 'Unknown'
                  const initials = name.slice(0, 1).toUpperCase()
                  return (
                    <article className="project-list-card" key={item.deploymentId}>
                      <div className="project-list-avatar">{initials}</div>
                      <div className="project-list-main">
                        <div className="project-list-title">
                          <h2>{name}</h2>
                          <span className="project-list-environment">{item.environment || 'Production'}</span>
                        </div>
                        <div className="project-list-meta">
                          <Github size={14} />
                          <span>{item.repositoryOwner ? `${item.repositoryOwner}/` : ''}{name}</span>
                          {item.projectType && <><i /> <span>{item.projectType}</span></>}
                          {item.branch && <><i /> <span>{item.branch}</span></>}
                        </div>
                      </div>
                      <div className="project-list-version">
                        <strong>{item.commitHash ? item.commitHash.slice(0, 7) : '—'}</strong>
                        <span>{timeAgo(item.startedAt || item.createdAt)}</span>
                      </div>
                      <span className={`project-status-badge project-status-badge--${status.toLowerCase()}`}>
                        <i />{status}
                      </span>
                      <button type="button" className="project-view-button" onClick={() => openDeployment(item)}>
                        View <ArrowUpRight size={14} />
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
