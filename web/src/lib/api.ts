const BASE_URL = ''  // proxied via Vite to http://localhost:5059

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
    fetch(`${BASE_URL}${path}`, { credentials: 'include' }).then(handleResponse),

  post: (path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  put: (path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  patch: (path: string, body?: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then(handleResponse),

  delete: (path: string) =>
    fetch(`${BASE_URL}${path}`, { method: 'DELETE', credentials: 'include' }).then(handleResponse),
}
