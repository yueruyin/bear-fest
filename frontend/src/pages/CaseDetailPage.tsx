import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../api'
import { Layout } from '../components/Layout'
import { resolveMediaUrl } from '../media'
import type { CaseItem, ExecutionHighlight, ResultMetric } from '../types'

const EVENT_TYPE_LABELS: Record<string, string> = {
  sports: '赛事活动',
  carnival: '城市嘉年华',
  market: '潮流集市',
  annual: '企业年会',
  brand: '品牌活动',
}

type LoadState = 'loading' | 'success' | 'not-found' | 'error' | 'invalid'

type ParsedArray<T> = {
  items: T[]
  invalid: boolean
}

function parseJsonArray<T>(input: string | null | undefined): ParsedArray<T> {
  if (input === null || input === undefined || input.trim() === '') {
    return { items: [], invalid: false }
  }
  try {
    const parsed: unknown = JSON.parse(input)
    return Array.isArray(parsed)
      ? { items: parsed as T[], invalid: false }
      : { items: [], invalid: true }
  } catch {
    return { items: [], invalid: true }
  }
}

function parseStringArray(input: string | null | undefined): ParsedArray<string> {
  const parsed = parseJsonArray<unknown>(input)
  if (parsed.invalid) return { items: [], invalid: true }
  const valid = parsed.items.every((item) => typeof item === 'string')
  return {
    items: valid
      ? parsed.items.map((item) => (item as string).trim()).filter(Boolean)
      : [],
    invalid: !valid,
  }
}

function parseHighlights(input: string | null | undefined): ParsedArray<ExecutionHighlight> {
  const parsed = parseJsonArray<unknown>(input)
  if (parsed.invalid) return { items: [], invalid: true }
  const valid = parsed.items.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ExecutionHighlight).title === 'string' &&
      typeof (item as ExecutionHighlight).description === 'string',
  )
  return { items: valid ? (parsed.items as ExecutionHighlight[]) : [], invalid: !valid }
}

function parseMetrics(input: string | null | undefined): ParsedArray<ResultMetric> {
  const parsed = parseJsonArray<unknown>(input)
  if (parsed.invalid) return { items: [], invalid: true }
  const valid = parsed.items.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as ResultMetric).label === 'string' &&
      typeof (item as ResultMetric).value === 'string' &&
      ((item as ResultMetric).description === undefined ||
        typeof (item as ResultMetric).description === 'string'),
  )
  return { items: valid ? (parsed.items as ResultMetric[]) : [], invalid: !valid }
}

function isCaseItem(value: unknown): value is CaseItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<CaseItem>
  return (
    typeof item.title === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.event_type === 'string' &&
    typeof item.summary === 'string' &&
    typeof item.cover_image_url === 'string'
  )
}

export function getCaseTypeLabel(value: string) {
  return EVENT_TYPE_LABELS[value] || value || '未分类'
}

export function formatPublishedAt(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Shanghai',
  }).format(date)
}

export function CaseDetailPage() {
  const { slug } = useParams()
  const [detail, setDetail] = useState<CaseItem | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')

  useEffect(() => {
    const controller = new AbortController()
    if (!slug) {
      setLoadState('not-found')
      return () => controller.abort()
    }

    setLoadState('loading')
    setDetail(null)
    fetch(`${API_BASE_URL}/api/v1/cases/${slug}`, { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 404) {
          setLoadState('not-found')
          return
        }
        if (!response.ok) {
          setLoadState('error')
          return
        }
        const data: unknown = await response.json()
        if (!isCaseItem(data)) {
          setLoadState('invalid')
          return
        }
        setDetail(data)
        setLoadState('success')
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadState('error')
      })
    return () => controller.abort()
  }, [slug])

  const content = useMemo(() => {
    if (!detail) return null
    const gallery = parseStringArray(detail.gallery_urls)
    const tags = parseStringArray(detail.tags)
    const highlights = parseHighlights(detail.execution_highlights)
    const metrics = parseMetrics(detail.result_metrics)
    return {
      gallery,
      tags,
      highlights,
      metrics,
      hasInvalidStructuredContent:
        gallery.invalid || tags.invalid || highlights.invalid || metrics.invalid,
    }
  }, [detail])

  return (
    <Layout>
      <section className="section">
        <div className="container">
          {loadState === 'loading' ? <p role="status">正在加载案例详情…</p> : null}
          {loadState === 'not-found' ? (
            <div className="case-detail-state" role="status">
              <h1>未找到该案例</h1>
              <p>该案例可能尚未发布、已下线或地址有误。</p>
              <Link className="btn" to="/cases">返回项目案例</Link>
            </div>
          ) : null}
          {loadState === 'error' ? (
            <div className="case-detail-state" role="alert">
              <h1>案例加载失败</h1>
              <p>网络或服务暂时不可用，请稍后刷新页面重试。</p>
            </div>
          ) : null}
          {loadState === 'invalid' ? (
            <div className="case-detail-state" role="alert">
              <h1>案例内容暂时无法展示</h1>
              <p>该案例数据存在异常，请稍后再试。</p>
            </div>
          ) : null}
          {loadState === 'success' && detail && content ? (
            <article className="case-detail-page">
              <header className="case-detail-hero">
                <div className="case-detail-hero-media">
                  <img
                    src={resolveMediaUrl(detail.cover_image_url)}
                    alt={detail.title}
                    loading="eager"
                    decoding="async"
                  />
                </div>
                <div className="case-detail-hero-overlay" aria-hidden="true" />
                <div className="case-detail-hero-content">
                  <span className="case-detail-kicker">项目案例</span>
                  <h1>{detail.title}</h1>
                  <p>{detail.summary}</p>
                  <div className="case-detail-meta">
                    <span>活动类型：{getCaseTypeLabel(detail.event_type)}</span>
                    {formatPublishedAt(detail.published_at) ? (
                      <span>发布时间：{formatPublishedAt(detail.published_at)}</span>
                    ) : null}
                  </div>
                  {content.tags.items.length > 0 ? (
                    <div className="case-detail-tags" aria-label="案例标签">
                      {content.tags.items.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
                    </div>
                  ) : null}
                </div>
              </header>

              {content.hasInvalidStructuredContent ? (
                <p className="case-detail-data-warning" role="status">
                  该案例的部分历史内容暂时无法展示。
                </p>
              ) : null}

              {detail.project_background || detail.project_goals ? (
                <section className="case-detail-section">
                  <h2>项目背景</h2>
                  {detail.project_background ? (
                    <div className="case-detail-copy">
                      <h3>项目背景</h3>
                      <p>{detail.project_background}</p>
                    </div>
                  ) : null}
                  {detail.project_goals ? (
                    <div className="case-detail-copy">
                      <h3>项目目标</h3>
                      <p>{detail.project_goals}</p>
                    </div>
                  ) : null}
                </section>
              ) : null}

              {content.highlights.items.length > 0 ? (
                <section className="case-detail-section">
                  <h2>执行亮点</h2>
                  <div className="case-detail-highlight-grid">
                    {content.highlights.items.map((item, index) => (
                      <article className="case-highlight-card" key={`${item.title}-${index}`}>
                        <span>{String(index + 1).padStart(2, '0')}</span>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {content.metrics.items.length > 0 ? (
                <section className="case-detail-section">
                  <h2>成果数据</h2>
                  <div className="case-detail-metrics">
                    {content.metrics.items.map((item, index) => (
                      <article key={`${item.label}-${index}`} className="case-metric-card">
                        <p className="case-metric-label">{item.label}</p>
                        <p className="case-metric-value">{item.value}</p>
                        {item.description ? <p>{item.description}</p> : null}
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              {detail.result_summary ? (
                <section className="case-detail-section">
                  <h2>项目成果总结</h2>
                  <p className="case-detail-result-summary">{detail.result_summary}</p>
                </section>
              ) : null}

              {content.gallery.items.length > 0 ? (
                <section className="case-detail-section">
                  <h2>现场图集</h2>
                  <div className="case-detail-gallery">
                    {content.gallery.items.map((src, index) => (
                      <figure key={`${src}-${index}`} className="case-gallery-item">
                        <img
                          src={resolveMediaUrl(src)}
                          alt={`${detail.title} 现场图 ${index + 1}`}
                          loading="lazy"
                        />
                      </figure>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="case-detail-section case-detail-cta">
                <h2>想了解同类项目？</h2>
                <p>告诉我们你的活动目标，我们会结合场景与资源提供完整执行建议。</p>
                <Link className="btn" to="/contact">咨询同类项目</Link>
              </section>
            </article>
          ) : null}
        </div>
      </section>
    </Layout>
  )
}
