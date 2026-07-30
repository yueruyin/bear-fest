import { API_BASE_URL } from './api'

export function resolveMediaUrl(value: string | undefined | null) {
  if (!value) return ''
  if (value.startsWith('/uploads/')) return `${API_BASE_URL}${value}`
  return value
}
