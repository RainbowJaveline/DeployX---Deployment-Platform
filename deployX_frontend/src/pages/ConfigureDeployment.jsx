import { useState } from 'react'
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
} from 'lucide-react'

import Sidebar from '../components/dashboard/Sidebar'
import Topbar from '../components/dashboard/Topbar'

import './ConfigureDeployment.css'

export default function ConfigureDeployment() {

  const location = useLocation()
  const navigate = useNavigate()

  const repository = location.state?.repository || {
    name: 'demoshop',
    owner: 'alex',
    url: 'https://github.com/alex/demoshop',
  }

  const [environment, setEnvironment] = useState('Production')

  const [frontendReplicas, setFrontendReplicas] = useState(2)
  const [backendReplicas, setBackendReplicas] = useState(2)
  const [databaseStorage, setDatabaseStorage] = useState(5)

  const [showPassword, setShowPassword] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const [variables, setVariables] = useState([
    {
      key: 'DATABASE_NAME',
      value: 'ecommerce',
      secret: false,
    },
    {
      key: 'DATABASE_USER',
      value: 'postgres',
      secret: false,
    },
    {
      key: 'DATABASE_PASSWORD',
      value: '',
      secret: true,
    },
    {
      key: 'API_BASE_URL',
      value: 'https://api.demoshop.io',
      secret: false,
    },
  ])

  const [showAddVariable, setShowAddVariable] = useState(false)
  const [newVariableKey, setNewVariableKey] = useState('')
  const [newVariableValue, setNewVariableValue] = useState('')

  const updateVariable = (index, field, value) => {
    setVariables((previous) =>
      previous.map((variable, variableIndex) =>
        variableIndex === index
          ? {
              ...variable,
              [field]: value,
            }
          : variable
      )
    )
  }

  const addVariable = () => {
    if (!newVariableKey.trim() || !newVariableValue.trim()) {
      return
    }

    setVariables((previous) => [
      ...previous,
      {
        key: newVariableKey.trim().toUpperCase(),
        value: newVariableValue,
        secret: false,
      },
    ])

    setNewVariableKey('')
    setNewVariableValue('')
    setShowAddVariable(false)
  }

  const handleSaveConfiguration = () => {
    alert('Configuration saved successfully.')
  }

  const handleDeploy = () => {
    navigate('/deployment-progress', {
      state: {
        repository,
        environment,
        frontendReplicas,
        backendReplicas,
        databaseStorage,
        variables,
      },
    })
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
        <section className="configure-deployment-page">

          {/* Breadcrumb */}
          <div className="configure-breadcrumb">
            <span>Projects</span>
            <span>›</span>
            <span>New Deployment</span>
            <span>›</span>
            <strong>Config</strong>
          </div>

          {/* Header */}
          <div className="configure-header">
            <div>
              <h2>Configure Deployment</h2>
              <p>
                Configure your infrastructure before deploying{' '}
                <strong>
                  {repository.owner}/{repository.name}
                </strong>
                .
              </p>
            </div>
          </div>

          {/* Environment */}
          <div className="environment-select-wrapper">
            <select
              value={environment}
              onChange={(event) =>
                setEnvironment(event.target.value)
              }
              className="environment-select"
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>

            <ChevronDown size={17} />
          </div>

          {/* Frontend */}
          <div className="resource-card">

            <div className="resource-info">
              <div className="resource-icon resource-icon--frontend">
                <Cpu size={21} />
              </div>

              <div>
                <h3>Frontend</h3>
                <p>React</p>
              </div>
            </div>

            <div className="resource-control">
              <span>Replicas</span>

              <button
                type="button"
                onClick={() =>
                  setFrontendReplicas(
                    Math.max(1, frontendReplicas - 1)
                  )
                }
              >
                <Minus size={15} />
              </button>

              <strong>{frontendReplicas}</strong>

              <button
                type="button"
                onClick={() =>
                  setFrontendReplicas(frontendReplicas + 1)
                }
              >
                <Plus size={15} />
              </button>
            </div>

          </div>

          {/* Backend */}
          <div className="resource-card">

            <div className="resource-info">
              <div className="resource-icon resource-icon--backend">
                <Server size={21} />
              </div>

              <div>
                <h3>Backend</h3>
                <p>Spring Boot</p>
              </div>
            </div>

            <div className="resource-control">
              <span>Replicas</span>

              <button
                type="button"
                onClick={() =>
                  setBackendReplicas(
                    Math.max(1, backendReplicas - 1)
                  )
                }
              >
                <Minus size={15} />
              </button>

              <strong>{backendReplicas}</strong>

              <button
                type="button"
                onClick={() =>
                  setBackendReplicas(backendReplicas + 1)
                }
              >
                <Plus size={15} />
              </button>
            </div>

          </div>

          {/* Database */}
          <div className="resource-card">

            <div className="resource-info">
              <div className="resource-icon resource-icon--database">
                <Database size={21} />
              </div>

              <div>
                <h3>Database</h3>
                <p>PostgreSQL</p>
              </div>
            </div>

            <div className="resource-control">
              <span>Storage</span>

              <button
                type="button"
                onClick={() =>
                  setDatabaseStorage(
                    Math.max(1, databaseStorage - 1)
                  )
                }
              >
                <Minus size={15} />
              </button>

              <strong>{databaseStorage}</strong>

              <button
                type="button"
                onClick={() =>
                  setDatabaseStorage(databaseStorage + 1)
                }
              >
                <Plus size={15} />
              </button>

              <span>GB</span>
            </div>

          </div>

          {/* Environment Variables */}
          <div className="environment-card">

            <div className="environment-card-header">

              <div>
                <h3>Environment Variables</h3>
              </div>

              <button
                type="button"
                className="add-variable-btn"
                onClick={() =>
                  setShowAddVariable(!showAddVariable)
                }
              >
                <Plus size={16} />
                Add variable
              </button>

            </div>

            {showAddVariable && (
              <div className="add-variable-form">

                <input
                  type="text"
                  placeholder="VARIABLE_NAME"
                  value={newVariableKey}
                  onChange={(event) =>
                    setNewVariableKey(event.target.value)
                  }
                />

                <input
                  type="text"
                  placeholder="Value"
                  value={newVariableValue}
                  onChange={(event) =>
                    setNewVariableValue(event.target.value)
                  }
                />

                <button
                  type="button"
                  onClick={addVariable}
                >
                  Add
                </button>

              </div>
            )}

            <div className="variables-list">

              {variables.map((variable, index) => (
                <div
                  className="variable-row"
                  key={`${variable.key}-${index}`}
                >

                  <input
                    className="variable-key"
                    value={variable.key}
                    onChange={(event) =>
                      updateVariable(
                        index,
                        'key',
                        event.target.value
                      )
                    }
                  />

                  <div className="variable-value-wrapper">

                    <input
                      className="variable-value"
                      type={
                        variable.secret && !showPassword
                          ? 'password'
                          : 'text'
                      }
                      value={variable.value}
                      onChange={(event) =>
                        updateVariable(
                          index,
                          'value',
                          event.target.value
                        )
                      }
                    />

                    {variable.secret && (
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    )}

                  </div>

                </div>
              ))}

            </div>

          </div>

          {/* Advanced Settings */}
          <div className="advanced-settings">

            <button
              type="button"
              className="advanced-settings-header"
              onClick={() =>
                setAdvancedOpen(!advancedOpen)
              }
            >
              <strong>Advanced Settings</strong>

              {advancedOpen ? (
                <ChevronUp size={17} />
              ) : (
                <ChevronDown size={17} />
              )}
            </button>

            {advancedOpen && (
              <div className="advanced-settings-content">

                <div className="advanced-row">
                  <div>
                    <strong>Auto Scaling</strong>
                    <span>
                      Automatically adjust replicas based on traffic.
                    </span>
                  </div>

                  <label className="toggle">
                    <input type="checkbox" />
                    <span></span>
                  </label>
                </div>

                <div className="advanced-row">
                  <div>
                    <strong>Health Checks</strong>
                    <span>
                      Monitor application health automatically.
                    </span>
                  </div>

                  <label className="toggle">
                    <input
                      type="checkbox"
                      defaultChecked
                    />
                    <span></span>
                  </label>
                </div>

              </div>
            )}

          </div>

          {/* Bottom Actions */}
          <div className="configure-actions">

            <button
              type="button"
              className="save-config-btn"
              onClick={handleSaveConfiguration}
            >
              Save Configuration
            </button>

            <button
              type="button"
              className="deploy-application-btn"
              onClick={handleDeploy}
            >
              <Rocket size={17} />
              Deploy Application
            </button>

          </div>

                </section>
      </main>
    </div>
  </div>
)}