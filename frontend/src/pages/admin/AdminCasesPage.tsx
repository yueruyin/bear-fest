import { useEffect, useMemo, useState } from 'react'
import { Edit3, Image, Plus, Save, Search, Trash2 } from 'lucide-react'
import { adminFetch } from '../../admin/api'

type CaseItem = {
  id: number
  title: string
  slug: string
  event_type: string
  summary: string
  cover_image_url: string
  publish_status: string
  published_at: string | null
  created_at: string
  updated_at: string
}

type CaseDetail = CaseItem & {
  gallery_urls: string
  tags: string
  seo_title: string
  seo_description: string
}

type CaseForm = {
  title: string
  slug: string
  event_type: string
  summary: string
  cover_image_url: string
  gallery_urls: string
  tags: string
  seo_title: string
  seo_description: string
  publish_status: string
  published_at: string | null
}

const emptyForm: CaseForm = {
  title: '',
  slug: '',
  event_type: 'sports',
  summary: '',
  cover_image_url: '',
  gallery_urls: '[]',
  tags: '[]',
  seo_title: '',
  seo_description: '',
  publish_status: 'draft',
  published_at: null,
}

const EVENT_TYPES = [
  { value: 'sports', label: '赛事活动' },
  { value: 'carnival', label: '城市嘉年华' },
  { value: 'market', label: '潮流集市' },
  { value: 'annual', label: '企业年会' },
  { value: 'brand', label: '品牌活动' },
] as const

const PUBLISH_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', help: '前台暂不展示' },
  { value: 'published', label: '已发布', help: '前台可见' },
] as const

const CASE_FALLBACK_IMAGES: Record<string, string> = {
  sports: '/case-carousel/page18_img01.jpeg',
  carnival: '/case-carousel/page22_img01.jpeg',
  market: '/case-carousel/page30_img01.jpeg',
  annual: '/case-carousel/page12_img01.jpeg',
  brand: '/case-carousel/page25_img01.jpeg',
  default: '/case-carousel/page31_img01.jpeg',
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

function getEventTypeLabel(value: string) {
  return EVENT_TYPES.find((item) => item.value === value)?.label || value || '未分类'
}

function getPublishStatusLabel(value: string) {
  return PUBLISH_STATUS_OPTIONS.find((item) => item.value === value)?.label || value || '未知状态'
}

function getCaseImage(item: Pick<CaseItem, 'event_type' | 'cover_image_url'>) {
  if (item.cover_image_url && !item.cover_image_url.includes('example.com')) {
    return item.cover_image_url
  }
  return CASE_FALLBACK_IMAGES[item.event_type] || CASE_FALLBACK_IMAGES.default
}

function createSlug(title: string) {
  const ascii = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return ascii || `case-${Date.now().toString(36)}`
}

export function AdminCasesPage() {
  const [items, setItems] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [publishStatus, setPublishStatus] = useState('')
  const [eventType, setEventType] = useState('')

  const [editing, setEditing] = useState<CaseItem | null>(null)
  const [form, setForm] = useState<CaseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [detailLoading, setDetailLoading] = useState(false)

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (publishStatus) params.set('publish_status', publishStatus)
    if (eventType) params.set('event_type', eventType)
    params.set('page', '1')
    params.set('page_size', '50')
    return params.toString()
  }, [q, publishStatus, eventType])

  const load = () => {
    setLoading(true)
    setError('')
    adminFetch<CaseItem[]>(`/api/admin/cases?${queryString}`)
      .then(setItems)
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const startCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setMsg('')
    setError('')
  }

  const startEdit = async (it: CaseItem) => {
    setEditing(it)
    setDetailLoading(true)
    setForm({
      ...emptyForm,
      title: it.title,
      slug: it.slug,
      event_type: it.event_type,
      summary: it.summary,
      cover_image_url: it.cover_image_url,
      publish_status: it.publish_status,
      published_at: it.published_at,
    })
    setMsg('')
    setError('')

    try {
      const detail = await adminFetch<CaseDetail>(`/api/admin/cases/${it.id}`)
      setForm({
        ...emptyForm,
        title: detail.title,
        slug: detail.slug,
        event_type: detail.event_type,
        summary: detail.summary,
        cover_image_url: detail.cover_image_url,
        gallery_urls: detail.gallery_urls || '[]',
        tags: detail.tags || '[]',
        seo_title: detail.seo_title || '',
        seo_description: detail.seo_description || '',
        publish_status: detail.publish_status,
        published_at: detail.published_at,
      })
    } catch (e: any) {
      setError(e?.message || '加载详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const onSave = async () => {
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const title = form.title.trim()
      const slug = form.slug.trim() || createSlug(title)
      if (!title) throw new Error('请先填写案例标题')
      if (editing) {
        await adminFetch(`/api/admin/cases/${editing.id}`, {
          method: 'PUT',
          json: {
            title,
            event_type: form.event_type,
            summary: form.summary,
            cover_image_url: form.cover_image_url,
            gallery_urls: form.gallery_urls,
            tags: form.tags,
            seo_title: form.seo_title,
            seo_description: form.seo_description,
            publish_status: form.publish_status,
            published_at: form.published_at,
          },
        })
        setMsg('更新成功。')
      } else {
        await adminFetch('/api/admin/cases', {
          method: 'POST',
          json: {
            title,
            slug,
            event_type: form.event_type,
            summary: form.summary,
            cover_image_url: form.cover_image_url,
            gallery_urls: form.gallery_urls,
            tags: form.tags,
            seo_title: form.seo_title,
            seo_description: form.seo_description,
            publish_status: form.publish_status,
          },
        })
        setMsg('创建成功。')
      }
      load()
    } catch (e: any) {
      setError(e?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (it: CaseItem) => {
    if (!confirm(`确认删除案例「${it.title}」？`)) return
    try {
      await adminFetch(`/api/admin/cases/${it.id}`, { method: 'DELETE' })
      setMsg('删除成功。')
      if (editing?.id === it.id) startCreate()
      load()
    } catch (e: any) {
      setError(e?.message || '删除失败')
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">案例管理</h1>
          <p className="admin-page-sub">维护官网案例。草稿不会展示，发布后客户可在前台看到。</p>
        </div>
        <button type="button" className="admin-primary-btn admin-inline-btn" onClick={startCreate}>
          <Plus size={17} aria-hidden="true" />
          新建案例
        </button>
      </div>

      {msg ? <div className="admin-success">{msg}</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-toolbar">
        <label className="admin-filter admin-filter-grow">
          <span>搜索案例</span>
          <div className="admin-input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="输入案例标题关键词" />
          </div>
        </label>
        <label className="admin-filter">
          <span>活动类型</span>
          <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
            <option value="">全部类型</option>
            {EVENT_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-filter">
          <span>展示状态</span>
          <select value={publishStatus} onChange={(e) => setPublishStatus(e.target.value)}>
            <option value="">全部状态</option>
            {PUBLISH_STATUS_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-split admin-editor-layout">
        <div className="admin-card">
          <div className="admin-card-title">案例列表</div>
          <div className="admin-card-help">点击“编辑”后，右侧会显示该案例的内容。</div>
          {loading ? <div className="admin-loading">正在加载案例…</div> : null}
          <div className="admin-case-list">
            {items.map((it) => (
              <article
                className={`admin-case-item${editing?.id === it.id ? ' active' : ''}`}
                key={it.id}
              >
                <img src={getCaseImage(it)} alt="" />
                <div className="admin-case-item-body">
                  <div className="admin-case-item-top">
                    <span className={`admin-status-pill status-${it.publish_status}`}>
                      {getPublishStatusLabel(it.publish_status)}
                    </span>
                    <span className="admin-muted">{getEventTypeLabel(it.event_type)}</span>
                  </div>
                  <h3>{it.title}</h3>
                  <p>{it.summary || '暂无摘要'}</p>
                  <div className="admin-case-actions">
                    <button
                      className="admin-link-btn"
                      onClick={() => startEdit(it)}
                      disabled={detailLoading && editing?.id === it.id}
                    >
                      <Edit3 size={15} aria-hidden="true" />
                      编辑
                    </button>
                    <button className="admin-link-btn admin-danger" onClick={() => onDelete(it)}>
                      <Trash2 size={15} aria-hidden="true" />
                      删除
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {items.length === 0 ? <div className="admin-empty">暂无案例</div> : null}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">{editing ? `编辑案例：${editing.title}` : '新建案例'}</div>
          <div className="admin-card-help">
            标题、类型、摘要和封面图是前台最容易被客户看到的内容，请优先完善。
          </div>
          {detailLoading && editing ? <div className="admin-loading">正在加载详情…</div> : null}

          <div className="admin-form">
            <div className="admin-form-section">
              <div className="admin-form-section-title">基础信息</div>
              <label className="admin-field">
                <span>案例标题</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="例如：WTT 重庆站大型赛事执行案例"
                />
              </label>

              <div className="admin-two-col">
                <label className="admin-field">
                  <span>活动类型</span>
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  >
                    {EVENT_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>前台展示状态</span>
                  <select
                    value={form.publish_status}
                    onChange={(e) => setForm({ ...form, publish_status: e.target.value })}
                  >
                    {PUBLISH_STATUS_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}（{item.help}）
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="admin-field">
                <span>案例摘要</span>
                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="用 1-2 句话说明项目目标、交付内容或结果。"
                />
              </label>
            </div>

            <div className="admin-form-section">
              <div className="admin-form-section-title">图片素材</div>
              <label className="admin-field">
                <span>封面图地址</span>
                <div className="admin-input-with-icon">
                  <Image size={17} aria-hidden="true" />
                  <input
                    value={form.cover_image_url}
                    onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
                    placeholder="粘贴图片 URL；不填会使用默认案例图"
                  />
                </div>
              </label>

              <label className="admin-field">
                <span>图集图片地址</span>
                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={jsonArrayToLines(form.gallery_urls)}
                  onChange={(e) => setForm({ ...form, gallery_urls: linesToJsonArray(e.target.value) })}
                  placeholder={'一行一个图片 URL\nhttps://example.com/image-1.jpg\nhttps://example.com/image-2.jpg'}
                />
              </label>
            </div>

            <div className="admin-form-section">
              <div className="admin-form-section-title">标签和搜索展示</div>
              <label className="admin-field">
                <span>案例标签</span>
                <textarea
                  className="admin-textarea"
                  rows={3}
                  value={jsonArrayToLines(form.tags)}
                  onChange={(e) => setForm({ ...form, tags: linesToJsonArray(e.target.value) })}
                  placeholder={'一行一个标签，例如：\n赛事\n城市活动\n现场运营'}
                />
              </label>

              <details className="admin-advanced-settings">
                <summary>高级设置：页面地址与搜索引擎文案</summary>
                <label className="admin-field">
                  <span>页面地址</span>
                  <input
                    value={form.slug}
                    disabled={!!editing}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="可不填，系统会自动生成"
                  />
                </label>
                <label className="admin-field">
                  <span>搜索标题</span>
                  <input
                    value={form.seo_title}
                    onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                    placeholder="不填则默认使用案例标题"
                  />
                </label>
                <label className="admin-field">
                  <span>搜索描述</span>
                  <textarea
                    className="admin-textarea"
                    rows={3}
                    value={form.seo_description}
                    onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                    placeholder="用于搜索结果或分享时展示的说明。"
                  />
                </label>
              </details>
            </div>

            <button
              type="button"
              className="admin-primary-btn admin-inline-btn"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? '保存中…' : editing ? '保存案例' : '创建案例'}
              {saving ? null : <Save size={17} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
