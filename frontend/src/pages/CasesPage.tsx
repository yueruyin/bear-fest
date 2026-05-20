import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCases } from '../hooks/useCases'
import type { CaseItem } from '../types'

const CASE_TYPE_OPTIONS = [
  ['', '全部'],
  ['sports', '赛事'],
  ['carnival', '嘉年华'],
  ['market', '潮流集市'],
  ['annual', '企业年会'],
  ['brand', '品牌活动'],
] as const

const CASE_FALLBACK_IMAGES: Record<string, string> = {
  sports: '/case-carousel/page18_img01.jpeg',
  carnival: '/case-carousel/page22_img01.jpeg',
  market: '/case-carousel/page30_img01.jpeg',
  annual: '/case-carousel/page12_img01.jpeg',
  brand: '/case-carousel/page25_img01.jpeg',
  default: '/case-carousel/page31_img01.jpeg',
}

function normalizeEventType(value: string) {
  const v = (value || '').trim().toLowerCase()
  if (v === 'sports' || value === '赛事') return 'sports'
  if (v === 'carnival' || value === '嘉年华') return 'carnival'
  if (v === 'market' || value === '潮流集市') return 'market'
  if (v === 'annual' || value === '企业年会') return 'annual'
  if (v === 'brand' || value === '品牌活动') return 'brand'
  return 'default'
}

function getCaseTypeLabel(value: string) {
  const type = normalizeEventType(value)
  const option = CASE_TYPE_OPTIONS.find(([key]) => key === type)
  return option?.[1] || value || '案例'
}

function getCaseImage(item: CaseItem) {
  const fallback = CASE_FALLBACK_IMAGES[normalizeEventType(item.event_type)]
  if (!item.cover_image_url || item.cover_image_url.includes('example.com')) return fallback
  return item.cover_image_url
}

export function CasesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = searchParams.get('type') || searchParams.get('event_type') || ''
  const [type, setType] = useState(initialType)
  const cases = useCases(type)

  return (
    <Layout>
      <section className="cases-hero page-hero page-hero-cases">
        <div className="container page-hero-inner">
          <div className="page-hero-copy">
            <p className="page-hero-eyebrow">项目案例</p>
            <h1 className="page-hero-title">用真实现场证明交付能力</h1>
            <p className="page-hero-sub">
              覆盖赛事、嘉年华、市集、企业年会与品牌活动，客户可以从案例里看到目标、方案、现场和结果。
            </p>
          </div>
          <div className="page-hero-stats" aria-label="案例类型">
            <div className="page-hero-stat">
              <strong>5类</strong>
              <span>活动场景</span>
            </div>
            <div className="page-hero-stat">
              <strong>全链路</strong>
              <span>策划到复盘</span>
            </div>
            <div className="page-hero-stat">
              <strong>数据化</strong>
              <span>成果沉淀</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section cases-section">
        <div className="container">
          <div className="cases-toolbar">
            <div>
              <p className="section-kicker">Case Library</p>
              <h2>案例库</h2>
            </div>
            <div className="filters" aria-label="按活动类型筛选">
            {CASE_TYPE_OPTIONS.map(([value, label]) => (
              <button
                key={value || 'all'}
                className={`chip ${type === value ? 'active' : ''}`}
                onClick={() => {
                  setType(value)
                  if (!value) {
                    setSearchParams({})
                    return
                  }
                  setSearchParams({ type: value })
                }}
              >
                {label}
              </button>
            ))}
            </div>
          </div>

          {cases.length > 0 ? (
          <div className="case-list-grid">
            {cases.map((c) => (
              <Link key={c.id} to={`/cases/${c.slug}`} className="case-list-card">
                <div className="case-list-media">
                  <img src={getCaseImage(c)} alt={c.title} loading="lazy" decoding="async" />
                </div>
                <div className="case-list-body">
                  <span className="tag">{getCaseTypeLabel(c.event_type)}</span>
                  <h3>{c.title}</h3>
                  <p>{c.summary}</p>
                  <span className="case-list-link">
                    查看项目
                    <ArrowRight size={15} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
          ) : (
            <div className="case-empty-state">
              <h3>暂无该类型案例</h3>
              <p>可以切换其他类型，或联系我们了解同类项目经验。</p>
              <Link className="btn btn-small" to="/contact">
                咨询同类项目
              </Link>
            </div>
          )}
        </div>
      </section>
    </Layout>
  )
}
