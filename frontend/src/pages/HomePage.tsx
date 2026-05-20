import { useMemo } from 'react'
import { ArrowRight, BadgeCheck, BarChart3, CalendarCheck, MapPin, Sparkles } from 'lucide-react'
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
  { title: string; summary: string; metric: string }
> = {
  sports: {
    title: '城市赛事嘉年华执行案例',
    summary: '围绕赛事节点完成舞台统筹、互动动线与现场运营，提升参与体验与传播热度。',
    metric: '赛事运营 / 特许商品 / 现场转化',
  },
  carnival: {
    title: '城市嘉年华主题场景案例',
    summary: '结合节庆主题打造沉浸式现场，覆盖创意装置、活动流程与品牌互动体验。',
    metric: '主题策划 / 人流组织 / 内容传播',
  },
  market: {
    title: '潮流集市空间策划案例',
    summary: '从市集主题定位到摊位组合与导流设计，构建高停留、高转化的线下消费场景。',
    metric: '商户招募 / 摊位组合 / 交易氛围',
  },
  annual: {
    title: '企业年会全案执行案例',
    summary: '提供年会创意、舞美搭建、流程控场与传播支持，保障活动高质量落地。',
    metric: '流程控场 / 舞美交付 / 嘉宾体验',
  },
  brand: {
    title: '品牌活动整合营销案例',
    summary: '围绕新品发布与品牌节点，打通活动策划、内容传播与线下互动闭环。',
    metric: '品牌路演 / 社媒内容 / 用户互动',
  },
}

const HOME_METRICS = [
  { value: '95.5万', label: 'WTT 重庆站特许商品销售额', note: '从选品、点位到线上线下一体化运营' },
  { value: '20,790', label: '赛事商品销售件数', note: '覆盖线下门店、抖音、小红书与淘宝渠道' },
  { value: '5类', label: '核心线下活动场景', note: '赛事、嘉年华、市集、年会与品牌活动' },
] as const

const HOME_CAPABILITY_CARDS = [
  {
    title: '策略与创意',
    desc: '把品牌目标拆成可执行的主题、内容和现场动线，让创意不是停在方案里。',
    items: ['活动主题', '主视觉系统', '互动机制'],
  },
  {
    title: '空间与制作',
    desc: '从场地规划、舞美搭建到导视物料，统一审美表达与人流效率。',
    items: ['空间分区', '舞美装置', '物料落地'],
  },
  {
    title: '运营与控场',
    desc: '用项目制管理串联供应链、排期、人员与应急预案，保障现场稳定交付。',
    items: ['项目排期', '供应链协同', '现场应急'],
  },
  {
    title: '传播与复盘',
    desc: '活动前中后形成内容闭环，用数据和素材沉淀下一次增长方法。',
    items: ['内容采集', '平台传播', '数据复盘'],
  },
] as const

const HOME_PROOF_POINTS = [
  '重庆市商务委旗下商业运营平台背景',
  '小熊集市线下活动运营经验沉淀',
  '覆盖策划、搭建、招商、传播与现场执行',
  '支持案例内容、咨询线索与商户报名数字化管理',
] as const

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

function getUsableCaseImage(value: string | undefined, fallback: string) {
  if (!value || value.includes('example.com')) return fallback
  return value
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
              <p className="eyebrow">城市商业活动全案伙伴</p>
              <h1 id="hero-title">{config?.home_hero_title || '小熊团队'}</h1>
              <h2 className="hero-slogan">把灵感做成现场，把现场做成客户记得住的品牌资产。</h2>
              <p className="hero-sub">
                {config?.home_hero_subtitle ||
                  '从创意策略、空间搭建、供应链协同到现场运营和传播复盘，一站式交付城市级线下活动。'}
              </p>
              <div className="hero-actions">
                <Link className="btn" to="/cases">
                  查看案例
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link className="btn btn-ghost" to="/contact">
                  发起合作咨询
                  <CalendarCheck size={17} aria-hidden="true" />
                </Link>
              </div>
              <div className="hero-metric-grid" aria-label="关键项目数据">
                {HOME_METRICS.map((metric) => (
                  <div className="hero-metric" key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-showcase" aria-label="小熊团队现场项目展示">
              <div className="hero-showcase-main">
                <img src="/case-carousel/page18_img01.jpeg" alt="大型赛事活动现场" />
              </div>
              <div className="hero-showcase-note">
                <span>标杆项目复盘</span>
                <strong>WTT 重庆站</strong>
                <p>赛事特许商品运营、线下点位布局、内容种草与现场销售协同。</p>
              </div>
              <div className="hero-showcase-thumbs" aria-hidden="true">
                <img src="/case-carousel/page22_img01.jpeg" alt="" />
                <img src="/case-carousel/page30_img01.jpeg" alt="" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-services">
        <div className="container">
          <header className="section-heading-row">
            <div className="section-services-header">
              <p className="section-kicker">Capability</p>
              <h2>客户会看到创意，我们交付的是整条链路</h2>
            </div>
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
          <div className="services-grid home-capability-grid">
            {(highlights.length > 0 ? highlights : HOME_CAPABILITY_CARDS.map((item) => item.title)).map((item, index) => {
              const preset = HOME_CAPABILITY_CARDS[index % HOME_CAPABILITY_CARDS.length]
              return (
              <article
                className="service-card"
                key={item}
                data-accent={index % 5}
              >
                <span className="service-card-index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{item}</h3>
                <p>{preset.desc}</p>
                <div className="service-card-items" aria-label={`${item}服务要点`}>
                  {preset.items.map((point) => (
                    <span key={point}>{point}</span>
                  ))}
                </div>
              </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section client-proof-section">
        <div className="container proof-layout">
          <div className="proof-copy">
            <p className="section-kicker">Why Bear Fest</p>
            <h2>更适合对外展示的，不只是页面，而是可信的能力表达</h2>
            <p>
              面向品牌方、城市合作方和场地方，我们把“能做活动”转译成可判断的资质、流程、案例和数据，让第一次介绍就足够清楚。
            </p>
          </div>
          <div className="proof-list" aria-label="小熊团队能力背书">
            {HOME_PROOF_POINTS.map((point) => (
              <div className="proof-item" key={point}>
                <BadgeCheck size={18} aria-hidden="true" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <header className="section-heading-row section-heading-row-compact">
            <div>
              <p className="section-kicker">Selected Works</p>
              <h2>代表案例</h2>
              <p className="section-lead">用真实现场证明策划、招商、搭建、传播和销售转化的协同能力。</p>
            </div>
            <Link className="btn btn-small btn-outline" to="/cases">
              全部案例
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </header>
          <div className="case-showcase-grid" role="list">
            {HOME_CASE_TYPES.map((t) => {
              const items = casesByType[t.key] || []
              const hero = items[0]
              const fallback = HOME_CASE_TYPE_FALLBACK_IMAGE[t.key]
              const heroImage = getUsableCaseImage(hero?.cover_image_url, fallback)
              const heroTitle = hero?.title || HOME_CASE_TYPE_FALLBACK_CONTENT[t.key].title
              const heroSummary =
                hero?.summary || HOME_CASE_TYPE_FALLBACK_CONTENT[t.key].summary
              const heroMetric = HOME_CASE_TYPE_FALLBACK_CONTENT[t.key].metric
              const heroLink = hero ? `/cases/${hero.slug}` : `/cases?type=${t.key}`
              return (
                <Link
                  key={t.key}
                  to={heroLink}
                  className={`case-showcase-card case-showcase-card-${t.key}`}
                  role="listitem"
                  aria-label={`${t.label}案例`}
                >
                  <div className="case-showcase-media">
                    <img
                      src={heroImage}
                      alt={`${t.label}案例：${heroTitle}`}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="case-showcase-body">
                    <span className="case-showcase-kicker">{t.label}</span>
                    <h3>{heroTitle}</h3>
                    <p>{heroSummary}</p>
                    <div className="case-showcase-foot">
                      <span>{heroMetric}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="section home-cta-section">
        <div className="container home-cta">
          <div>
            <p className="section-kicker">Start a Brief</p>
            <h2>把下一场活动，先变成一份清楚的客户提案</h2>
            <p>告诉我们目标、预算、场地和周期，我们会把创意、执行路径和风险节点梳理成可沟通的方案框架。</p>
          </div>
          <div className="home-cta-actions">
            <Link className="btn" to="/contact">
              发起合作咨询
              <Sparkles size={17} aria-hidden="true" />
            </Link>
            <Link className="btn btn-ghost" to="/services">
              了解服务流程
              <BarChart3 size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="home-cta-location">
            <MapPin size={16} aria-hidden="true" />
            <span>重庆出发，服务城市级线下活动与品牌商业现场</span>
          </div>
        </div>
      </section>
    </Layout>
  )
}
