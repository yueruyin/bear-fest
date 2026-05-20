import {
  FileText,
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Settings,
  Store,
} from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { clearAdminToken } from '../../admin/auth'

const ADMIN_NAV_ITEMS = [
  {
    to: '/admin/site-config',
    label: '站点内容',
    desc: '首页文字、服务亮点',
    icon: Settings,
  },
  {
    to: '/admin/leads',
    label: '合作咨询',
    desc: '查看客户留资',
    icon: Inbox,
  },
  {
    to: '/admin/merchant-signups',
    label: '商户报名',
    desc: '管理商户申请',
    icon: Store,
  },
  {
    to: '/admin/cases',
    label: '项目案例',
    desc: '维护前台案例',
    icon: FileText,
  },
] as const

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
          <div className="admin-brand-mark" aria-hidden="true">
            <LayoutDashboard size={22} />
          </div>
          <div>
            <div className="admin-brand-title">小熊运营工作台</div>
            <div className="admin-brand-sub">内容、线索和案例管理</div>
          </div>
        </div>

        <nav className="admin-links">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.to} to={item.to}>
                <Icon size={19} aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.desc}</small>
                </span>
              </NavLink>
            )
          })}
        </nav>

        <div className="admin-nav-footer">
          <a className="admin-preview-link" href="/" target="_blank" rel="noreferrer">
            <Home size={17} aria-hidden="true" />
            查看前台网站
          </a>
          <button type="button" className="admin-ghost-btn" onClick={onLogout}>
            <LogOut size={17} aria-hidden="true" />
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
