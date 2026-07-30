import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Inbox,
  Mail,
  MessageSquareText,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  X,
} from 'lucide-react'
import { adminDownload, adminFetch } from '../../admin/api'

type LeadItem = {
  id: number
  name: string
  company: string | null
  phone_or_email: string
  demand_desc: string
  status: string
  source_page: string
  created_at: string
}

type LeadStats = {
  total: number
  new: number
  processing: number
  done: number
  archived: number
  today: number
}

const EMPTY_STATS: LeadStats = {
  total: 0,
  new: 0,
  processing: 0,
  done: 0,
  archived: 0,
  today: 0,
}

const STATUS_OPTIONS = [
  { value: 'new', label: '待处理', short: '待处理' },
  { value: 'processing', label: '跟进中', short: '跟进中' },
  { value: 'done', label: '已完成', short: '已完成' },
  { value: 'archived', label: '已归档', short: '归档' },
] as const

const SOURCE_LABELS: Record<string, string> = {
  '/contact': '联系页面',
  '/': '网站首页',
  '/services': '服务能力页',
  '/cases': '项目案例页',
}

function getStatusLabel(value: string) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label || value || '未知状态'
}

function getSourceLabel(value: string) {
  return SOURCE_LABELS[value] || value || '未知来源'
}

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function formatRelativeDate(value: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000))
  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} 小时前`
  if (diffMinutes < 7 * 24 * 60) return `${Math.floor(diffMinutes / (24 * 60))} 天前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function isEmail(value: string) {
  return value.includes('@')
}

function getPrimaryStatusAction(status: string) {
  if (status === 'new') return { value: 'processing', label: '开始跟进' }
  if (status === 'processing') return { value: 'done', label: '标记完成' }
  if (status === 'done') return { value: 'processing', label: '重新跟进' }
  return { value: 'new', label: '恢复待处理' }
}

export function AdminLeadsPage() {
  const [items, setItems] = useState<LeadItem[]>([])
  const [stats, setStats] = useState<LeadStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchInput.trim()), 320)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (query) params.set('q', query)
    params.set('page', '1')
    params.set('page_size', '50')
    return params.toString()
  }, [query, status])

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<LeadStats>('/api/admin/leads/stats')
      setStats(data)
    } catch {
      // The list remains usable if summary statistics are temporarily unavailable.
    }
  }, [])

  const loadItems = useCallback(
    async (showFullLoading = true) => {
      if (showFullLoading) setLoading(true)
      else setRefreshing(true)
      setError('')
      try {
        const data = await adminFetch<LeadItem[]>(`/api/admin/leads?${queryString}`)
        setItems(data)
        setSelectedId((current) => {
          if (current && data.some((item) => item.id === current)) return current
          return data[0]?.id ?? null
        })
      } catch (loadError: any) {
        setError(loadError?.message || '合作咨询加载失败，请稍后重试。')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [queryString],
  )

  useEffect(() => {
    void loadItems()
  }, [loadItems])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) || null,
    [items, selectedId],
  )

  const updateStatus = async (item: LeadItem, nextStatus: string) => {
    if (item.status === nextStatus || updatingId !== null) return
    const previousItems = items
    setUpdatingId(item.id)
    setError('')
    setMessage('')
    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id ? { ...currentItem, status: nextStatus } : currentItem,
      ),
    )
    try {
      const updated = await adminFetch<LeadItem>(`/api/admin/leads/${item.id}`, {
        method: 'PATCH',
        json: { status: nextStatus },
      })
      setItems((current) =>
        current.map((currentItem) => (currentItem.id === item.id ? updated : currentItem)),
      )
      setMessage(`“${item.name}”已更新为${getStatusLabel(nextStatus)}。`)
      await loadStats()
      if (status && status !== nextStatus) {
        const remainingItems = items.filter((currentItem) => currentItem.id !== item.id)
        setItems(remainingItems)
        setSelectedId((current) =>
          current === item.id ? remainingItems[0]?.id ?? null : current,
        )
      }
    } catch (updateError: any) {
      setItems(previousItems)
      setError(updateError?.message || '状态更新失败，请稍后重试。')
    } finally {
      setUpdatingId(null)
    }
  }

  const exportPath = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (query) params.set('q', query)
    return `/api/admin/export/leads.csv?${params.toString()}`
  }, [query, status])

  const onExport = async () => {
    setExporting(true)
    setError('')
    setMessage('')
    try {
      await adminDownload(exportPath, '合作咨询.csv')
      setMessage('已按当前筛选条件导出合作咨询。')
    } catch (exportError: any) {
      setError(exportError?.message || '导出失败，请稍后重试。')
    } finally {
      setExporting(false)
    }
  }

  const onRefresh = async () => {
    setMessage('')
    await Promise.all([loadItems(false), loadStats()])
  }

  const copyContact = async (value: string) => {
    setError('')
    try {
      await navigator.clipboard.writeText(value)
      setMessage('联系方式已复制。')
    } catch {
      setError('复制失败，请手动选择联系方式。')
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    setQuery('')
    setStatus('')
  }

  const primaryAction = selectedItem ? getPrimaryStatusAction(selectedItem.status) : null
  const hasFilters = Boolean(status || searchInput.trim())

  return (
    <div className="admin-page admin-leads-page">
      <div className="admin-page-header admin-leads-header">
        <div>
          <div className="admin-page-eyebrow">Lead inbox</div>
          <h1 className="admin-page-title">合作咨询</h1>
          <p className="admin-page-sub">集中查看客户需求，快速推进每一条合作机会。</p>
        </div>
        <div className="admin-header-actions">
          <button
            className="admin-secondary-btn"
            type="button"
            onClick={() => void onRefresh()}
            disabled={refreshing}
          >
            <RefreshCw
              className={refreshing ? 'is-spinning' : ''}
              size={16}
              aria-hidden="true"
            />
            刷新
          </button>
          <button
            className="admin-primary-btn admin-inline-btn"
            type="button"
            onClick={() => void onExport()}
            disabled={exporting}
          >
            <Download size={17} aria-hidden="true" />
            {exporting ? '正在导出…' : '导出当前结果'}
          </button>
        </div>
      </div>

      <section className="admin-lead-stats" aria-label="合作咨询概览">
        <button
          type="button"
          className={!status ? 'is-active' : ''}
          onClick={() => setStatus('')}
        >
          <span className="admin-lead-stat-icon stat-total">
            <Inbox size={18} aria-hidden="true" />
          </span>
          <span>
            <small>全部咨询</small>
            <strong>{stats.total}</strong>
          </span>
          <em>今日 +{stats.today}</em>
        </button>
        <button
          type="button"
          className={status === 'new' ? 'is-active' : ''}
          onClick={() => setStatus('new')}
        >
          <span className="admin-lead-stat-icon stat-new">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <span>
            <small>等待处理</small>
            <strong>{stats.new}</strong>
          </span>
          <em>需尽快联系</em>
        </button>
        <button
          type="button"
          className={status === 'processing' ? 'is-active' : ''}
          onClick={() => setStatus('processing')}
        >
          <span className="admin-lead-stat-icon stat-processing">
            <MessageSquareText size={18} aria-hidden="true" />
          </span>
          <span>
            <small>正在跟进</small>
            <strong>{stats.processing}</strong>
          </span>
          <em>持续推进</em>
        </button>
        <button
          type="button"
          className={status === 'done' ? 'is-active' : ''}
          onClick={() => setStatus('done')}
        >
          <span className="admin-lead-stat-icon stat-done">
            <CheckCircle2 size={18} aria-hidden="true" />
          </span>
          <span>
            <small>已经完成</small>
            <strong>{stats.done}</strong>
          </span>
          <em>完成率 {stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%</em>
        </button>
      </section>

      <div className="admin-leads-toolbar">
        <div className="admin-status-tabs" role="group" aria-label="按状态筛选">
          <button
            type="button"
            className={!status ? 'is-active' : ''}
            onClick={() => setStatus('')}
          >
            全部
          </button>
          {STATUS_OPTIONS.map((item) => (
            <button
              type="button"
              className={status === item.value ? 'is-active' : ''}
              key={item.value}
              onClick={() => setStatus(item.value)}
            >
              {item.short}
              {item.value === 'new' && stats.new > 0 ? <span>{stats.new}</span> : null}
            </button>
          ))}
        </div>
        <label className="admin-leads-search">
          <Search size={17} aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="搜索姓名、公司或联系方式"
            aria-label="搜索合作咨询"
          />
          {searchInput ? (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label="清空搜索"
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </label>
      </div>

      {message ? (
        <div className="admin-success admin-leads-feedback" role="status">
          <Check size={17} aria-hidden="true" />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="admin-error admin-leads-feedback" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-leads-workspace">
        <section className="admin-lead-inbox" aria-label="咨询列表">
          <header className="admin-lead-inbox-head">
            <div>
              <strong>{status ? getStatusLabel(status) : '全部咨询'}</strong>
              <span>共 {items.length} 条结果</span>
            </div>
            {query ? <small>“{query}”</small> : null}
          </header>

          <div className="admin-lead-list">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div className="admin-lead-skeleton" key={index} aria-hidden="true">
                  <span />
                  <i />
                  <i />
                </div>
              ))
            ) : (
              items.map((item) => (
                <button
                  type="button"
                  className={`admin-lead-list-item ${
                    selectedId === item.id ? 'is-selected' : ''
                  }`}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  aria-pressed={selectedId === item.id}
                >
                  <span className="admin-lead-avatar" aria-hidden="true">
                    {item.name.trim().slice(0, 1) || '?'}
                  </span>
                  <span className="admin-lead-list-body">
                    <span className="admin-lead-list-top">
                      <strong>{item.name}</strong>
                      <small>{formatRelativeDate(item.created_at)}</small>
                    </span>
                    <span className="admin-lead-company">
                      {item.company || '未填写公司'}
                    </span>
                    <span className="admin-lead-demand-preview">
                      {item.demand_desc || '暂无需求描述'}
                    </span>
                    <span className="admin-lead-list-footer">
                      <span className={`admin-status-pill status-${item.status}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      <span>{getSourceLabel(item.source_page)}</span>
                    </span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              ))
            )}
          </div>

          {!loading && items.length === 0 ? (
            <div className="admin-lead-empty">
              <Inbox size={25} aria-hidden="true" />
              <strong>{hasFilters ? '没有符合条件的咨询' : '还没有合作咨询'}</strong>
              <p>{hasFilters ? '可以调整搜索词或清除筛选条件。' : '新咨询提交后会出现在这里。'}</p>
              {hasFilters ? (
                <button type="button" onClick={clearFilters}>
                  清除筛选
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="admin-lead-detail" aria-label="咨询详情">
          {selectedItem ? (
            <>
              <header className="admin-lead-detail-head">
                <div className="admin-lead-detail-person">
                  <span className="admin-lead-avatar admin-lead-avatar-large" aria-hidden="true">
                    {selectedItem.name.trim().slice(0, 1) || '?'}
                  </span>
                  <div>
                    <div className="admin-lead-detail-name">
                      <h2>{selectedItem.name}</h2>
                      <span className={`admin-status-pill status-${selectedItem.status}`}>
                        {getStatusLabel(selectedItem.status)}
                      </span>
                    </div>
                    <p>{selectedItem.company || '未填写公司名称'}</p>
                  </div>
                </div>
                <span className="admin-lead-number">咨询 #{selectedItem.id}</span>
              </header>

              <div className="admin-lead-quick-actions">
                <a
                  href={
                    isEmail(selectedItem.phone_or_email)
                      ? `mailto:${selectedItem.phone_or_email}`
                      : `tel:${selectedItem.phone_or_email}`
                  }
                >
                  {isEmail(selectedItem.phone_or_email) ? (
                    <Mail size={17} aria-hidden="true" />
                  ) : (
                    <Phone size={17} aria-hidden="true" />
                  )}
                  {isEmail(selectedItem.phone_or_email) ? '发送邮件' : '拨打电话'}
                </a>
                <button
                  type="button"
                  onClick={() => void copyContact(selectedItem.phone_or_email)}
                >
                  <Copy size={16} aria-hidden="true" />
                  复制联系方式
                </button>
              </div>

              <div className="admin-lead-info-grid">
                <div>
                  <span>
                    <UserRound size={15} aria-hidden="true" />
                    联系方式
                  </span>
                  <strong>{selectedItem.phone_or_email}</strong>
                </div>
                <div>
                  <span>
                    <Building2 size={15} aria-hidden="true" />
                    公司
                  </span>
                  <strong>{selectedItem.company || '未填写'}</strong>
                </div>
                <div>
                  <span>
                    <Clock3 size={15} aria-hidden="true" />
                    提交时间
                  </span>
                  <strong>{formatDate(selectedItem.created_at)}</strong>
                </div>
                <div>
                  <span>
                    <ArrowRight size={15} aria-hidden="true" />
                    来源页面
                  </span>
                  <strong>{getSourceLabel(selectedItem.source_page)}</strong>
                </div>
              </div>

              <div className="admin-lead-demand">
                <div className="admin-lead-detail-section-title">
                  <div>
                    <MessageSquareText size={17} aria-hidden="true" />
                    <strong>客户需求</strong>
                  </div>
                  <span>{selectedItem.demand_desc.length} 字</span>
                </div>
                <p>{selectedItem.demand_desc || '客户暂未填写具体需求。'}</p>
              </div>

              <div className="admin-lead-process">
                <div className="admin-lead-detail-section-title">
                  <div>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    <strong>跟进状态</strong>
                  </div>
                  {updatingId === selectedItem.id ? <span>正在更新…</span> : null}
                </div>
                <div className="admin-lead-status-flow" aria-label="更新咨询状态">
                  {STATUS_OPTIONS.slice(0, 3).map((item, index) => (
                    <button
                      type="button"
                      className={selectedItem.status === item.value ? 'is-active' : ''}
                      key={item.value}
                      onClick={() => void updateStatus(selectedItem, item.value)}
                      disabled={updatingId !== null}
                    >
                      <span>{index + 1}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <footer className="admin-lead-detail-footer">
                {selectedItem.status !== 'archived' ? (
                  <button
                    type="button"
                    className="admin-lead-archive-btn"
                    onClick={() => void updateStatus(selectedItem, 'archived')}
                    disabled={updatingId !== null}
                  >
                    <Archive size={16} aria-hidden="true" />
                    归档咨询
                  </button>
                ) : (
                  <span className="admin-lead-archived-note">
                    <Archive size={15} aria-hidden="true" />
                    此咨询已归档
                  </span>
                )}
                {primaryAction ? (
                  <button
                    type="button"
                    className="admin-primary-btn"
                    onClick={() => void updateStatus(selectedItem, primaryAction.value)}
                    disabled={updatingId !== null}
                  >
                    {updatingId === selectedItem.id ? '正在更新…' : primaryAction.label}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </footer>
            </>
          ) : (
            <div className="admin-lead-detail-empty">
              <MessageSquareText size={28} aria-hidden="true" />
              <strong>选择一条合作咨询</strong>
              <p>客户信息、需求内容和跟进操作会显示在这里。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
