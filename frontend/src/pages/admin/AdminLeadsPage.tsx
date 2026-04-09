import { useEffect, useMemo, useState } from 'react'
import { adminFetch } from '../../admin/api'

type LeadItem = {
  id: number
  name: string
  company: string | null
  phone_or_email: string
  status: string
  source_page: string
  created_at: string
}

const STATUSES = ['new', 'processing', 'done', 'archived'] as const

export function AdminLeadsPage() {
  const [items, setItems] = useState<LeadItem[]>([])
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
    adminFetch<LeadItem[]>(`/api/admin/leads?${queryString}`)
      .then(setItems)
      .catch((e) => setError(e?.message || '加载失败'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const updateStatus = async (id: number, next: string) => {
    await adminFetch<LeadItem>(`/api/admin/leads/${id}`, { method: 'PATCH', json: { status: next } })
    load()
  }

  const exportUrl = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    return `/api/admin/export/leads.csv?${params.toString()}`
  }, [q, status])

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">联系我们线索</h1>
          <p className="admin-page-sub">查看、筛选并更新处理状态。</p>
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="姓名/公司/手机号或邮箱" />
        </label>
      </div>

      {loading ? <div>加载中…</div> : null}
      {error ? <div className="admin-error">{error}</div> : null}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>姓名</th>
              <th>公司</th>
              <th>联系方式</th>
              <th>来源</th>
              <th>创建时间</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{it.name}</td>
                <td>{it.company || '-'}</td>
                <td>{it.phone_or_email}</td>
                <td>{it.source_page}</td>
                <td>{it.created_at}</td>
                <td>
                  <select
                    value={it.status}
                    onChange={(e) => updateStatus(it.id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty">
                  暂无数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

