import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '../../admin/api'

type FileItem = { id: number; file_url: string; file_name: string | null; created_at: string }
type SignupItem = {
  id: number
  contact_name: string
  brand_name: string | null
  phone_or_email: string
  business_details: string
  status: string
  created_at: string
  files: FileItem[]
}

const STATUSES = ['new', 'processing', 'done', 'archived'] as const

export function AdminMerchantSignupsPage() {
  const [items, setItems] = useState<SignupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState<string>('')
  const [q, setQ] = useState('')

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    params.set('page', '1')
    params.set('page_size', '50')
    return params.toString()
  }, [q, status])

  const load = () => {
    setLoading(true)
    setError('')
    adminFetch<SignupItem[]>(`/api/admin/merchant-signups?${queryString}`)
      .then(setItems)
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const updateStatus = async (id: number, next: string) => {
    await adminFetch<SignupItem>(`/api/admin/merchant-signups/${id}`, {
      method: 'PATCH',
      json: { status: next },
    })
    load()
  }

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    return `/api/admin/export/merchant-signups.csv?${params.toString()}`
  }, [q, status])

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">商户报名</h1>
          <p className="admin-page-sub">查看报名信息与上传附件，支持筛选与状态流转。</p>
        </div>
        <a className="admin-ghost-btn admin-inline-btn" href={exportUrl}>
          导出 CSV
        </a>
      </div>

      <div className="admin-toolbar">
        <label className="admin-filter">
          <span>状态</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-filter admin-filter-grow">
          <span>搜索</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="联系人/品牌/联系方式/描述"
          />
        </label>
      </div>

      {loading ? <div>加载中…</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-list">
        {items.map((it) => (
          <div className="admin-card admin-card-row" key={it.id}>
            <div className="admin-row-head">
              <div className="admin-row-title">
                <span className="admin-row-id">#{it.id}</span>
                <span>{it.contact_name}</span>
                {it.brand_name ? <span className="admin-row-muted">· {it.brand_name}</span> : null}
              </div>
              <select value={it.status} onChange={(e) => updateStatus(it.id, e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-row-meta">
              <div>
                <div className="admin-meta-k">联系方式</div>
                <div className="admin-meta-v">{it.phone_or_email}</div>
              </div>
              <div>
                <div className="admin-meta-k">创建时间</div>
                <div className="admin-meta-v">{it.created_at}</div>
              </div>
              <div className="admin-meta-wide">
                <div className="admin-meta-k">业务描述</div>
                <div className="admin-meta-v admin-pre">{it.business_details}</div>
              </div>
            </div>

            <div className="admin-row-files">
              <div className="admin-meta-k">附件</div>
              {it.files?.length ? (
                <div className="admin-files">
                  {it.files.map((f) => (
                    <a
                      key={f.id}
                      className="admin-file"
                      href={f.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {f.file_name || f.file_url}
                    </a>
                  ))}
                </div>
              ) : (
                <div className="admin-meta-v admin-row-muted">无</div>
              )}
            </div>
          </div>
        ))}

        {items.length === 0 ? <div className="admin-empty">暂无数据</div> : null}
      </div>
    </div>
  )
}

