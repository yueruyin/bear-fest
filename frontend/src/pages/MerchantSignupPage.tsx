import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../api'
import { Layout } from '../components/Layout'
import type { MerchantSignupForm } from '../types'

export function MerchantSignupPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<MerchantSignupForm>({
    contact_name: '',
    brand_name: '',
    phone_or_email: '',
    business_details: '',
  })
  const [files, setFiles] = useState<File[]>([])

  const onChange = (key: keyof MerchantSignupForm, value: string) =>
    setForm((prev: MerchantSignupForm) => ({ ...prev, [key]: value }))

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('contact_name', form.contact_name)
      formData.append('brand_name', form.brand_name)
      formData.append('phone_or_email', form.phone_or_email)
      formData.append('business_details', form.business_details)
      for (const file of files) {
        formData.append('files', file)
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/merchant-signups`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        throw new Error('submit failed')
      }
      setMessage('提交成功，我们会尽快与你联系。')
      setForm({ contact_name: '', brand_name: '', phone_or_email: '', business_details: '' })
      setFiles([])
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
          <h1>商户报名</h1>
          <p className="meta page-intro">
            欢迎品牌方、摊主及合作伙伴在线提交报名信息。请如实填写以下内容，便于我们与你对接场次与资源。
          </p>
          <form className="contact-form" onSubmit={onSubmit}>
            <label>
              联系人姓名
              <input
                value={form.contact_name}
                onChange={(e) => onChange('contact_name', e.target.value)}
                required
              />
            </label>
            <label>
              品牌 / 店铺名称
              <input
                value={form.brand_name}
                onChange={(e) => onChange('brand_name', e.target.value)}
                placeholder="选填"
              />
            </label>
            <label>
              手机或邮箱
              <input
                value={form.phone_or_email}
                onChange={(e) => onChange('phone_or_email', e.target.value)}
                required
              />
            </label>
            <label>
              经营品类与报名说明
              <textarea
                value={form.business_details}
                onChange={(e) => onChange('business_details', e.target.value)}
                placeholder="例如：主营品类、意向场次城市、摊位或合作需求等（不少于 10 字）"
                minLength={10}
                required
              />
            </label>
            <label className="file-uploader">
              <input
                className="file-input"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              <div className="file-ui">
                <div className="file-title">店铺图片（可多选）</div>
                <div className="file-subtitle">点击选择图片，支持多张</div>
                {files.length > 0 ? (
                  <div className="file-meta">
                    已选择 <strong>{files.length}</strong> 张
                  </div>
                ) : (
                  <div className="file-meta file-meta-muted">未选择文件</div>
                )}
                {files.length > 0 ? (
                  <div className="file-names" aria-label="已选择的文件列表">
                    {files.slice(0, 3).map((f) => (
                      <span key={`${f.name}-${f.size}`} className="file-name-pill">
                        {f.name}
                      </span>
                    ))}
                    {files.length > 3 ? (
                      <span className="file-name-pill file-name-pill-more">
                        +{files.length - 3} 更多
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </label>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? '提交中...' : '提交报名'}
            </button>
            {message ? <p className="form-msg">{message}</p> : null}
            <p className="meta page-form-footnote">
              也可直接 <Link to="/contact">联系我们</Link> 沟通定制需求。
            </p>
          </form>
        </div>
      </section>
    </Layout>
  )
}
