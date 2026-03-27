import { type ReactNode, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

export function Layout({ children }: { children: ReactNode }) {
  const [isNavHidden, setIsNavHidden] = useState(false)

  useEffect(() => {
    const NOISE_THRESHOLD = 4
    const HIDE_DELTA = 28
    const SHOW_DELTA = 18
    const SHOW_WHEN_NEAR_TOP = 24

    let lastY = window.scrollY
    let rafId: number | null = null
    let downDistance = 0
    let upDistance = 0
    let hidden = false

    const onScroll = () => {
      if (rafId !== null) return

      rafId = window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastY

        if (Math.abs(delta) <= NOISE_THRESHOLD) {
          lastY = currentY
          rafId = null
          return
        }

        if (currentY <= SHOW_WHEN_NEAR_TOP) {
          hidden = false
          downDistance = 0
          upDistance = 0
          setIsNavHidden(false)
          lastY = currentY
          rafId = null
          return
        }

        if (delta > 0) {
          downDistance += delta
          upDistance = 0
          if (!hidden && downDistance >= HIDE_DELTA) {
            hidden = true
            downDistance = 0
            setIsNavHidden(true)
          }
        } else {
          upDistance += -delta
          downDistance = 0
          if (hidden && upDistance >= SHOW_DELTA) {
            hidden = false
            upDistance = 0
            setIsNavHidden(false)
          }
        }

        lastY = currentY
        rafId = null
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafId !== null) window.cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div className="site-shell">
      <header className={`top-nav${isNavHidden ? ' top-nav-hidden' : ''}`}>
        <div className={`container nav-inner${isNavHidden ? ' nav-inner-hidden' : ''}`}>
          <Link to="/" className="brand" aria-label="小熊街区首页">
            <img
              className="brand-logo"
              src="/case-carousel/log.png"
              alt="小熊街区"
              decoding="async"
            />
            <span className="brand-title">小熊团队</span>
          </Link>

          <nav className="nav-links" aria-label="主导航">
            <Link to="/services">服务能力</Link>
            <Link to="/cases">项目案例</Link>
            <Link to="/merchant-signup">商户报名</Link>
            <Link to="/about">关于我们</Link>
          </nav>

          <div className="nav-actions">
            <a href="tel:400-000-0000" className="nav-action-link">
              联系我们
            </a>
            <a href="tel:400-000-0000" className="nav-phone-link">
              400-000-0000
            </a>
            <a href="tel:400-000-0000" className="btn btn-small nav-cta">
              咨询合作
            </a>
          </div>
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
