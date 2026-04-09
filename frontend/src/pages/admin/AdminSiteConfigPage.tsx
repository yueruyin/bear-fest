import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '../../admin/api'

type SiteConfigOut = {
  id: number
  home_hero_title: string
  home_hero_subtitle: string
  service_highlights: string
  contact_channels: string
  updated_at: string
}

export function AdminSiteConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [config, setConfig] = useState<SiteConfigOut | null>(null)

  const [homeHeroTitle, setHomeHeroTitle] = useState('')
  const [homeHeroSubtitle, setHomeHeroSubtitle] = useState('')
  const [serviceHighlights, setServiceHighlights] = useState('[]')
  const [contactChannels, setContactChannels] = useState('{}')

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
        setServiceHighlights(data.service_highlights || '[]')
        setContactChannels(data.contact_channels || '{}')
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
          service_highlights: serviceHighlights,
          contact_channels: contactChannels,
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

  if (loading) return <div>加载中…</div>
  if (error) return <div className="admin-error">{error}</div>

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">站点配置</h1>
          <p className="admin-page-sub">配置首页 Hero、服务亮点与联系方式。</p>
        </div>
        <button
          type="button"
          className="admin-primary-btn admin-inline-btn"
          onClick={onSave}
          disabled={saving || !canSave}
        >
          {saving ? '保存中…' : '保存'}
        </button>
      </div>

      {msg ? <div className="admin-success">{msg}</div> : null}

      <div className="admin-grid">
        <div className="admin-card">
          <div className="admin-card-title">首页 Hero</div>
          <label className="admin-field">
            <span>主标题</span>
            <input value={homeHeroTitle} onChange={(e) => setHomeHeroTitle(e.target.value)} />
          </label>
          <label className="admin-field">
            <span>副标题</span>
            <input
              value={homeHeroSubtitle}
              onChange={(e) => setHomeHeroSubtitle(e.target.value)}
            />
          </label>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">服务亮点（JSON 数组字符串）</div>
          <textarea
            className="admin-textarea"
            value={serviceHighlights}
            onChange={(e) => setServiceHighlights(e.target.value)}
            rows={8}
            spellCheck={false}
          />
        </div>

        <div className="admin-card">
          <div className="admin-card-title">联系方式（JSON 对象字符串）</div>
          <textarea
            className="admin-textarea"
            value={contactChannels}
            onChange={(e) => setContactChannels(e.target.value)}
            rows={8}
            spellCheck={false}
          />
          <div className="admin-card-help">例如：{'{"email":"biz@example.com","wechat":"xxx"}'}</div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">当前配置</div>
          <div className="admin-kv">
            <div>id</div>
            <div>{config?.id}</div>
            <div>updated_at</div>
            <div>{config?.updated_at}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

