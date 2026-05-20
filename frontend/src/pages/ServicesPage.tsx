import { Layout } from '../components/Layout'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const CAPABILITIES = [
  {
    title: '创意与策略',
    desc: '基于品牌目标与受众洞察，输出主题概念、视觉体系与传播主张。',
    items: ['活动主题与主视觉', '互动玩法与动线', '传播内容与节奏'],
  },
  {
    title: '场景与舞美',
    desc: '从空间规划到舞美落地，兼顾审美表达与现场动线效率。',
    items: ['空间规划与分区', '装置与舞美搭建', '灯光音响与控台'],
  },
  {
    title: '供应链协作',
    desc: '整合供应商与制作资源，交付可控的成本、周期与品质。',
    items: ['物料清单与打样', '制作与交付管理', '成本与风险控制'],
  },
  {
    title: '活动传播',
    desc: '联动线上线下传播资源，提升到场率、停留时长与话题热度。',
    items: ['短视频/图文素材', '媒体与KOL协同', '现场内容采集'],
  },
  {
    title: '现场运营',
    desc: '执行、控场、应急到复盘，全流程保障活动稳定与体验一致。',
    items: ['人员与排班', '控场与应急预案', '复盘与数据沉淀'],
  },
] as const

const PROCESS = [
  { title: '需求澄清', desc: '明确目标、预算、周期与关键约束。' },
  { title: '方案输出', desc: '概念创意、空间规划、执行清单与报价。' },
  { title: '制作搭建', desc: '供应链对接、制作排期与进度验收。' },
  { title: '现场执行', desc: '彩排、控场、应急与体验优化。' },
  { title: '复盘沉淀', desc: '数据归档、内容整理与可复用模板。' },
] as const

const SERVICE_STATS = [
  { value: '01', label: '策略先行' },
  { value: '05', label: '核心交付模块' },
  { value: '全程', label: '项目经理制' },
] as const

const SERVICE_MODELS = [
  {
    title: '整包交付',
    desc: '适合品牌发布、城市嘉年华、赛事商业配套等需要从方案到现场完整落地的项目。',
  },
  {
    title: '联合共创',
    desc: '与品牌市场、公关、场地方团队协同，承接创意细化、现场体验与供应链执行。',
  },
  {
    title: '专项执行',
    desc: '聚焦舞美搭建、商户招募、现场运营、内容采集等单项能力，快速补齐项目短板。',
  },
] as const

const GUARANTEES = [
  { title: '项目经理制', desc: '单点对接，节点明确，推进可追踪。' },
  { title: '风险预案', desc: '天气/人流/设备/供应链多场景预案。' },
  { title: '现场体验', desc: '动线、排队、导视、互动环节体验打磨。' },
  { title: '合规与安全', desc: '搭建与用电安全、人员动线与秩序管理。' },
] as const

const FAQ = [
  { q: '我们适合哪些活动类型？', a: '大型赛事、城市嘉年华、潮流集市、品牌路演与企业年会等线下活动。' },
  { q: '如何评估预算与排期？', a: '我们会基于场地、规模、舞美与传播需求给出分项报价与排期甘特建议。' },
  { q: '是否支持异地执行？', a: '支持。根据城市与供应链情况调整方案与交付节奏。' },
] as const

export function ServicesPage() {
  return (
    <Layout>
      <section className="services-hero page-hero page-hero-services">
        <div className="container page-hero-inner">
          <div className="page-hero-copy">
            <p className="services-eyebrow page-hero-eyebrow">服务能力</p>
            <h1 className="services-title page-hero-title">覆盖活动全链路的交付体系</h1>
            <p className="services-sub page-hero-sub">
              从创意策略到现场运营，支持大型赛事、城市嘉年华、潮流集市、企业年会与品牌活动。
            </p>
            <div className="services-actions page-hero-actions">
              <Link className="btn" to="/contact">
                发起合作咨询
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="btn btn-ghost" to="/cases">
                查看案例
              </Link>
            </div>
          </div>
          <div className="page-hero-stats" aria-label="服务能力概览">
            {SERVICE_STATS.map((item) => (
              <div className="page-hero-stat" key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="services-section-header">
            <p className="section-kicker">Capability Matrix</p>
            <h2>能力矩阵</h2>
            <p>把复杂的执行拆成可复用的模块，让交付更稳定、更可控。</p>
          </header>
          <div className="services-cap-grid">
            {CAPABILITIES.map((c, idx) => (
              <article className="services-cap-card" key={c.title} data-accent={idx % 5}>
                <span className="services-cap-index">{String(idx + 1).padStart(2, '0')}</span>
                <h3>{c.title}</h3>
                <p className="services-cap-desc">{c.desc}</p>
                <ul className="services-cap-items">
                  {c.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section service-models-section">
        <div className="container">
          <header className="services-section-header">
            <p className="section-kicker">Cooperation</p>
            <h2>合作模式</h2>
            <p>根据客户团队成熟度、项目周期与预算边界，选择最合适的协作方式。</p>
          </header>
          <div className="service-model-grid">
            {SERVICE_MODELS.map((model) => (
              <article className="service-model-card" key={model.title}>
                <CheckCircle2 size={20} aria-hidden="true" />
                <h3>{model.title}</h3>
                <p>{model.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <header className="services-section-header">
            <p className="section-kicker">Delivery Process</p>
            <h2>标准交付流程</h2>
            <p>用清晰的节点与验收口径，减少不确定性。</p>
          </header>
          <ol className="services-process">
            {PROCESS.map((s, i) => (
              <li className="services-process-step" key={s.title}>
                <span className="services-step-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <div className="services-step-title">{s.title}</div>
                  <div className="services-step-desc">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="services-section-header">
            <p className="section-kicker">Assurance</p>
            <h2>交付保障</h2>
            <p>以项目制管理与现场经验，确保每个环节可落地。</p>
          </header>
          <div className="services-guarantee-grid">
            {GUARANTEES.map((g) => (
              <article className="services-guarantee" key={g.title}>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <header className="services-section-header">
            <p className="section-kicker">FAQ</p>
            <h2>常见问题</h2>
            <p>如果你不确定从哪里开始，可以先从这些问题切入。</p>
          </header>
          <div className="services-faq">
            {FAQ.map((f) => (
              <details className="services-faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="services-cta">
        <div className="container services-cta-inner">
          <div>
            <h2>准备开始一次更稳的线下活动？</h2>
            <p>把目标、预算、周期发给我们，我们会给你一份可执行的方案框架。</p>
          </div>
          <div className="services-actions">
            <Link className="btn" to="/contact">
              立即咨询
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="btn btn-ghost" to="/merchant-signup">
              商户报名
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}
