const defaultApiHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${defaultApiHost}:8000`
