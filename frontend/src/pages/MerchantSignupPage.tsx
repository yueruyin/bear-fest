import { type FormEvent, useState } from 'react'
import { ArrowRight, Images, Send, Store, UploadCloud } from 'lucide-react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../api'
import { Layout } from '../components/Layout'
import type { MerchantSignupForm } from '../types'

const MERCHANT_POINTS = [
  '品牌与品类初筛',
  '匹配合适场次与动线',
  '现场素材和运营支持',
] as const

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
      <section className="merchant-hero page-hero page-hero-merchant">
        <div className="container page-hero-inner">
          <div className="page-hero-copy">
            <p className="page-hero-eyebrow">商户报名</p>
            <h1 className="page-hero-title">把好品牌带到更合适的城市现场</h1>
            <p className="page-hero-sub">
              欢迎品牌方、摊主及合作伙伴在线提交报名信息，我们会根据活动主题、客群和点位资源进行匹配。
            </p>
          </div>
          <div className="page-hero-stats" aria-label="商户合作流程">
            <div className="page-hero-stat">
              <strong>报名</strong>
              <span>提交品牌信息</span>
            </div>
            <div className="page-hero-stat">
              <strong>筛选</strong>
              <span>匹配场景与品类</span>
            </div>
            <div className="page-hero-stat">
              <strong>入场</strong>
              <span>确认执行细节</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section merchant-section">
        <div className="container contact-layout">
          <aside className="contact-aside merchant-aside">
            <Store size={26} aria-hidden="true" />
            <h2>适合提交的合作信息</h2>
            <p>主营品类、过往摊位或门店照片、意向城市与场次，会帮助我们更快判断匹配度。</p>
            <div className="merchant-point-list">
              {MERCHANT_POINTS.map((item) => (
                <div className="merchant-point" key={item}>
                  <ArrowRight size={15} aria-hidden="true" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </aside>

          <form className="contact-form contact-form-pro" onSubmit={onSubmit}>
            <div className="form-heading">
              <p className="section-kicker">Merchant Brief</p>
              <h2>提交报名信息</h2>
            </div>
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
                <UploadCloud size={22} aria-hidden="true" />
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
                        <Images size={12} aria-hidden="true" />
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
              {loading ? null : <Send size={16} aria-hidden="true" />}
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
