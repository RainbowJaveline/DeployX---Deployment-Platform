export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8082/api/v1.0"
).replace(/\/$/, "")
const pendingAnalysisRequests = new Map()

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  const headers = new Headers(options.headers || {})

  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    const csrfResponse = await fetch(`${API_BASE_URL}/csrf`, { credentials: "include" })
    if (!csrfResponse.ok) throw new Error('Could not initialize CSRF protection. Refresh the page and try again.')
    const csrfCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("DEPLOYX-XSRF-TOKEN="))
      ?.slice("DEPLOYX-XSRF-TOKEN=".length)
    const csrfToken = csrfCookie ? decodeURIComponent(csrfCookie) : null

    if (!csrfToken) throw new Error('Could not initialize CSRF protection. Refresh the page and try again.')
    headers.set("X-XSRF-TOKEN", csrfToken)
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: options.credentials || "include",
  })
}

export async function analyzeRepository(repository) {
  const key = JSON.stringify(repository)
  if (pendingAnalysisRequests.has(key)) return pendingAnalysisRequests.get(key)

  const request = (async () => {
    const response = await apiFetch('/deployment/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: key,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new Error(data.message || data.detail || 'Repository analysis failed.')
    }
    return data
  })()
  pendingAnalysisRequests.set(key, request)
  try {
    return await request
  } finally {
    pendingAnalysisRequests.delete(key)
  }
}

export async function createDeployment(deployment) {
  const response = await apiFetch('/deployment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(deployment),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || data.detail || 'Could not create deployment.')
  }
  return data
}

export async function createDeploymentDraft(repository) {
  const response = await apiFetch('/deployment/draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(repository),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.detail || 'Could not create deployment draft.')
  return data
}

export async function getDeploymentConfiguration(deploymentId) {
  const response = await apiFetch(`/deployment/${deploymentId}/configuration`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.detail || 'Could not load deployment configuration.')
  return data
}

export async function saveDeploymentConfiguration(deploymentId, configuration) {
  const response = await apiFetch(`/deployment/${deploymentId}/configuration`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(configuration),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.detail || 'Could not save deployment configuration.')
  return data
}

export async function startDeployment(deploymentId) {
  const response = await apiFetch(`/deployment/${deploymentId}/start`, { method: 'POST' })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.detail || 'Could not start deployment.')
  return data
}

export async function getDeploymentStatus(deploymentId) {
  const response = await apiFetch(`/deployment/${deploymentId}/status`)
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message || data.detail || 'Could not load deployment status.')
  return data
}

export async function getDeploymentLogs(deploymentId) {
  const response = await apiFetch(`/deployment/${deploymentId}/logs`)
  const data = await response.json().catch(() => ([]))
  if (!response.ok) throw new Error(data.message || data.detail || 'Could not load deployment logs.')
  return data
}
