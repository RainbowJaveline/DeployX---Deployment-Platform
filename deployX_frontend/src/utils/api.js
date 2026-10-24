export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8082/api/v1.0"
).replace(/\/$/, "")

export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase()
  const headers = new Headers(options.headers || {})

  if (!["GET", "HEAD", "OPTIONS", "TRACE"].includes(method)) {
    await fetch(`${API_BASE_URL}/csrf`, { credentials: "include" })
    const csrfCookie = document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith("XSRF-TOKEN="))
      ?.slice("XSRF-TOKEN=".length)

    if (csrfCookie) headers.set("X-XSRF-TOKEN", decodeURIComponent(csrfCookie))
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: options.credentials || "include",
  })
}
