import { useEffect, useMemo, useState } from 'react'
import { Save } from 'lucide-react'
import { adminFetch } from '../../admin/api'

type SiteConfigOut = {
  id: number
  home_hero_title: string
  home_hero_subtitle: string
  service_highlights: string
  contact_channels: string
  updated_at: string
}

function jsonArrayToLines(value: string) {
  try {
    const parsed = JSON.parse(value || '[]')
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string').join('\n')
    }
  } catch {
    // fall back to raw value below
  }
  return value || ''
}

function linesToJsonArray(value: string) {
  return JSON.stringify(
    value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

function parseContactChannels(value: string) {
  try {
    const parsed = JSON.parse(value || '{}') as Record<string, string>
    return {
      email: parsed.email || '',
      wechat: parsed.wechat || '',
      phone: parsed.phone || '',
    }
  } catch {
    return { email: '', wechat: '', phone: '' }
  }
}

export function AdminSiteConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [config, setConfig] = useState<SiteConfigOut | null>(null)

  const [homeHeroTitle, setHomeHeroTitle] = useState('')
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState('')
  const [serviceHighlightsText, setServiceHighlightsText] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactWechat, setContactWechat] = useState('')
  const [contactPhone, setContactPhone] = useState('')

  const canSave = useMemo(() => {
    return homeHeroTitle.trim().length > 0 && homeHeroSubtitle.trim().length > 0
  }, [homeHeroTitle, homeHeroSubtitle])

  useEffect(() => {
    setLoading(true)
    setError('')
    adminFetch<SiteConfigOut>('/api/admin/site-config')
      .then((data) => {
        setConfig(data)
        setHomeHeroTitle(data.home_hero_title || '')
        setHomeHeroSubtitle(data.home_hero_subtitle || '')
        setServiceHighlightsText(jsonArrayToLines(data.service_highlights || '[]'))
        const contacts = parseContactChannels(data.contact_channels || '{}')
        setContactEmail(contacts.email)
        setContactWechat(contacts.wechat)
        setContactPhone(contacts.phone)
      })
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setLoading(false))
  }, [])

  const onSave = async () => {
    if (!canSave) return
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const updated = await adminFetch<SiteConfigOut>('/api/admin/site-config', {
        method: 'PUT',
        json: {
          home_hero_title: homeHeroTitle,
          home_hero_subtitle: homeHeroSubtitle,
          service_highlights: linesToJsonArray(serviceHighlightsText),
          contact_channels: JSON.stringify({
            email: contactEmail.trim(),
            wechat: contactWechat.trim(),
            phone: contactPhone.trim(),
          }),
        },
      })
      setConfig(updated)
      setMsg('保存成功。')
    } catch (e: any) {
      setError(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading">正在加载站点内容…</div>
  if (error) return <div className="admin-error">{error}</div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">站点配置</h1>
          <p className="admin-page-sub">维护首页标题、服务亮点和对外联系方式。</p>
        </div>
        <button
          type="button"
          className="admin-primary-btn admin-inline-btn"
          onClick={onSave}
          disabled={saving || !canSave}
        >
          {saving ? '保存中…' : '保存修改'}
          {saving ? null : <Save size={17} aria-hidden="true" />}
        </button>
      </div>

      {msg ? <div className="admin-success">{msg}</div> : null}

      <div className="admin-grid admin-grid-comfort">
        <div className="admin-card">
          <div className="admin-card-title">首页主视觉文案</div>
          <div className="admin-card-help">这些内容会显示在官网首页第一屏，建议简洁、有记忆点。</div>
          <label className="admin-field">
            <span>首页大标题</span>
            <input value={homeHeroTitle} onChange={(e) => setHomeHeroTitle(e.target.value)} />
          </label>
          <label className="admin-field">
            <span>首页说明文字</span>
            <input
              value={homeHeroSubtitle}
              onChange={(e) => setHomeHeroSubtitle(e.target.value)}
            />
          </label>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">服务亮点</div>
          <div className="admin-card-help">一行写一个亮点，例如：创意设计、场景搭建、现场运营。</div>
          <textarea
            className="admin-textarea"
            value={serviceHighlightsText}
            onChange={(e) => setServiceHighlightsText(e.target.value)}
            rows={8}
          />
        </div>

        <div className="admin-card">
          <div className="admin-card-title">联系方式</div>
          <div className="admin-card-help">用于后续统一展示或对接客户，不需要填写代码格式。</div>
          <label className="admin-field">
            <span>商务邮箱</span>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </label>
          <label className="admin-field">
            <span>微信号</span>
            <input value={contactWechat} onChange={(e) => setContactWechat(e.target.value)} />
          </label>
          <label className="admin-field">
            <span>联系电话</span>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
          </label>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">保存提示</div>
          <div className="admin-card-help">
            保存后前台页面会使用最新内容。修改首页大标题和说明文字时，建议保存后点击左侧“查看前台网站”确认效果。
          </div>
          <div className="admin-summary-box">
            <span>最后更新时间</span>
            <strong>{config?.updated_at || '暂无'}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
