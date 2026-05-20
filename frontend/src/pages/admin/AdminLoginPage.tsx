import { type FormEvent, useMemo, useState } from 'react'
import { LockKeyhole, LogIn, UserRound } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../api'
import { setAdminToken } from '../../admin/auth'

type LoginResponse = { access_token: string; token_type: string }

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromPath = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from || '/admin/site-config'
  }, [location.state])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!res.ok) throw new Error('login failed')
      const data = (await res.json()) as LoginResponse
      if (!data?.access_token) throw new Error('missing token')
      setAdminToken(data.access_token)
      navigate(fromPath, { replace: true })
    } catch {
      setError('登录失败，请检查账号或密码。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login">
      <div className="admin-login-card">
        <div className="admin-login-badge">小熊运营工作台</div>
        <div className="admin-login-title">登录后管理网站内容</div>
        <div className="admin-login-sub">用于查看合作咨询、商户报名和维护项目案例。</div>

        <form className="admin-login-form" onSubmit={onSubmit}>
          <label className="admin-field">
            <span>账号</span>
            <div className="admin-input-with-icon">
              <UserRound size={18} aria-hidden="true" />
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="请输入账号"
                required
              />
            </div>
          </label>

          <label className="admin-field">
            <span>密码</span>
            <div className="admin-input-with-icon">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="请输入密码"
                required
              />
            </div>
          </label>

          {error ? <div className="admin-error">{error}</div> : null}

          <button className="admin-primary-btn" type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
            {loading ? null : <LogIn size={17} aria-hidden="true" />}
          </button>
        </form>
      </div>
    </div>
  )
}
