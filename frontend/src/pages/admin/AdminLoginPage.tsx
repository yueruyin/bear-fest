import { type FormEvent, useMemo, useState } from 'react'
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
        <div className="admin-login-title">管理员登录</div>
        <div className="admin-login-sub">配置站点信息与查看申请数据</div>

        <form className="admin-login-form" onSubmit={onSubmit}>
          <label className="admin-field">
            <span>账号</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="admin"
              required
            />
          </label>

          <label className="admin-field">
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
              required
            />
          </label>

          {error ? <div className="admin-error">{error}</div> : null}

          <button className="admin-primary-btn" type="submit" disabled={loading}>
            {loading ? '登录中…' : '登录'}
          </button>
        </form>
      </div>
    </div>
  )
}

