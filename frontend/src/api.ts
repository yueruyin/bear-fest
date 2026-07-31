const configuredApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '')
  .trim()
  .replace(/\/+$/, '')

const developmentApiBaseUrl =
  typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://127.0.0.1:8000'

export const API_BASE_URL = configuredApiBaseUrl || (import.meta.env.DEV ? developmentApiBaseUrl : '')
