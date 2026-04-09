import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAdminToken } from './auth'

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const token = getAdminToken()
  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

