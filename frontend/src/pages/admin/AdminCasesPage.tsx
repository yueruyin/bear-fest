import { useEffect, useMemo, useState } from 'react'
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

export function AdminCasesPage() {
  const [items, setItems] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [publishStatus, setPublishStatus] = useState('')

  const [editing, setEditing] = useState<CaseItem | null>(null)
  const [form, setForm] = useState<CaseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (publishStatus) params.set('publish_status', publishStatus)
    params.set('page', '1')
    params.set('page_size', '50')
    return params.toString()
  }, [q, publishStatus])

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

  const startEdit = (it: CaseItem) => {
    setEditing(it)
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
  }

  const onSave = async () => {
    setSaving(true)
    setMsg('')
    setError('')
    try {
      if (!form.title.trim() || !form.slug.trim()) throw new Error('title/slug 必填')
      if (editing) {
        await adminFetch(`/api/admin/cases/${editing.id}`, {
          method: 'PUT',
          json: {
            title: form.title,
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
            title: form.title,
            slug: form.slug,
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
          <p className="admin-page-sub">创建/编辑/发布案例；公开端仅展示 published。</p>
        </div>
        <button type="button" className="admin-primary-btn admin-inline-btn" onClick={startCreate}>
          新建案例
        </button>
      </div>

      {msg ? <div className="admin-success">{msg}</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-toolbar">
        <label className="admin-filter admin-filter-grow">
          <span>搜索</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="标题/slug" />
        </label>
        <label className="admin-filter">
          <span>状态</span>
          <select value={publishStatus} onChange={(e) => setPublishStatus(e.target.value)}>
            <option value="">全部</option>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
      </div>

      <div className="admin-split">
        <div className="admin-card">
          <div className="admin-card-title">列表</div>
          {loading ? <div>加载中…</div> : null}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>标题</th>
                  <th>slug</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id}>
                    <td>{it.id}</td>
                    <td>{it.title}</td>
                    <td>{it.slug}</td>
                    <td>{it.publish_status}</td>
                    <td className="admin-actions">
                      <button className="admin-link-btn" onClick={() => startEdit(it)}>
                        编辑
                      </button>
                      <button className="admin-link-btn admin-danger" onClick={() => onDelete(it)}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      暂无数据
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-title">{editing ? `编辑 #${editing.id}` : '新建案例'}</div>

          <div className="admin-form">
            <label className="admin-field">
              <span>标题</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>

            <label className="admin-field">
              <span>slug（创建后不可改）</span>
              <input
                value={form.slug}
                disabled={!!editing}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>类型 event_type</span>
              <input
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>封面图 URL</span>
              <input
                value={form.cover_image_url}
                onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>摘要</span>
              <textarea
                className="admin-textarea"
                rows={4}
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>gallery_urls（JSON 数组字符串）</span>
              <textarea
                className="admin-textarea"
                rows={4}
                value={form.gallery_urls}
                onChange={(e) => setForm({ ...form, gallery_urls: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>tags（JSON 数组字符串）</span>
              <textarea
                className="admin-textarea"
                rows={3}
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>SEO 标题</span>
              <input
                value={form.seo_title}
                onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>SEO 描述</span>
              <textarea
                className="admin-textarea"
                rows={3}
                value={form.seo_description}
                onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
              />
            </label>

            <label className="admin-field">
              <span>发布状态</span>
              <select
                value={form.publish_status}
                onChange={(e) => setForm({ ...form, publish_status: e.target.value })}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>

            <button
              type="button"
              className="admin-primary-btn admin-inline-btn"
              onClick={onSave}
              disabled={saving}
            >
              {saving ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

