import { type FormEvent, useState } from 'react'
import { ArrowRight, Clock, Mail, MapPin, Phone, Send } from 'lucide-react'
import { API_BASE_URL } from '../api'
import { Layout } from '../components/Layout'
import type { LeadForm } from '../types'

const CONTACT_CHANNELS = [
  { icon: Phone, label: '合作咨询', value: '400-000-0000' },
  { icon: Mail, label: '商务邮箱', value: 'biz@example.com' },
  { icon: Clock, label: '服务时间', value: '周一至周五 09:00-18:00' },
] as const

export function ContactPage() {
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
      <section className="contact-hero page-hero page-hero-contact">
        <div className="container page-hero-inner">
          <div className="page-hero-copy">
            <p className="page-hero-eyebrow">联系我们</p>
            <h1 className="page-hero-title">把项目目标拆成可执行方案</h1>
            <p className="page-hero-sub">
              无论是品牌活动、赛事商业配套、城市嘉年华还是潮流集市，可以先提交需求，我们会尽快对接。
            </p>
          </div>
          <div className="page-hero-stats" aria-label="咨询流程">
            <div className="page-hero-stat">
              <strong>1</strong>
              <span>提交需求</span>
            </div>
            <div className="page-hero-stat">
              <strong>2</strong>
              <span>澄清目标</span>
            </div>
            <div className="page-hero-stat">
              <strong>3</strong>
              <span>输出框架</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section contact-section">
        <div className="container contact-layout">
          <aside className="contact-aside">
            <p className="section-kicker">Business Contact</p>
            <h2>合作入口</h2>
            <p>
              客户展示、商业合作、场地联动、供应链资源与商户入驻，都可以从这里开始。
            </p>
            <div className="contact-channel-list">
              {CONTACT_CHANNELS.map((item) => {
                const Icon = item.icon
                return (
                  <div className="contact-channel" key={item.label}>
                    <Icon size={19} aria-hidden="true" />
                    <div>
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="contact-location">
              <MapPin size={18} aria-hidden="true" />
              <span>重庆本地团队，支持城市级活动项目协同。</span>
            </div>
          </aside>

          <form className="contact-form contact-form-pro" onSubmit={onSubmit}>
            <div className="form-heading">
              <p className="section-kicker">Project Brief</p>
              <h2>提交合作需求</h2>
            </div>
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
                placeholder="例如：活动类型、城市/场地、预计时间、预算范围、想解决的问题等"
                minLength={10}
                required
              />
            </label>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? '提交中...' : '提交咨询'}
              {loading ? null : <Send size={16} aria-hidden="true" />}
            </button>
            {message ? <p className="form-msg">{message}</p> : null}
            <p className="contact-form-note">
              提交后，我们会优先确认项目目标、时间、场地、预算与关键约束。
              <ArrowRight size={14} aria-hidden="true" />
            </p>
          </form>
        </div>
      </section>
    </Layout>
  )
}
