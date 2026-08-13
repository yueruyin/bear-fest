import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { RequireAdminAuth } from './RequireAdminAuth'
import { setAdminToken } from './auth'

function renderProtectedRoute() {
  return render(
    <MemoryRouter
      initialEntries={['/admin/cases']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/admin/login" element={<div>登录页面</div>} />
        <Route
          path="/admin/cases"
          element={
            <RequireAdminAuth>
              <div>受保护内容</div>
            </RequireAdminAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAdminAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('redirects unauthenticated visitors to the login page', () => {
    renderProtectedRoute()

    expect(screen.getByText('登录页面')).toBeInTheDocument()
    expect(screen.queryByText('受保护内容')).not.toBeInTheDocument()
  })

  it('renders protected content when an admin token exists', () => {
    setAdminToken('test-token')

    renderProtectedRoute()

    expect(screen.getByText('受保护内容')).toBeInTheDocument()
  })
})
