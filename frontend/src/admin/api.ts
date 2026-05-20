import { API_BASE_URL } from '../api'
import { clearAdminToken, getAdminToken } from './auth'

export class AdminApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: string }
    if (data?.detail) return data.detail
  } catch {
    // ignore
  }
  return res.statusText || 'request failed'
}

export async function adminFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = getAdminToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.json !== undefined) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  })

  if (res.status === 401) {
    clearAdminToken()
    throw new AdminApiError(401, 'not authenticated')
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res))
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return (await res.text()) as T
}

export async function adminDownload(path: string, filename: string): Promise<void> {
  const token = getAdminToken()
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  if (res.status === 401) {
    clearAdminToken()
    throw new AdminApiError(401, 'not authenticated')
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res))
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
