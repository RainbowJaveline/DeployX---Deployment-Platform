// src/utils/deploymentApi.js
// All backend calls for the Configure Deployment page live here.
// When VITE_API_URL is not set (local dev without a backend), every function
// returns realistic mock data after a short fake delay so the UI still works.

const BASE_URL = import.meta.env.VITE_API_URL || ''

/** Returns the Authorization header if a token is stored, else an empty object. */
function authHeaders() {
  try {
    const token = localStorage.getItem('deployx_token')
    if (token) return { Authorization: `Bearer ${token}` }
  } catch {
    // localStorage might be unavailable in some sandboxed environments
  }
  return {}
}

/** Fake a network round-trip so loading states are visible in local dev. */
function mockDelay(ms = 600) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_CONFIG = {
  appName: 'demoshop',
  environment: 'Production',
  services: [
    {
      id: 'frontend',
      name: 'Frontend',
      tech: 'React',
      icon: 'cpu',
      kind: 'replicas',
      value: 2,
      min: 1,
      max: 10,
    },
    {
      id: 'backend',
      name: 'Backend',
      tech: 'Spring Boot',
      icon: 'server',
      kind: 'replicas',
      value: 2,
      min: 1,
      max: 10,
    },
    {
      id: 'database',
      name: 'Database',
      tech: 'PostgreSQL',
      icon: 'database',
      kind: 'storage',
      value: 5,
      min: 1,
      max: 500,
    },
  ],
  envVars: [
    { id: 'ev1', key: 'DATABASE_NAME', value: 'ecommerce', secret: false },
    { id: 'ev2', key: 'DATABASE_USER', value: 'postgres', secret: false },
    { id: 'ev3', key: 'DATABASE_PASSWORD', value: '', secret: true },
    { id: 'ev4', key: 'API_BASE_URL', value: 'https://api.demoshop.io', secret: false },
  ],
  advanced: {
    namespace: 'production',
    ingressHost: 'demoshop.io',
    cpuLimit: '500m',
    memoryLimit: '512Mi',
  },
}

// ---------------------------------------------------------------------------
// TODO(backend): GET /analysis/:id/config
// Fetch the deployment config that was generated from the repository analysis.
// ---------------------------------------------------------------------------
export async function getDeploymentConfig(analysisId) {
  if (!BASE_URL) {
    await mockDelay(700)
    // Return a deep clone so callers cannot mutate the constant
    return JSON.parse(JSON.stringify(MOCK_CONFIG))
  }

  const response = await fetch(`${BASE_URL}/analysis/${analysisId}/config`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to load config (${response.status})`)
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// TODO(backend): PUT /analysis/:id/config
// Persist the user-edited configuration without triggering a deployment.
// ---------------------------------------------------------------------------
export async function saveDeploymentConfig(analysisId, config) {
  if (!BASE_URL) {
    await mockDelay(500)
    return { ok: true }
  }

  const response = await fetch(`${BASE_URL}/analysis/${analysisId}/config`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    throw new Error(`Failed to save config (${response.status})`)
  }

  return response.json()
}

// ---------------------------------------------------------------------------
// TODO(backend): POST /deployments
// Create a new deployment and return { deploymentId }.
// ---------------------------------------------------------------------------
export async function createDeployment(config) {
  if (!BASE_URL) {
    await mockDelay(800)
    return { deploymentId: `deploy-${Date.now()}` }
  }

  const response = await fetch(`${BASE_URL}/deployments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(config),
  })

  if (!response.ok) {
    throw new Error(`Failed to create deployment (${response.status})`)
  }

  return response.json()
}
