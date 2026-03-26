import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { CASE_CAROUSEL_IMAGES } from '../constants/caseCarousel'
import { useCases } from '../hooks/useCases'
import { useSiteConfig } from '../hooks/useSiteConfig'

export function HomePage() {
  const config = useSiteConfig()
  const cases = useCases()
  const [activeSlide, setActiveSlide] = useState(0)
  const highlights = useMemo(() => {
    if (!config?.service_highlights) return []
    try {
      return JSON.parse(config.service_highlights) as string[]
    } catch {
      return []
    }
  }, [config])

  useEffect(() => {
    if (CASE_CAROUSEL_IMAGES.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % CASE_CAROUSEL_IMAGES.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  const toPrevSlide = () => {
    setActiveSlide((prev) =>
      prev === 0 ? CASE_CAROUSEL_IMAGES.length - 1 : prev - 1,
    )
  }

  const toNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % CASE_CAROUSEL_IMAGES.length)
  }

  return (
    <Layout>
      <section className="hero">
        <div className="container">
          <p className="eyebrow">城市线下活动生态</p>
          <h1>{config?.home_hero_title || '小熊团队'}</h1>
          <h2 className="hero-slogan">让每个灵感，都在现场被看见。</h2>
          <p className="hero-sub">
            {config?.home_hero_subtitle ||
              '从创意设计到现场运营，一站式打造城市记忆级活动体验。'}
          </p>
          <div className="hero-actions">
            <Link className="btn" to="/cases">
              查看案例
            </Link>
            <Link className="btn btn-ghost" to="/contact">
              发起合作咨询
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-services">
        <div className="container">
          <header className="section-services-header">
            <h2>服务能力</h2>
            <div className="section-services-intro">
              <p>
                小熊团队系重庆市商务委旗下商业运营平台，其前身为广受关注的
                <span className="section-services-highlight">「小熊集市」</span>。
              </p>
              <p>
                现阶段，团队秉承创新、年轻化、服务型三大核心理念，致力于构建一个线上线下融合、体验式驱动的新世代城市新场景平台。
              </p>
              <p>
                小熊团队将持续聚焦本地新城市场景的搭建与赋能，助力城市商业生态的焕新与成长。
              </p>
            </div>
          </header>
          <div className="services-grid">
            {(highlights.length > 0
              ? highlights
              : ['创意设计', '场景搭建', '供应链协作', '活动传播', '现场运营']
            ).map((item, index) => (
              <article
                className="service-card"
                key={item}
                data-accent={index % 5}
              >
                <span className="service-card-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{item}</h3>
                <p>围绕品牌目标与现场体验，提供标准化流程与专业执行方案。</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <h2>代表案例</h2>
          <div
            className="case-carousel"
            role="region"
            aria-roledescription="轮播"
            aria-label="代表案例现场图"
          >
            <div className="case-carousel-viewport">
              <div className="case-carousel-track">
                {CASE_CAROUSEL_IMAGES.map((item, index) => (
                  <figure
                    key={item.src}
                    className={`case-slide ${index === activeSlide ? 'active' : ''}`}
                    aria-hidden={index !== activeSlide}
                  >
                    <div className="case-slide-media">
                      <img
                        src={item.src}
                        alt={item.alt}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </div>
                  </figure>
                ))}
              </div>
              <div className="case-carousel-caption-bar" aria-live="polite">
                <span className="case-carousel-caption-text">
                  {CASE_CAROUSEL_IMAGES[activeSlide].caption}
                </span>
                <div className="carousel-dots-wrap" aria-label="轮播页码">
                  {CASE_CAROUSEL_IMAGES.map((item, index) => (
                    <button
                      key={`${item.src}-dot`}
                      type="button"
                      className={`carousel-dot ${index === activeSlide ? 'active' : ''}`}
                      onClick={() => setActiveSlide(index)}
                      aria-label={`切换到第 ${index + 1} 张案例图`}
                      aria-selected={index === activeSlide}
                    />
                  ))}
                </div>
                <span className="case-carousel-counter">
                  {String(activeSlide + 1).padStart(2, '0')}
                  <span className="case-carousel-counter-sep">/</span>
                  {String(CASE_CAROUSEL_IMAGES.length).padStart(2, '0')}
                </span>
              </div>
              <button
                type="button"
                className="carousel-arrow left"
                onClick={toPrevSlide}
                aria-label="上一张"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 18l-6-6 6-6"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="carousel-arrow right"
                onClick={toNextSlide}
                aria-label="下一张"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 18l6-6-6-6"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="card-grid">
            {cases.slice(0, 6).map((c) => (
              <Link key={c.id} to={`/cases/${c.slug}`} className="card card-link">
                <h3>{c.title}</h3>
                <p>{c.summary}</p>
                <span className="tag">{c.event_type}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
