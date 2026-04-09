import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCases } from '../hooks/useCases'
import { useSiteConfig } from '../hooks/useSiteConfig'

const HOME_CASE_TYPES = [
  { key: 'sports', label: '赛事' },
  { key: 'carnival', label: '嘉年华' },
  { key: 'market', label: '潮流集市' },
  { key: 'annual', label: '企业年会' },
  { key: 'brand', label: '品牌活动' },
] as const

type HomeCaseTypeKey = (typeof HOME_CASE_TYPES)[number]['key']

const HOME_CASE_TYPE_FALLBACK_IMAGE: Record<HomeCaseTypeKey, string> = {
  sports: '/case-carousel/page18_img01.jpeg',
  carnival: '/case-carousel/page22_img01.jpeg',
  market: '/case-carousel/page30_img01.jpeg',
  annual: '/case-carousel/page12_img01.jpeg',
  brand: '/case-carousel/page25_img01.jpeg',
}

const HOME_CASE_TYPE_FALLBACK_CONTENT: Record<
  HomeCaseTypeKey,
  { title: string; summary: string }
> = {
  sports: {
    title: '城市赛事嘉年华执行案例',
    summary: '围绕赛事节点完成舞台统筹、互动动线与现场运营，提升参与体验与传播热度。',
  },
  carnival: {
    title: '城市嘉年华主题场景案例',
    summary: '结合节庆主题打造沉浸式现场，覆盖创意装置、活动流程与品牌互动体验。',
  },
  market: {
    title: '潮流集市空间策划案例',
    summary: '从市集主题定位到摊位组合与导流设计，构建高停留、高转化的线下消费场景。',
  },
  annual: {
    title: '企业年会全案执行案例',
    summary: '提供年会创意、舞美搭建、流程控场与传播支持，保障活动高质量落地。',
  },
  brand: {
    title: '品牌活动整合营销案例',
    summary: '围绕新品发布与品牌节点，打通活动策划、内容传播与线下互动闭环。',
  },
}

function normalizeEventType(value: string): HomeCaseTypeKey | null {
  const v = (value || '').trim().toLowerCase()
  if (!v) return null
  if (
    v === 'sports' ||
    v === 'carnival' ||
    v === 'market' ||
    v === 'annual' ||
    v === 'brand'
  ) {
    return v
  }

  if (value === '赛事') return 'sports'
  if (value === '嘉年华') return 'carnival'
  if (value === '潮流集市') return 'market'
  if (value === '企业年会') return 'annual'
  if (value === '品牌活动') return 'brand'

  return null
}

export function HomePage() {
  const config = useSiteConfig()
  const cases = useCases()
  const highlights = useMemo(() => {
    if (!config?.service_highlights) return []
    try {
      return JSON.parse(config.service_highlights) as string[]
    } catch {
      return []
    }
  }, [config])

  const casesByType = useMemo(() => {
    const buckets: Record<HomeCaseTypeKey, typeof cases> = {
      sports: [],
      carnival: [],
      market: [],
      annual: [],
      brand: [],
    }

    for (const c of cases) {
      const key = normalizeEventType(c.event_type)
      if (!key) continue
      buckets[key].push(c)
    }

    return buckets
  }, [cases])

  return (
    <Layout>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-container">
          <div className="hero-layout">
            <div className="hero-panel">
              <p className="eyebrow">城市线下活动生态</p>
              <h1 id="hero-title">{config?.home_hero_title || '小熊团队'}</h1>
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
            <div className="hero-aside" aria-hidden="true" />
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
          <div className="case-type-sections" role="list">
            {HOME_CASE_TYPES.map((t) => {
              const items = casesByType[t.key] || []
              const hero = items[0]
              const heroImage = HOME_CASE_TYPE_FALLBACK_IMAGE[t.key]
              const heroTitle = hero?.title || HOME_CASE_TYPE_FALLBACK_CONTENT[t.key].title
              const heroSummary =
                hero?.summary || HOME_CASE_TYPE_FALLBACK_CONTENT[t.key].summary
              const heroLink = hero ? `/cases/${hero.slug}` : `/cases?type=${t.key}`
              const heroCta = hero ? '查看该案例' : '查看该类型案例'
              return (
                <section
                  key={t.key}
                  className="case-type-section"
                  role="listitem"
                  aria-label={`${t.label}案例`}
                >
                  <header className="case-type-header">
                    <div className="case-type-title-wrap">
                      <h3 className="case-type-title">{t.label}</h3>
                      <p className="case-type-sub">
                        以目标为导向，从创意到落地的全链路现场执行。
                      </p>
                    </div>
                    <Link className="btn btn-small btn-ghost" to={`/cases?type=${t.key}`}>
                      查看更多
                    </Link>
                  </header>

                  <Link to={heroLink} className="case-type-hero">
                    <div className="case-type-hero-media">
                      <img
                        src={heroImage}
                        alt={`${t.label}案例：${heroTitle}`}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="case-type-hero-overlay" aria-hidden="true" />
                    <div className="case-type-hero-content">
                      <span className="case-type-hero-kicker">{t.label}</span>
                      <h4 className="case-type-hero-title">{heroTitle}</h4>
                      <p className="case-type-hero-summary">{heroSummary}</p>
                      <span className="case-type-hero-cta">{heroCta}</span>
                    </div>
                  </Link>
                </section>
              )
            })}
          </div>
        </div>
      </section>
    </Layout>
  )
}
