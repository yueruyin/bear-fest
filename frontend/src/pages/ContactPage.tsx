import { type FormEvent, useState } from 'react'
import { API_BASE_URL } from '../api'
import { Layout } from '../components/Layout'
import type { LeadForm } from '../types'

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
