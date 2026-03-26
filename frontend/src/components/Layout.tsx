import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="site-shell">
      <header className="top-nav">
        <div className="container nav-inner">
          <Link to="/" className="brand" aria-label="小熊街区首页">
            <img
              className="brand-logo"
              src="/case-carousel/log.png"
              alt="小熊街区"
              decoding="async"
            />
            <span className="brand-title">小熊团队</span>
          </Link>
          <nav className="nav-links">
            <Link to="/services">服务能力</Link>
            <Link to="/cases">项目案例</Link>
            <Link to="/merchant-signup">商户报名</Link>
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
          <div className="footer-inner">
            <div className="footer-left">
              <div className="footer-hotline">
                <span className="footer-label">服务热线</span>
                <a className="footer-phone" href="tel:400-000-0000">
                  400-000-0000
                </a>
              </div>
              <div className="footer-meta">服务时间：周一至周五 09:00-18:00</div>
            </div>

            <div className="footer-right">
              <div className="footer-links">
                <Link to="/merchant-signup">商户报名</Link>
                <Link to="/cases">项目案例</Link>
                <Link to="/contact">联系我们</Link>
              </div>
              <div className="footer-legal">
                <span>渝ICP备XXXXXXXX号</span>
                <span className="footer-dot" aria-hidden="true">
                  ·
                </span>
                <span>小熊团队© {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
