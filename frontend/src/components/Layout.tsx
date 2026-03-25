import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="top-nav">
        <div className="container nav-inner">
          <Link to="/" className="brand">
            小熊集市
          </Link>
          <nav className="nav-links">
            <Link to="/services">服务能力</Link>
            <Link to="/cases">项目案例</Link>
            <Link to="/about">关于我们</Link>
            <Link to="/contact" className="btn btn-small">
              联系我们
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="footer">
        <div className="container">
          <p>小熊团队 | 让每个灵感，都在现场被看见。</p>
        </div>
      </footer>
    </div>
  )
}
