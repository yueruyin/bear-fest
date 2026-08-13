import { beforeEach, describe, expect, it } from 'vitest'
import { clearAdminToken, getAdminToken, setAdminToken } from './auth'

describe('admin token storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and reads the admin access token', () => {
    setAdminToken('test-token')

    expect(getAdminToken()).toBe('test-token')
  })

  it('clears the stored admin access token', () => {
    setAdminToken('test-token')

    clearAdminToken()

    expect(getAdminToken()).toBeNull()
  })
})
