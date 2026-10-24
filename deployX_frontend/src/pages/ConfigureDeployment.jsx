import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Minus,
  Plus,
  Rocket,
  Cpu,
  Server,
  Database,
  Trash2,
  AlertTriangle,
} from 'lucide-react'

import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import { getDeploymentConfig, saveDeploymentConfig, createDeployment } from '../utils/deploymentApi'

import './ConfigureDeployment.css'

// ─── helpers ─────────────────────────────────────────────────────────────────

let _nextId = 1
function uid() {
  return `ev-${_nextId++}`
}

const SERVICE_ICONS = {
  cpu: Cpu,
  server: Server,
  database: Database,
}

const ENV_NAMESPACES = {
  Production: 'production',
  Staging: 'staging',
  Development: 'development',
}

// ─── validation ──────────────────────────────────────────────────────────────

function validate(config) {
  const errors = []

  // Env vars: every key must be filled in and unique
  const keys = config.envVars.map((v) => v.key.trim())
  if (keys.some((k) => k === '')) {
    errors.push('Every variable must have a name.')
  }
  const unique = new Set(keys)
  if (unique.size !== keys.length) {
    errors.push('Variable names must be unique.')
  }

  // Namespace: lowercase letters, numbers, dashes only
  if (!/^[a-z0-9-]+$/.test(config.advanced.namespace)) {
    errors.push('Namespace may only contain lowercase letters, numbers, and dashes.')
  }

  // Ingress host: basic domain pattern
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(config.advanced.ingressHost)) {
    errors.push('Ingress host must look like a domain (e.g. demoshop.io).')
  }

  // CPU limit: e.g. 500m or 0.5
  if (!/^\d+(\.\d+)?m?$/.test(config.advanced.cpuLimit)) {
    errors.push('CPU limit must be like "500m" or "0.5".')
  }

  // Memory limit: e.g. 512Mi or 1Gi
  if (!/^\d+(\.\d+)?(Mi|Gi|Ki|M|G|K)$/.test(config.advanced.memoryLimit)) {
    errors.push('Memory limit must be like "512Mi" or "1Gi".')
  }

  return errors
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ConfigureDeployment() {
  const location = useLocation()
  const navigate = useNavigate()

  const analysisId = location.state?.analysisId || 'demo'

  // ── remote state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  // ── config state ─────────────────────────────────────────────────────────
  const [appName, setAppName] = useState('')
  const [environment, setEnvironment] = useState('Production')
  const [services, setServices] = useState([])
  const [envVars, setEnvVars] = useState([])
  const [advanced, setAdvanced] = useState({
    namespace: 'production',
    ingressHost: '',
    cpuLimit: '',
    memoryLimit: '',
  })

  // Track whether the user has manually edited the namespace
  const [namespaceEdited, setNamespaceEdited] = useState(false)

  // ── UI state ─────────────────────────────────────────────────────────────
  const [advancedOpen, setAdvancedOpen] = useState(true)
  const [revealedSecrets, setRevealedSecrets] = useState({}) // { [varId]: boolean }
  const [hoveredRow, setHoveredRow] = useState(null)

  // Status messages
  const [validationErrors, setValidationErrors] = useState([])
  const [saveStatus, setSaveStatus] = useState(null) // 'saving' | 'saved' | 'error'
  const [deployStatus, setDeployStatus] = useState(null) // 'deploying' | 'error'
  const [saveError, setSaveError] = useState(null)
  const [deployError, setDeployError] = useState(null)

  const isBusy = saveStatus === 'saving' || deployStatus === 'deploying'

  // ── load config on mount ─────────────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getDeploymentConfig(analysisId)
      setAppName(data.appName)
      setEnvironment(data.environment)
      setServices(data.services)
      setEnvVars(data.envVars.map((v) => ({ ...v, id: v.id || uid() })))
      setAdvanced(data.advanced)
    } catch (err) {
      setLoadError(err.message || 'Could not load configuration.')
    } finally {
      setLoading(false)
    }
  }, [analysisId])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  // ── environment → namespace sync ─────────────────────────────────────────
  useEffect(() => {
    if (!namespaceEdited) {
      setAdvanced((prev) => ({
        ...prev,
        namespace: ENV_NAMESPACES[environment] || environment.toLowerCase(),
      }))
    }
  }, [environment, namespaceEdited])

  // ── service stepper ──────────────────────────────────────────────────────
  function changeServiceValue(id, delta) {
    setServices((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, value: Math.min(s.max, Math.max(s.min, s.value + delta)) }
          : s
      )
    )
  }

  // ── env vars ─────────────────────────────────────────────────────────────
  function updateVar(id, field, raw) {
    const value = field === 'key' ? raw.toUpperCase() : raw
    setEnvVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    )
  }

  function removeVar(id) {
    setEnvVars((prev) => prev.filter((v) => v.id !== id))
  }

  function addVar() {
    setEnvVars((prev) => [
      ...prev,
      { id: uid(), key: '', value: '', secret: false },
    ])
  }

  function toggleReveal(id) {
    setRevealedSecrets((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // ── advanced fields ──────────────────────────────────────────────────────
  function handleAdvancedChange(field, value) {
    if (field === 'namespace') setNamespaceEdited(true)
    setAdvanced((prev) => ({ ...prev, [field]: value }))
  }

  // ── build config snapshot ─────────────────────────────────────────────────
  function buildConfig() {
    return { appName, environment, services, envVars, advanced }
  }

  // ── save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaveStatus(null)
    setSaveError(null)
    setDeployStatus(null)
    setDeployError(null)
    setValidationErrors([])

    const errors = validate(buildConfig())
    if (errors.length) {
      setValidationErrors(errors)
      return
    }

    setSaveStatus('saving')
    try {
      await saveDeploymentConfig(analysisId, buildConfig())
      setSaveStatus('saved')
    } catch (err) {
      setSaveStatus('error')
      setSaveError(err.message || 'Could not save configuration.')
    }
  }

  // ── deploy ────────────────────────────────────────────────────────────────
  async function handleDeploy() {
    setSaveStatus(null)
    setSaveError(null)
    setDeployStatus(null)
    setDeployError(null)
    setValidationErrors([])

    const errors = validate(buildConfig())
    if (errors.length) {
      setValidationErrors(errors)
      return
    }

    setDeployStatus('deploying')
    try {
      const { deploymentId } = await createDeployment(buildConfig())
      navigate('/deployment-progress', { state: { deploymentId } })
    } catch (err) {
      setDeployStatus('error')
      setDeployError(err.message || 'Could not start deployment.')
    }
  }

  // ─── render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="dashboard">
        <Sidebar userName="Shraddha" />
        <div className="dashboard__content">
          <Topbar title="Configure Deployment" onNewDeployment={() => navigate('/new-deployment')} />
          <main className="dashboard__main">
            <div className="cd-status-screen">
              <div className="cd-spinner" aria-label="Loading" />
              <p className="cd-status-text">Loading configuration…</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="dashboard">
        <Sidebar userName="Shraddha" />
        <div className="dashboard__content">
          <Topbar title="Configure Deployment" onNewDeployment={() => navigate('/new-deployment')} />
          <main className="dashboard__main">
            <div className="cd-status-screen">
              <AlertTriangle size={36} className="cd-error-icon" />
              <p className="cd-status-text cd-status-text--error">{loadError}</p>
              <button type="button" className="cd-retry-btn" onClick={loadConfig}>
                Try again
              </button>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <Sidebar userName="Shraddha" />

      <div className="dashboard__content">
        <Topbar
          title="Configure Deployment"
          onNewDeployment={() => navigate('/new-deployment')}
        />

        <main className="dashboard__main">
          <section className="cd-page">

            {/* Breadcrumb */}
            <nav className="cd-breadcrumb" aria-label="Page path">
              <span>Projects</span>
              <span className="cd-breadcrumb__sep">›</span>
              <span>New Deployment</span>
              <span className="cd-breadcrumb__sep">›</span>
              <strong>Config</strong>
            </nav>

            {/* Header */}
            <div className="cd-header">
              <h1 className="cd-header__title">Configure your deployment</h1>
              <p className="cd-header__sub">
                Application:{' '}
                <span className="cd-header__app">{appName}</span>
              </p>
            </div>

            {/* Environment dropdown */}
            <div className="cd-env-wrapper">
              <label htmlFor="cd-env-select" className="cd-env-label">
                Environment
              </label>
              <div className="cd-env-select-box">
                <select
                  id="cd-env-select"
                  className="cd-env-select"
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                >
                  <option value="Production">Production</option>
                  <option value="Staging">Staging</option>
                  <option value="Development">Development</option>
                </select>
                <ChevronDown size={16} className="cd-env-chevron" aria-hidden="true" />
              </div>
            </div>

            {/* Service cards */}
            <div className="cd-services">
              {services.map((svc) => {
                const Icon = SERVICE_ICONS[svc.icon] || Server
                const atMin = svc.value <= svc.min
                const atMax = svc.value >= svc.max
                const unit = svc.kind === 'storage' ? 'GB' : 'Replicas'
                return (
                  <div key={svc.id} className={`cd-service-card cd-service-card--${svc.id}`}>
                    <div className="cd-service-info">
                      <div className={`cd-service-icon cd-service-icon--${svc.id}`} aria-hidden="true">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h2 className="cd-service-name">{svc.name}</h2>
                        <p className="cd-service-tech">{svc.tech}</p>
                      </div>
                    </div>

                    <div className="cd-stepper">
                      <span className="cd-stepper__label">{unit}</span>
                      <button
                        type="button"
                        className="cd-stepper__btn"
                        aria-label={`Decrease ${svc.name} ${unit}`}
                        disabled={atMin}
                        onClick={() => changeServiceValue(svc.id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cd-stepper__value">{svc.value}</span>
                      <button
                        type="button"
                        className="cd-stepper__btn"
                        aria-label={`Increase ${svc.name} ${unit}`}
                        disabled={atMax}
                        onClick={() => changeServiceValue(svc.id, +1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Environment Variables */}
            <div className="cd-env-card">
              <div className="cd-env-card__header">
                <h2 className="cd-env-card__title">Environment Variables</h2>
                <button
                  type="button"
                  className="cd-add-var-btn"
                  onClick={addVar}
                  aria-label="Add environment variable"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add variable
                </button>
              </div>

              <div className="cd-vars-list" role="list">
                {envVars.map((v) => {
                  const isRevealed = revealedSecrets[v.id]
                  return (
                    <div
                      key={v.id}
                      className="cd-var-row"
                      role="listitem"
                      onMouseEnter={() => setHoveredRow(v.id)}
                      onMouseLeave={() => setHoveredRow(null)}
                    >
                      <label className="cd-var-key-label" htmlFor={`vk-${v.id}`}>
                        <span className="cd-sr-only">Variable name</span>
                        <input
                          id={`vk-${v.id}`}
                          className="cd-var-key"
                          type="text"
                          value={v.key}
                          placeholder="VARIABLE_NAME"
                          onChange={(e) => updateVar(v.id, 'key', e.target.value)}
                        />
                      </label>

                      <div className="cd-var-val-wrapper">
                        <label className="cd-var-val-label" htmlFor={`vv-${v.id}`}>
                          <span className="cd-sr-only">Variable value</span>
                          <input
                            id={`vv-${v.id}`}
                            className="cd-var-val"
                            type={v.secret && !isRevealed ? 'password' : 'text'}
                            value={v.value}
                            placeholder="value"
                            onChange={(e) => updateVar(v.id, 'value', e.target.value)}
                          />
                        </label>

                        {v.secret && (
                          <button
                            type="button"
                            className="cd-eye-btn"
                            aria-label={isRevealed ? 'Hide value' : 'Show value'}
                            onClick={() => toggleReveal(v.id)}
                          >
                            {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        className={`cd-remove-btn${hoveredRow === v.id ? ' cd-remove-btn--visible' : ''}`}
                        aria-label={`Remove variable ${v.key || 'row'}`}
                        onClick={() => removeVar(v.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="cd-advanced">
              <button
                type="button"
                className="cd-advanced__toggle"
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((o) => !o)}
              >
                <span className="cd-advanced__toggle-label">Advanced Settings</span>
                {advancedOpen
                  ? <ChevronUp size={16} aria-hidden="true" />
                  : <ChevronDown size={16} aria-hidden="true" />
                }
              </button>

              {advancedOpen && (
                <div className="cd-advanced__body">
                  <p className="cd-advanced__note">
                    <AlertTriangle size={14} aria-hidden="true" />
                    These settings configure Kubernetes resource limits and deployment behavior.
                  </p>

                  <div className="cd-advanced__grid">
                    <div className="cd-field">
                      <label className="cd-field__label" htmlFor="cd-namespace">
                        Kubernetes Namespace
                      </label>
                      <input
                        id="cd-namespace"
                        className="cd-field__input cd-field__input--mono"
                        type="text"
                        value={advanced.namespace}
                        onChange={(e) => handleAdvancedChange('namespace', e.target.value)}
                      />
                    </div>

                    <div className="cd-field">
                      <label className="cd-field__label" htmlFor="cd-ingress">
                        Ingress Host
                      </label>
                      <input
                        id="cd-ingress"
                        className="cd-field__input cd-field__input--mono"
                        type="text"
                        value={advanced.ingressHost}
                        onChange={(e) => handleAdvancedChange('ingressHost', e.target.value)}
                      />
                    </div>

                    <div className="cd-field">
                      <label className="cd-field__label" htmlFor="cd-cpu">
                        CPU Limit
                      </label>
                      <input
                        id="cd-cpu"
                        className="cd-field__input cd-field__input--mono"
                        type="text"
                        placeholder="500m"
                        value={advanced.cpuLimit}
                        onChange={(e) => handleAdvancedChange('cpuLimit', e.target.value)}
                      />
                    </div>

                    <div className="cd-field">
                      <label className="cd-field__label" htmlFor="cd-memory">
                        Memory Limit
                      </label>
                      <input
                        id="cd-memory"
                        className="cd-field__input cd-field__input--mono"
                        type="text"
                        placeholder="512Mi"
                        value={advanced.memoryLimit}
                        onChange={(e) => handleAdvancedChange('memoryLimit', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Validation errors */}
            {validationErrors.length > 0 && (
              <div className="cd-validation-errors" role="alert">
                {validationErrors.map((e, i) => (
                  <p key={i} className="cd-validation-errors__item">
                    <AlertTriangle size={13} aria-hidden="true" />
                    {e}
                  </p>
                ))}
              </div>
            )}

            {/* Save success message */}
            {saveStatus === 'saved' && (
              <p className="cd-success-msg" role="status">
                ✓ Configuration saved.
              </p>
            )}

            {/* Save / deploy error messages */}
            {saveStatus === 'error' && saveError && (
              <p className="cd-error-msg" role="alert">{saveError}</p>
            )}
            {deployStatus === 'error' && deployError && (
              <p className="cd-error-msg" role="alert">{deployError}</p>
            )}

            {/* Action buttons */}
            <div className="cd-actions">
              <button
                type="button"
                className="cd-btn cd-btn--outline"
                disabled={isBusy}
                onClick={handleSave}
              >
                {saveStatus === 'saving' ? 'Saving…' : 'Save Configuration'}
              </button>

              <button
                type="button"
                className="cd-btn cd-btn--primary"
                disabled={isBusy}
                onClick={handleDeploy}
              >
                <Rocket size={16} aria-hidden="true" />
                {deployStatus === 'deploying' ? 'Starting deployment…' : 'Deploy Application'}
              </button>
            </div>

          </section>
        </main>
      </div>
    </div>
  )
}