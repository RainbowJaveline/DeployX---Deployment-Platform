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
  Trash2,
  AlertTriangle,
} from 'lucide-react'

import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'
import { getDeploymentConfig, saveDeploymentConfig, createDeploymentDraftFromRepository } from '../utils/deploymentApi'
import { startDeployment } from '../utils/api'

import './ConfigureDeployment.css'

// ─── helpers ─────────────────────────────────────────────────────────────────

let _nextId = 1
function uid() {
  return `ev-${_nextId++}`
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
  if (config.envVars.some((v) => v.key.trim() && !v.value && !v.stored)) {
    errors.push('Enter a value for each new environment variable.')
  }
  const unique = new Set(keys)
  if (unique.size !== keys.length) {
    errors.push('Variable names must be unique.')
  }

  // CPU limit: e.g. 500m or 0.5
  if (!/^\d+(\.\d+)?m?$/.test(config.advanced.cpuLimit)) {
    errors.push('CPU limit must be like "500m" or "0.5".')
  }

  // Memory limit: e.g. 512Mi or 1Gi
  if (!/^\d+(\.\d+)?(Mi|Gi|Ki|M|G|K)$/.test(config.advanced.memoryLimit)) {
    errors.push('Memory limit must be like "512Mi" or "1Gi".')
  }

  const port = Number(config.advanced.applicationPort)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('Container port must be between 1 and 65535.')
  }
  const cpu = config.advanced.cpuLimit.endsWith('m')
    ? Number.parseFloat(config.advanced.cpuLimit) / 1000
    : Number.parseFloat(config.advanced.cpuLimit)
  if (!Number.isFinite(cpu) || cpu < 0.1 || cpu > 4) {
    errors.push('Local Docker deployments support 0.1 to 4 CPU cores.')
  }
  const memory = config.advanced.memoryLimit.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|K|M|G)?$/)
  let memoryMb = memory ? Number.parseFloat(memory[1]) : 0
  if (memory?.[2] === 'Gi' || memory?.[2] === 'G') memoryMb *= 1024
  if (memory?.[2] === 'Ki' || memory?.[2] === 'K') memoryMb /= 1024
  if (!memory || memoryMb < 128 || memoryMb > 4096) {
    errors.push('Local Docker deployments support 128 to 4096 MB of memory.')
  }
  if (!advancedHealthPathIsValid(config.advanced.healthCheckPath)) {
    errors.push('Health check path must start with / and be a local path.')
  }

  return errors
}

function advancedHealthPathIsValid(path) {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !path.includes('..')
}

// ─── component ───────────────────────────────────────────────────────────────

export default function ConfigureDeployment() {
  const location = useLocation()
  const navigate = useNavigate()

  const repositoryRequest = location.state?.repository
  const analysis = location.state?.analysis
  const [deploymentId, setDeploymentId] = useState(
    new URLSearchParams(location.search).get('deploymentId') || location.state?.deploymentId || ''
  )

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
    applicationPort: 8080,
    healthCheckPath: '/',
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
      let id = deploymentId
      if (!id) {
        if (!repositoryRequest) throw new Error('Repository details are missing. Start again from Repository Analysis.')
        const selectedComponent = analysis?.components?.[0]
        const runtime = selectedComponent?.type || analysis?.projectType || 'NODE'
        const applicationPort = runtime === 'NODE' || runtime === 'NODEJS' ? 3000 : 8080
        const draft = await createDeploymentDraftFromRepository({
          ...repositoryRequest,
          componentPath: selectedComponent?.path || null,
          buildConfig: {
            runtime,
            buildStrategy: 'AUTO',
            applicationPort,
            healthCheckPath: '/',
            cpuCores: 1,
            memoryMb: 512,
          },
        })
        id = draft.deploymentId
        setDeploymentId(id)
        navigate(`/configure-deployment?deploymentId=${id}`, {
          replace: true,
          state: { repository: repositoryRequest, analysis, deploymentId: id },
        })
      }
      const data = await getDeploymentConfig(id)
      const saved = data.configuration || {}
      const projectName = data.repositoryName || repositoryRequest?.repository || repositoryRequest?.repositoryUrl?.split('/').filter(Boolean).pop() || 'application'
      const runtime = data.buildConfig?.runtime || analysis?.components?.[0]?.type || data.projectType || analysis?.projectType || 'NODE'
      setAppName(saved.appName || projectName)
      setEnvironment(saved.environment || 'Production')
      setServices(saved.services || [])
      setEnvVars((data.environmentVariables || []).map((v) => ({
        id: uid(), key: v.name, value: '', secret: v.secret, stored: true,
      })).concat((saved.envVars || []).filter((v) => !(data.environmentVariables || []).some((stored) => stored.name === v.key))))
      setAdvanced(saved.advanced || {
        namespace: 'production', ingressHost: '', cpuLimit: '1', memoryLimit: '512Mi',
        applicationPort: data.buildConfig?.applicationPort || (runtime === 'NODE' || runtime === 'NODEJS' ? 3000 : 8080),
        healthCheckPath: data.buildConfig?.healthCheckPath || '/',
      })
    } catch (err) {
      setLoadError(err.message || 'Could not load configuration.')
    } finally {
      setLoading(false)
    }
  }, [analysis, deploymentId, navigate, repositoryRequest])

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
  // ── env vars ─────────────────────────────────────────────────────────────
  function updateVar(id, field, raw) {
    const value = field === 'key' ? raw.toUpperCase() : raw
    setEnvVars((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value, ...(field === 'key' || (field === 'value' && value) ? { stored: false } : {}) } : v))
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

  function buildBackendConfig() {
    const component = analysis?.components?.[0]
    const runtime = component?.type || analysis?.projectType || 'NODE'
    const cpuLimit = advanced.cpuLimit.endsWith('m')
      ? Number.parseFloat(advanced.cpuLimit) / 1000
      : Number.parseFloat(advanced.cpuLimit)
    const memoryMatch = advanced.memoryLimit.match(/^(\d+(?:\.\d+)?)(Ki|Mi|Gi|K|M|G)?$/)
    let memoryMb = memoryMatch ? Number.parseFloat(memoryMatch[1]) : 512
    const unit = memoryMatch?.[2] || 'Mi'
    if (unit === 'Gi' || unit === 'G') memoryMb *= 1024
    if (unit === 'Ki' || unit === 'K') memoryMb /= 1024
    return {
      configuration: { appName, environment, services, advanced },
      buildConfig: {
        runtime,
        buildStrategy: 'AUTO',
        applicationPort: Number(advanced.applicationPort),
        healthCheckPath: advanced.healthCheckPath || '/',
        cpuCores: Math.max(0.1, cpuLimit || 1),
        memoryMb: Math.max(128, Math.round(memoryMb)),
      },
      environmentVariables: envVars.map(({ key, value, secret, stored }) => ({
        name: key.trim(), value, secret: Boolean(secret), stored: Boolean(stored),
      })),
    }
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
      if (!deploymentId) throw new Error('Deployment draft has not been created yet.')
      await saveDeploymentConfig(deploymentId, buildBackendConfig())
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
      if (!deploymentId) throw new Error('Deployment draft has not been created yet.')
      await saveDeploymentConfig(deploymentId, buildBackendConfig())
      const deployment = await startDeployment(deploymentId)
      navigate(`/deployment-progress?deploymentId=${deploymentId}`, {
        state: { deploymentId, status: deployment.status, repository: repositoryRequest },
      })
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

            <div className="cd-advanced__note">
              <AlertTriangle size={14} aria-hidden="true" />
              Local Docker deploys the selected component: {analysis?.components?.[0]?.path || '.'} ({analysis?.components?.[0]?.type || analysis?.projectType || 'Unknown runtime'}).
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
                            placeholder={v.stored ? 'Saved securely; leave blank to keep it' : 'value'}
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
                    These settings configure the local container and health check.
                  </p>

                  <div className="cd-advanced__grid">
                    <div className="cd-field">
                      <label className="cd-field__label" htmlFor="cd-port">Container Port</label>
                      <input id="cd-port" className="cd-field__input cd-field__input--mono" type="number" min="1" max="65535" value={advanced.applicationPort} onChange={(e) => handleAdvancedChange('applicationPort', e.target.value)} />
                    </div>

                    <div className="cd-field">
                      <label className="cd-field__label" htmlFor="cd-health">Health Check Path</label>
                      <input id="cd-health" className="cd-field__input cd-field__input--mono" type="text" value={advanced.healthCheckPath} onChange={(e) => handleAdvancedChange('healthCheckPath', e.target.value)} />
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
              ✓ Configuration saved to DeployX.
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
