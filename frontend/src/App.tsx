import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Route, Routes, useParams } from 'react-router-dom'

const defaultApiHost = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${defaultApiHost}:8000`

type SiteConfig = {
  id: number
  home_hero_title: string
  home_hero_subtitle: string
  service_highlights: string
  contact_channels: string
}

type CaseItem = {
  id: number
  title: string
  slug: string
  event_type: string
  summary: string
  cover_image_url: string
  publish_status: string
  published_at: string | null
  tags: string
  gallery_urls?: string
  seo_title?: string
  seo_description?: string
}

type LeadForm = {
  name: string
  company: string
  phone_or_email: string
  demand_desc: string
}

const CASE_CAROUSEL_IMAGES = [
  {
    src: '/case-carousel/page21_img01.jpeg',
    alt: '小熊团队代表案例轮播图 1',
    caption: '城市嘉年华活动现场',
  },
  {
    src: '/case-carousel/page22_img01.jpeg',
    alt: '小熊团队代表案例轮播图 2',
    caption: '品牌线下互动体验区',
  },
  {
    src: '/case-carousel/page23_img01.jpeg',
    alt: '小熊团队代表案例轮播图 3',
    caption: '大型活动舞台执行案例',
  },
  {
    src: '/case-carousel/page24_img01.jpeg',
    alt: '小熊团队代表案例轮播图 4',
    caption: '主题市集空间与人流动线',
  },
  {
    src: '/case-carousel/page40_img01.jpeg',
    alt: '小熊团队代表案例轮播图 5',
    caption: '商业活动场景搭建与传播',
  },
]

function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/site-config`)
      .then((res) => res.json())
      .then((data: SiteConfig) => setConfig(data))
      .catch(() => setConfig(null))
  }, [])

  return config
}

function useCases(type = '') {
  const [items, setItems] = useState<CaseItem[]>([])

  useEffect(() => {
    const query = type ? `?event_type=${encodeURIComponent(type)}` : ''
    fetch(`${API_BASE_URL}/api/v1/cases${query}`)
      .then((res) => res.json())
      .then((data: CaseItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }, [type])

  return items
}

function Layout({ children }: { children: ReactNode }) {
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
          <p>小熊集市活动服务平台 | 让每个灵感，都在现场被看见。</p>
        </div>
      </footer>
    </div>
  )
}

function HomePage() {
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
          <h1>{config?.home_hero_title || '小熊集市活动服务平台'}</h1>
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

      <section className="section">
        <div className="container">
          <h2>服务能力</h2>
          <div className="card-grid five">
            {(highlights.length > 0
              ? highlights
              : ['创意设计', '场景搭建', '供应链协作', '活动传播', '现场运营']
            ).map((item) => (
              <article className="card" key={item}>
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
          <div className="case-carousel" aria-label="代表案例图片轮播">
            <div className="case-carousel-track">
              {CASE_CAROUSEL_IMAGES.map((item, index) => (
                <figure
                  key={item.src}
                  className={`case-slide ${index === activeSlide ? 'active' : ''}`}
                  aria-hidden={index !== activeSlide}
                >
                  <img src={item.src} alt={item.alt} loading="lazy" />
                  <figcaption>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
            <button
              type="button"
              className="carousel-arrow left"
              onClick={toPrevSlide}
              aria-label="查看上一张案例图"
            >
              ‹
            </button>
            <button
              type="button"
              className="carousel-arrow right"
              onClick={toNextSlide}
              aria-label="查看下一张案例图"
            >
              ›
            </button>
            <div className="carousel-dots" aria-label="轮播页码">
              {CASE_CAROUSEL_IMAGES.map((item, index) => (
                <button
                  key={`${item.src}-dot`}
                  type="button"
                  className={`carousel-dot ${index === activeSlide ? 'active' : ''}`}
                  onClick={() => setActiveSlide(index)}
                  aria-label={`切换到第 ${index + 1} 张案例图`}
                />
              ))}
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

function ServicesPage() {
  const flow = ['创意设计', '场景搭建', '供应链协作', '活动传播', '现场运营']
  return (
    <Layout>
      <section className="section">
        <div className="container">
          <h1>服务能力</h1>
          <p>覆盖活动全链路，支持大型赛事、嘉年华、潮流集市、企业年会与品牌活动。</p>
          <ol className="flow-list">
            {flow.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>
      </section>
    </Layout>
  )
}

function CasesPage() {
  const [type, setType] = useState('')
  const cases = useCases(type)

  return (
    <Layout>
      <section className="section">
        <div className="container">
          <h1>项目案例</h1>
          <div className="filters">
            {[
              ['', '全部'],
              ['sports', '赛事'],
              ['carnival', '嘉年华'],
              ['market', '潮流集市'],
              ['annual', '企业年会'],
              ['brand', '品牌活动'],
            ].map(([value, label]) => (
              <button
                key={value || 'all'}
                className={`chip ${type === value ? 'active' : ''}`}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="card-grid">
            {cases.map((c) => (
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

function CaseDetailPage() {
  const { slug } = useParams()
  const [detail, setDetail] = useState<CaseItem | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE_URL}/api/v1/cases/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CaseItem | null) => setDetail(data))
      .catch(() => setDetail(null))
  }, [slug])

  return (
    <Layout>
      <section className="section">
        <div className="container">
          {!detail ? (
            <p>未找到该案例。</p>
          ) : (
            <>
              <h1>{detail.title}</h1>
              <p>{detail.summary}</p>
              <p className="meta">活动类型：{detail.event_type}</p>
              <p>详情内容可由后台持续补充与更新，当前版本用于联调演示。</p>
              <Link className="btn" to="/contact">
                咨询同类项目
              </Link>
            </>
          )}
        </div>
      </section>
    </Layout>
  )
}

function AboutPage() {
  return (
    <Layout>
      <section className="section">
        <div className="container">
          <h1>关于我们</h1>
          <p>
            小熊集市致力于打造城市中最具活力的线下活动生态，聚焦大型赛事、主题嘉年华、潮流集市、
            企业年会与品牌活动。
          </p>
        </div>
      </section>
    </Layout>
  )
}

function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<LeadForm>({
    name: '',
    company: '',
    phone_or_email: '',
    demand_desc: '',
  })

  const onChange = (key: keyof LeadForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source_page: '/contact' }),
      })
      if (!res.ok) {
        throw new Error('submit failed')
      }
      setMessage('提交成功，我们会尽快与你联系。')
      setForm({ name: '', company: '', phone_or_email: '', demand_desc: '' })
    } catch {
      setMessage('提交失败，请稍后重试。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <section className="section">
        <div className="container">
          <h1>联系我们</h1>
          <form className="contact-form" onSubmit={onSubmit}>
            <label>
              姓名
              <input
                value={form.name}
                onChange={(e) => onChange('name', e.target.value)}
                required
              />
            </label>
            <label>
              公司
              <input value={form.company} onChange={(e) => onChange('company', e.target.value)} />
            </label>
            <label>
              联系方式
              <input
                value={form.phone_or_email}
                onChange={(e) => onChange('phone_or_email', e.target.value)}
                required
              />
            </label>
            <label>
              需求描述
              <textarea
                value={form.demand_desc}
                onChange={(e) => onChange('demand_desc', e.target.value)}
                minLength={10}
                required
              />
            </label>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? '提交中...' : '提交咨询'}
            </button>
            {message ? <p className="form-msg">{message}</p> : null}
          </form>
        </div>
      </section>
    </Layout>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:slug" element={<CaseDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
