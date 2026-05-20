import { Layout } from '../components/Layout'
import { ArrowRight, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const CULTURE = [
  { title: '创新', desc: '用更年轻的表达，把内容、场景与传播做成一体化体验。' },
  { title: '效率', desc: '模块化交付与节点管理，让执行稳定、成本透明、风险可控。' },
  { title: '服务', desc: '从目标到落地，持续跟进并在复盘中沉淀可复用的方法。' },
  { title: '责任', desc: '对安全、合规与现场体验负责，对交付结果负责。' },
] as const

const TEAM = [
  { name: '市场负责人', title: '市场与增长', desc: '渠道拓展、合作洽谈与资源整合，推动业务增长。' },
  { name: '策划负责人', title: '创意与方案', desc: '活动策略、主题创意与全案策划，把目标转成可执行方案。' },
  { name: '财务负责人', title: '预算与风控', desc: '预算管理、成本核算与合同风控，保障交付稳定可控。' },
  { name: '执行负责人', title: '现场交付', desc: '供应链协调、搭建执行与控场应急，确保落地质量与体验。' },
  { name: '技术负责人', title: '系统与数据', desc: '报名/线索/后台系统建设与数据支撑，提升协同效率。' },
] as const

const MILESTONES = [
  { time: '起点', title: '小熊集市', desc: '从城市线下消费场景出发，积累商户组织、现场运营与活动内容经验。' },
  { time: '升级', title: '全案交付', desc: '把创意、视觉、搭建、招商、传播和复盘整合成可复制的项目体系。' },
  { time: '现在', title: '城市活动平台', desc: '面向赛事、嘉年华、品牌活动和企业年会，提供更系统的商业活动解决方案。' },
] as const

const ECOSYSTEM = [
  '商业运营平台资源',
  '本地供应链协同',
  '内容传播与素材沉淀',
  '报名、线索与案例后台管理',
] as const

export function AboutPage() {
  return (
    <Layout>
      <section className="about-hero page-hero page-hero-about">
        <div className="container page-hero-inner">
          <div className="page-hero-copy">
            <p className="about-eyebrow page-hero-eyebrow">关于我们</p>
            <h1 className="about-title page-hero-title">让城市活动更有记忆点</h1>
            <p className="about-sub page-hero-sub">
              我们聚焦大型赛事、主题嘉年华、潮流集市、企业年会与品牌活动，用全链路交付把灵感落成现场体验。
            </p>
            <div className="about-actions page-hero-actions">
              <Link className="btn" to="/contact">
                发起合作咨询
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link className="btn btn-ghost" to="/cases">
                查看案例
              </Link>
            </div>
          </div>
          <div className="page-hero-stats" aria-label="团队定位">
            <div className="page-hero-stat">
              <strong>商务委</strong>
              <span>旗下商业运营平台</span>
            </div>
            <div className="page-hero-stat">
              <strong>小熊集市</strong>
              <span>线下活动经验来源</span>
            </div>
            <div className="page-hero-stat">
              <strong>全链路</strong>
              <span>策划、搭建、运营、复盘</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="about-section-header">
            <p className="section-kicker">Culture</p>
            <h2>公司文化</h2>
            <p>
              小熊团队系重庆市商务委旗下商业运营平台，其前身为广受关注的「小熊集市」。我们希望把内容表达、
              场景搭建与现场运营整合成更可控的交付体系。
            </p>
          </header>

          <div className="about-values">
            {CULTURE.map((v) => (
              <article className="about-card" key={v.title}>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <header className="about-section-header">
            <p className="section-kicker">Team Structure</p>
            <h2>团队结构</h2>
            <p>一个活动的稳定交付，依赖分工清晰的团队协作与现场经验。</p>
          </header>
          <div className="about-team">
            {TEAM.map((m) => (
              <article className="about-member" key={m.name}>
                <div className="about-avatar" aria-hidden="true" />
                <div className="about-member-name">{m.name}</div>
                <div className="about-member-title">{m.title}</div>
                <p className="about-member-desc">{m.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-muted">
        <div className="container">
          <header className="about-section-header">
            <p className="section-kicker">Milestones</p>
            <h2>从小熊集市到城市活动交付平台</h2>
            <p>对外介绍时，我们更希望客户看到的是持续沉淀的活动方法，而不是一次性的现场执行。</p>
          </header>
          <div className="about-timeline">
            {MILESTONES.map((item) => (
              <article className="about-timeline-item" key={item.title}>
                <span>{item.time}</span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container about-ecosystem">
          <header className="about-section-header">
            <p className="section-kicker">Ecosystem</p>
            <h2>把资源、执行与数据放在同一张项目表里</h2>
            <p>客户需要看到的不只是现场好看，还包括合作资源、交付节奏和后续复盘是否能被持续管理。</p>
          </header>
          <div className="about-ecosystem-grid">
            {ECOSYSTEM.map((item) => (
              <div className="about-ecosystem-item" key={item}>
                <BadgeCheck size={18} aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="about-ecosystem-media" aria-label="城市活动现场图集">
            <img src="/case-carousel/page31_img01.jpeg" alt="城市活动现场展示" />
            <img src="/case-carousel/page25_img01.jpeg" alt="品牌活动现场展示" />
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="container about-cta-inner">
          <div>
            <h2>一起把灵感落成现场</h2>
            <p>合作咨询、资源对接或商户报名，都欢迎联系我们。</p>
          </div>
          <div className="about-actions">
            <Link className="btn" to="/contact">
              立即咨询
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="btn btn-ghost" to="/cases">
              查看案例
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}
