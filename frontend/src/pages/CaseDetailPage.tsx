import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../api'
import { Layout } from '../components/Layout'
import type { CaseItem } from '../types'

const WTT_REPORT_HIGHLIGHTS = [
  { label: '销售总额', value: '¥955,287' },
  { label: '销售总件数', value: '20,790件' },
  { label: '线下 / 线上占比', value: '67.6% / 32.4%' },
  { label: 'SKU', value: '21款' },
] as const

const WTT_CHANNELS = [
  { name: '线下门店', value: '¥645,739.1', note: '北门店贡献超50%，核心入口点位优势显著。' },
  { name: '抖音', value: '¥203,072 (65.6%)', note: '短视频种草 + 直播带货，线上绝对主力渠道。' },
  { name: '小红书', value: '¥90,967 (29.4%)', note: '图文攻略驱动深度种草，互动与转化潜力高。' },
  { name: '淘宝', value: '¥15,509 (5.0%)', note: '开店晚且流量弱，后续需精细化运营和引流。' },
] as const

const WTT_BESTSELLERS = [
  { name: 'CQ冰箱贴', sales: '1,908件', amount: '¥93,492', tag: '全品类冠军' },
  { name: '链条徽章', sales: '1,249件', amount: '¥61,201', tag: '亚军单品' },
  { name: '流沙摇摇乐', sales: '1,357件', amount: '¥48,852', tag: '季军单品' },
  { name: '托特包', sales: '514件', amount: '¥90,464', tag: '最快售罄' },
] as const

const WTT_STRATEGIES = [
  '精准调研并优化品类结构，强化赛事+城市元素与球星文化融合。',
  '均衡线上平台投入，抖音持续放量、小红书深耕种草、淘宝提升精细化运营。',
  '线下点位继续围绕主会场核心入口布局，提升高峰时段动线转化效率。',
  '打造跨平台联动内容机制，以爆款内容放大品牌声量和长尾传播。',
] as const

const WTT_CASE_IMAGES = [
  '/case-carousel/page11_img01.jpeg',
  '/case-carousel/page12_img01.jpeg',
  '/case-carousel/page13_img01.jpeg',
] as const

function parseGalleryUrls(input?: string) {
  if (!input) return []
  const raw = input.trim()
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    }
  } catch {
    // keep parsing by comma for backward compatibility
  }
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getUsableImage(value: string | undefined, fallback: string) {
  if (!value || value.includes('example.com')) return fallback
  return value
}

export function CaseDetailPage() {
  const { slug } = useParams()
  const [detail, setDetail] = useState<CaseItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetch(`${API_BASE_URL}/api/v1/cases/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CaseItem | null) => setDetail(data))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false))
  }, [slug])

  const isWttCase = !!detail && (detail.event_type === 'sports' || detail.title.includes('WTT'))
  const gallery = detail ? parseGalleryUrls(detail.gallery_urls) : []
  const pageImages = (gallery.length > 0 ? gallery : WTT_CASE_IMAGES)
    .map((src, index) => getUsableImage(src, WTT_CASE_IMAGES[index % WTT_CASE_IMAGES.length]))
    .slice(0, 6)

  return (
    <Layout>
      <section className="section">
        <div className="container">
          {loading ? (
            <p>正在加载赛事详情...</p>
          ) : !detail ? (
            <p>未找到该案例。</p>
          ) : (
            <article className="case-detail-page">
              <header className="case-detail-hero">
                <div className="case-detail-hero-media">
                  <img
                    src={getUsableImage(detail.cover_image_url, WTT_CASE_IMAGES[0])}
                    alt={detail.title}
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="case-detail-hero-overlay" aria-hidden="true" />
                <div className="case-detail-hero-content">
                  <span className="case-detail-kicker">赛事项目复盘</span>
                  <h1>{detail.title}</h1>
                  <p>{detail.summary}</p>
                  <div className="case-detail-meta">
                    <span>活动类型：{detail.event_type}</span>
                    {detail.published_at ? <span>发布时间：{detail.published_at}</span> : null}
                  </div>
                </div>
              </header>

              {isWttCase ? (
                <>
                  <section className="case-detail-section">
                    <h2>核心业绩概览</h2>
                    <div className="case-detail-metrics">
                      {WTT_REPORT_HIGHLIGHTS.map((item) => (
                        <article key={item.label} className="case-metric-card">
                          <p className="case-metric-label">{item.label}</p>
                          <p className="case-metric-value">{item.value}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="case-detail-section">
                    <h2>渠道表现分析</h2>
                    <div className="case-detail-channel-grid">
                      {WTT_CHANNELS.map((channel) => (
                        <article key={channel.name} className="case-channel-card">
                          <h3>{channel.name}</h3>
                          <p className="case-channel-value">{channel.value}</p>
                          <p>{channel.note}</p>
                        </article>
                      ))}
                    </div>
                  </section>

                  <section className="case-detail-section">
                    <h2>爆款单品与消费偏好</h2>
                    <div className="case-detail-bestseller-grid">
                      {WTT_BESTSELLERS.map((item) => (
                        <article key={item.name} className="case-product-card">
                          <span className="tag">{item.tag}</span>
                          <h3>{item.name}</h3>
                          <p>销量：{item.sales}</p>
                          <p>销售额：{item.amount}</p>
                        </article>
                      ))}
                    </div>
                    <p className="meta case-insight">
                      人群洞察：女性消费者占比超90%，35岁以下占比超80%，运动员个人IP对转化提升作用明显。
                    </p>
                  </section>

                  <section className="case-detail-section">
                    <h2>现场与传播图集</h2>
                    <div className="case-detail-gallery">
                      {pageImages.map((src, index) => (
                        <figure key={`${src}-${index}`} className="case-gallery-item">
                          <img src={src} alt={`${detail.title} 现场图 ${index + 1}`} loading="lazy" />
                        </figure>
                      ))}
                    </div>
                  </section>

                  <section className="case-detail-section">
                    <h2>问题与优化策略</h2>
                    <ul className="case-detail-strategies">
                      {WTT_STRATEGIES.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </section>
                </>
              ) : (
                <section className="case-detail-section">
                  <h2>项目详情</h2>
                  <p>
                    当前案例内容已同步基础信息。你可以继续在后台补充“指标数据、图集、分阶段复盘、策略建议”等结构化内容，前端会按本页布局自动展示。
                  </p>
                </section>
              )}

              <section className="case-detail-section case-detail-cta">
                <h2>想复制同类项目效果？</h2>
                <p>我们可提供从选品、点位规划、内容传播到现场运营的全链路执行支持。</p>
                <Link className="btn" to="/contact">
                  咨询同类项目
                </Link>
              </section>
            </article>
          )}
        </div>
      </section>
    </Layout>
  )
}
