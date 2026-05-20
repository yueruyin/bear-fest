import { useEffect, useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import { adminDownload, adminFetch } from '../../admin/api'

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
const STATUS_LABELS: Record<string, string> = {
  new: '待处理',
  processing: '沟通中',
  done: '已完成',
  archived: '已归档',
}

function getStatusLabel(value: string) {
  return STATUS_LABELS[value] || value
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminMerchantSignupsPage() {
  const [items, setItems] = useState<SignupItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
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
    setMsg('状态已更新。')
    load()
  }

  const exportPath = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (q.trim()) params.set('q', q.trim())
    return `/api/admin/export/merchant-signups.csv?${params.toString()}`
  }, [q, status])

  const onExport = async () => {
    setError('')
    setMsg('')
    try {
      await adminDownload(exportPath, '商户报名.csv')
      setMsg('已开始下载商户报名表。')
    } catch (e: any) {
      setError(e?.message || '导出失败')
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">商户报名</h1>
          <p className="admin-page-sub">查看商户申请、店铺资料和跟进状态。</p>
        </div>
        <button className="admin-ghost-btn admin-inline-btn" type="button" onClick={onExport}>
          <Download size={17} aria-hidden="true" />
          导出表格
        </button>
      </div>

      <div className="admin-toolbar">
        <label className="admin-filter">
          <span>跟进状态</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">全部状态</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {getStatusLabel(s)}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-filter admin-filter-grow">
          <span>搜索商户</span>
          <div className="admin-input-with-icon">
            <Search size={17} aria-hidden="true" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="联系人、品牌、联系方式或描述"
            />
          </div>
        </label>
      </div>

      {msg ? <div className="admin-success">{msg}</div> : null}
      {loading ? <div className="admin-loading">正在加载商户报名…</div> : null}
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
              <span className={`admin-status-pill status-${it.status}`}>{getStatusLabel(it.status)}</span>
            </div>

            <div className="admin-row-meta">
              <div>
                <div className="admin-meta-k">联系方式</div>
                <div className="admin-meta-v">{it.phone_or_email}</div>
              </div>
              <div>
                <div className="admin-meta-k">提交时间</div>
                <div className="admin-meta-v">{formatDate(it.created_at)}</div>
              </div>
              <label className="admin-filter admin-row-status">
                <span>更新状态</span>
                <select value={it.status} onChange={(e) => updateStatus(it.id, e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {getStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </label>
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
