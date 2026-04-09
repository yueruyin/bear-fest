import { Link, Outlet, useNavigate } from 'react-router-dom'
import { clearAdminToken } from '../../admin/auth'

export function AdminLayout() {
  const navigate = useNavigate()

  const onLogout = () => {
    clearAdminToken()
    navigate('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-nav" aria-label="后台导航">
        <div className="admin-brand">
          <div className="admin-brand-title">管理后台</div>
          <div className="admin-brand-sub">Bear Fest</div>
        </div>

        <nav className="admin-links">
          <Link to="/admin/site-config">站点配置</Link>
          <Link to="/admin/leads">联系我们</Link>
          <Link to="/admin/merchant-signups">商户报名</Link>
          <Link to="/admin/cases">案例管理</Link>
        </nav>

        <div className="admin-nav-footer">
          <button type="button" className="admin-ghost-btn" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  )
}

