// Dev: empty (Vite proxy handles it). Prod: set VITE_API_URL build env var.
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

// Auth token lives in localStorage and is sent as a Bearer header rather than
// a cookie: the web app and API are on different origins in prod, and a
// cross-site cookie gets blocked by incognito / Safari ITP / third-party rules.
const TOKEN_KEY = 'worklogr_auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

function buildHeaders(json: boolean): HeadersInit {
  const h: Record<string, string> = {}
  if (json) h['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

async function handleResponse(res: Response) {
  if (res.ok) {
    const text = await res.text()
    return text ? JSON.parse(text) : null
  }
  const error = await res.json().catch(() => ({ message: 'Request failed' }))
  throw createApiError(res.status, error.message ?? 'Request failed')
}

export type ApiError = Error & { status: number }

export function isApiError(e: unknown): e is ApiError {
  return e instanceof Error && 'status' in e
}

export function createApiError(status: number, message: string): ApiError {
  const err = new Error(message) as ApiError
  err.status = status
  return err
}

export const api = {
  get: (path: string) =>
    fetch(`${BASE_URL}${path}`, { headers: buildHeaders(false) }).then(handleResponse),

  post: (path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: buildHeaders(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  put: (path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: buildHeaders(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  patch: (path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      headers: buildHeaders(body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  delete: (path: string) =>
    fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: buildHeaders(false) }).then(handleResponse),
}
