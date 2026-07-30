import {
  type FormEvent,
  type KeyboardEvent,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  FileText,
  Inbox,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogIn,
  Settings2,
  ShieldCheck,
  Store,
  UserRound,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '../../api'
import { setAdminToken } from '../../admin/auth'

type LoginResponse = { access_token: string; token_type: string }

const WORKSPACE_FEATURES = [
  { icon: Settings2, label: '站点内容', desc: '维护首页文案与联系信息' },
  { icon: Inbox, label: '合作咨询', desc: '集中跟进客户合作需求' },
  { icon: Store, label: '商户报名', desc: '审核报名资料与附件' },
  { icon: FileText, label: '项目案例', desc: '编辑图片并管理发布状态' },
] as const

const ADMIN_PAGE_LABELS: Record<string, string> = {
  '/admin/site-config': '站点内容',
  '/admin/leads': '合作咨询',
  '/admin/merchant-signups': '商户报名',
  '/admin/cases': '项目案例',
}

export function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const fromPath = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from || '/admin/site-config'
  }, [location.state])

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const destinationLabel = ADMIN_PAGE_LABELS[fromPath]
  const canSubmit = Boolean(username.trim() && password && !loading)

  const detectCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(event.getModifierState('CapsLock'))
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('账号或密码不正确，请重新输入。')
        }
        if (response.status === 429) {
          throw new Error('尝试次数较多，请稍后再试。')
        }
        throw new Error('登录服务暂时不可用，请稍后重试。')
      }

      const data = (await response.json()) as LoginResponse
      if (!data?.access_token) {
        throw new Error('登录响应异常，请稍后重试。')
      }
      setAdminToken(data.access_token)
      navigate(fromPath, { replace: true })
    } catch (loginError) {
      const message =
        loginError instanceof TypeError
          ? '无法连接登录服务，请确认网络或服务状态。'
          : loginError instanceof Error
            ? loginError.message
            : '登录失败，请稍后重试。'
      setError(message)
      window.setTimeout(() => passwordInputRef.current?.select(), 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login">
      <Link className="admin-login-back" to="/">
        <ArrowLeft size={15} aria-hidden="true" />
        返回前台网站
      </Link>

      <div className="admin-login-shell">
        <section className="admin-login-intro" aria-label="小熊运营工作台介绍">
          <div className="admin-login-brand">
            <span>
              <LayoutDashboard size={23} aria-hidden="true" />
            </span>
            <div>
              <strong>小熊运营工作台</strong>
              <small>Bear Fest Admin</small>
            </div>
          </div>

          <div className="admin-login-intro-copy">
            <span>Content operations</span>
            <h1>让每一次内容更新，都更简单、更清楚。</h1>
            <p>统一管理站点内容、合作机会、商户报名与项目案例。</p>
          </div>

          <div className="admin-login-feature-grid">
            {WORKSPACE_FEATURES.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label}>
                  <span>
                    <Icon size={17} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <small>{item.desc}</small>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="admin-login-intro-footer">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>仅限授权运营人员访问</span>
          </div>
        </section>

        <section className="admin-login-panel">
          <div className="admin-login-panel-inner">
            <div className="admin-login-welcome">
              <div className="admin-login-mobile-brand" aria-hidden="true">
                <LayoutDashboard size={20} />
              </div>
              <span>欢迎回来</span>
              <h2>登录运营工作台</h2>
              <p>
                {destinationLabel
                  ? `验证身份后继续访问“${destinationLabel}”。`
                  : '输入管理员账号和密码继续。'}
              </p>
            </div>

            <form className="admin-login-form admin-login-form-pro" onSubmit={onSubmit}>
              <label className="admin-login-field">
                <span>管理员账号</span>
                <div className="admin-login-input">
                  <UserRound size={18} aria-hidden="true" />
                  <input
                    value={username}
                    onChange={(event) => {
                      setUsername(event.target.value)
                      setError('')
                    }}
                    autoComplete="username"
                    placeholder="请输入管理员账号"
                    autoFocus
                    required
                    disabled={loading}
                  />
                </div>
              </label>

              <label className="admin-login-field">
                <span className="admin-login-password-label">
                  <span>登录密码</span>
                  {capsLockOn ? <small>大写锁定已开启</small> : null}
                </span>
                <div className="admin-login-input">
                  <LockKeyhole size={18} aria-hidden="true" />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value)
                      setError('')
                    }}
                    onKeyDown={detectCapsLock}
                    onKeyUp={detectCapsLock}
                    onBlur={() => setCapsLockOn(false)}
                    autoComplete="current-password"
                    placeholder="请输入登录密码"
                    required
                    disabled={loading}
                    aria-describedby={error ? 'admin-login-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    title={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </label>

              {error ? (
                <div className="admin-login-error" id="admin-login-error" role="alert">
                  <AlertCircle size={17} aria-hidden="true" />
                  <span>{error}</span>
                </div>
              ) : null}

              <button
                className="admin-primary-btn admin-login-submit"
                type="submit"
                disabled={!canSubmit}
              >
                {loading ? (
                  <>
                    <LoaderCircle className="is-spinning" size={18} aria-hidden="true" />
                    正在验证身份…
                  </>
                ) : (
                  <>
                    进入工作台
                    <LogIn size={17} aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            <div className="admin-login-help">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>登录状态仅保存在当前浏览器，请勿在公共设备上使用。</span>
            </div>
          </div>
        </section>
      </div>

      <div className="admin-login-copyright">
        © {new Date().getFullYear()} 小熊团队 · 运营管理系统
      </div>
    </main>
  )
}
