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
  ExternalLink,
  FileImage,
  FileText,
  FolderOpen,
  Mail,
  MessageSquareText,
  Paperclip,
  Phone,
  RefreshCw,
  Search,
  Store,
  UserRound,
  X,
} from 'lucide-react'
import { adminDownload, adminFetch } from '../../admin/api'
import { resolveMediaUrl } from '../../media'

type FileItem = {
  id: number
  file_url: string
  file_name: string | null
  created_at: string
}

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

type SignupStats = {
  total: number
  new: number
  processing: number
  done: number
  archived: number
  today: number
  with_files: number
  file_count: number
}

const EMPTY_STATS: SignupStats = {
  total: 0,
  new: 0,
  processing: 0,
  done: 0,
  archived: 0,
  today: 0,
  with_files: 0,
  file_count: 0,
}

const STATUS_OPTIONS = [
  { value: 'new', label: '待处理', short: '待处理' },
  { value: 'processing', label: '沟通中', short: '沟通中' },
  { value: 'done', label: '已完成', short: '已完成' },
  { value: 'archived', label: '已归档', short: '归档' },
] as const

const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']

function getStatusLabel(value: string) {
  return STATUS_OPTIONS.find((item) => item.value === value)?.label || value || '未知状态'
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

function getFileDisplayName(file: FileItem) {
  return file.file_name || file.file_url.split('/').pop() || '报名附件'
}

function getFileExtension(file: FileItem) {
  const name = getFileDisplayName(file)
  return name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : ''
}

function isImageFile(file: FileItem) {
  return IMAGE_EXTENSIONS.includes(getFileExtension(file))
}

function getFileTypeLabel(file: FileItem) {
  const extension = getFileExtension(file)
  if (!extension) return '附件'
  return extension.toUpperCase()
}

function getPrimaryStatusAction(status: string) {
  if (status === 'new') return { value: 'processing', label: '开始沟通' }
  if (status === 'processing') return { value: 'done', label: '标记完成' }
  if (status === 'done') return { value: 'processing', label: '重新沟通' }
  return { value: 'new', label: '恢复待处理' }
}

export function AdminMerchantSignupsPage() {
  const [items, setItems] = useState<SignupItem[]>([])
  const [stats, setStats] = useState<SignupStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [filesOnly, setFilesOnly] = useState(false)
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
    if (filesOnly) params.set('has_files', 'true')
    params.set('page', '1')
    params.set('page_size', '50')
    return params.toString()
  }, [filesOnly, query, status])

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<SignupStats>('/api/admin/merchant-signups/stats')
      setStats(data)
    } catch {
      // The record list remains usable if summary statistics are unavailable.
    }
  }, [])

  const loadItems = useCallback(
    async (showFullLoading = true) => {
      if (showFullLoading) setLoading(true)
      else setRefreshing(true)
      setError('')
      try {
        const data = await adminFetch<SignupItem[]>(
          `/api/admin/merchant-signups?${queryString}`,
        )
        setItems(data)
        setSelectedId((current) => {
          if (current && data.some((item) => item.id === current)) return current
          return data[0]?.id ?? null
        })
      } catch (loadError: any) {
        setError(loadError?.message || '商户报名加载失败，请稍后重试。')
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

  const updateStatus = async (item: SignupItem, nextStatus: string) => {
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
      const updated = await adminFetch<SignupItem>(
        `/api/admin/merchant-signups/${item.id}`,
        {
          method: 'PATCH',
          json: { status: nextStatus },
        },
      )
      setItems((current) =>
        current.map((currentItem) => (currentItem.id === item.id ? updated : currentItem)),
      )
      setMessage(`“${item.brand_name || item.contact_name}”已更新为${getStatusLabel(nextStatus)}。`)
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
    if (filesOnly) params.set('has_files', 'true')
    return `/api/admin/export/merchant-signups.csv?${params.toString()}`
  }, [filesOnly, query, status])

  const onExport = async () => {
    setExporting(true)
    setError('')
    setMessage('')
    try {
      await adminDownload(exportPath, '商户报名.csv')
      setMessage('已按当前筛选条件导出商户报名。')
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
    setFilesOnly(false)
  }

  const primaryAction = selectedItem ? getPrimaryStatusAction(selectedItem.status) : null
  const hasFilters = Boolean(status || filesOnly || searchInput.trim())

  return (
    <div className="admin-page admin-signups-page">
      <div className="admin-page-header admin-signups-header">
        <div>
          <div className="admin-page-eyebrow">Merchant applications</div>
          <h1 className="admin-page-title">商户报名</h1>
          <p className="admin-page-sub">集中审核商户资料、报名附件并推进后续沟通。</p>
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

      <section className="admin-lead-stats admin-signup-stats" aria-label="商户报名概览">
        <button
          type="button"
          className={!status && !filesOnly ? 'is-active' : ''}
          onClick={() => {
            setStatus('')
            setFilesOnly(false)
          }}
        >
          <span className="admin-lead-stat-icon admin-signup-stat-icon stat-total">
            <Store size={18} aria-hidden="true" />
          </span>
          <span>
            <small>全部报名</small>
            <strong>{stats.total}</strong>
          </span>
          <em>今日 +{stats.today}</em>
        </button>
        <button
          type="button"
          className={status === 'new' && !filesOnly ? 'is-active' : ''}
          onClick={() => {
            setStatus('new')
            setFilesOnly(false)
          }}
        >
          <span className="admin-lead-stat-icon admin-signup-stat-icon stat-new">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <span>
            <small>等待处理</small>
            <strong>{stats.new}</strong>
          </span>
          <em>需优先查看</em>
        </button>
        <button
          type="button"
          className={status === 'processing' && !filesOnly ? 'is-active' : ''}
          onClick={() => {
            setStatus('processing')
            setFilesOnly(false)
          }}
        >
          <span className="admin-lead-stat-icon admin-signup-stat-icon stat-processing">
            <MessageSquareText size={18} aria-hidden="true" />
          </span>
          <span>
            <small>正在沟通</small>
            <strong>{stats.processing}</strong>
          </span>
          <em>持续推进</em>
        </button>
        <button
          type="button"
          className={filesOnly ? 'is-active' : ''}
          onClick={() => {
            setFilesOnly((current) => !current)
            setStatus('')
          }}
        >
          <span className="admin-lead-stat-icon admin-signup-stat-icon stat-files">
            <Paperclip size={18} aria-hidden="true" />
          </span>
          <span>
            <small>包含附件</small>
            <strong>{stats.with_files}</strong>
          </span>
          <em>共 {stats.file_count} 份资料</em>
        </button>
      </section>

      <div className="admin-leads-toolbar admin-signups-toolbar">
        <div className="admin-status-tabs" role="group" aria-label="按状态筛选">
          <button
            type="button"
            className={!status && !filesOnly ? 'is-active' : ''}
            onClick={() => {
              setStatus('')
              setFilesOnly(false)
            }}
          >
            全部
          </button>
          {STATUS_OPTIONS.map((item) => (
            <button
              type="button"
              className={status === item.value && !filesOnly ? 'is-active' : ''}
              key={item.value}
              onClick={() => {
                setStatus(item.value)
                setFilesOnly(false)
              }}
            >
              {item.short}
              {item.value === 'new' && stats.new > 0 ? <span>{stats.new}</span> : null}
            </button>
          ))}
          <button
            type="button"
            className={filesOnly ? 'is-active' : ''}
            onClick={() => {
              setFilesOnly((current) => !current)
              setStatus('')
            }}
          >
            有附件
          </button>
        </div>
        <label className="admin-leads-search admin-signups-search">
          <Search size={17} aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="搜索联系人、品牌或联系方式"
            aria-label="搜索商户报名"
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
        <div className="admin-success admin-leads-feedback admin-signups-feedback" role="status">
          <Check size={17} aria-hidden="true" />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="admin-error admin-leads-feedback admin-signups-feedback" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-leads-workspace admin-signups-workspace">
        <section className="admin-lead-inbox admin-signup-inbox" aria-label="报名列表">
          <header className="admin-lead-inbox-head admin-signup-inbox-head">
            <div>
              <strong>
                {filesOnly ? '含附件报名' : status ? getStatusLabel(status) : '全部报名'}
              </strong>
              <span>共 {items.length} 条结果</span>
            </div>
            {query ? <small>“{query}”</small> : null}
          </header>

          <div className="admin-lead-list admin-signup-list">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="admin-lead-skeleton admin-signup-skeleton"
                  key={index}
                  aria-hidden="true"
                >
                  <span />
                  <i />
                  <i />
                </div>
              ))
            ) : (
              items.map((item) => (
                <button
                  type="button"
                  className={`admin-lead-list-item admin-signup-list-item ${
                    selectedId === item.id ? 'is-selected' : ''
                  }`}
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  aria-pressed={selectedId === item.id}
                >
                  <span className="admin-lead-avatar admin-signup-avatar" aria-hidden="true">
                    {(item.brand_name || item.contact_name).trim().slice(0, 1) || '?'}
                  </span>
                  <span className="admin-lead-list-body admin-signup-list-body">
                    <span className="admin-lead-list-top admin-signup-list-top">
                      <strong>{item.brand_name || '未填写品牌名称'}</strong>
                      <small>{formatRelativeDate(item.created_at)}</small>
                    </span>
                    <span className="admin-lead-company admin-signup-contact">
                      联系人：{item.contact_name}
                    </span>
                    <span className="admin-lead-demand-preview admin-signup-detail-preview">
                      {item.business_details || '暂无业务描述'}
                    </span>
                    <span className="admin-lead-list-footer admin-signup-list-footer">
                      <span className={`admin-status-pill status-${item.status}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      <span>
                        <Paperclip size={12} aria-hidden="true" />
                        {item.files?.length || 0} 个附件
                      </span>
                    </span>
                  </span>
                  <ChevronRight size={17} aria-hidden="true" />
                </button>
              ))
            )}
          </div>

          {!loading && items.length === 0 ? (
            <div className="admin-lead-empty admin-signup-empty">
              <Store size={25} aria-hidden="true" />
              <strong>{hasFilters ? '没有符合条件的报名' : '还没有商户报名'}</strong>
              <p>{hasFilters ? '可以调整搜索词或清除筛选条件。' : '新的报名资料会出现在这里。'}</p>
              {hasFilters ? (
                <button type="button" onClick={clearFilters}>
                  清除筛选
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="admin-lead-detail admin-signup-detail" aria-label="报名详情">
          {selectedItem ? (
            <>
              <header className="admin-lead-detail-head admin-signup-detail-head">
                <div className="admin-lead-detail-person admin-signup-detail-brand">
                  <span
                    className="admin-lead-avatar admin-lead-avatar-large admin-signup-avatar admin-signup-avatar-large"
                    aria-hidden="true"
                  >
                    {(selectedItem.brand_name || selectedItem.contact_name).trim().slice(0, 1) ||
                      '?'}
                  </span>
                  <div>
                    <div className="admin-lead-detail-name admin-signup-detail-name">
                      <h2>{selectedItem.brand_name || '未填写品牌名称'}</h2>
                      <span className={`admin-status-pill status-${selectedItem.status}`}>
                        {getStatusLabel(selectedItem.status)}
                      </span>
                    </div>
                    <p>联系人：{selectedItem.contact_name}</p>
                  </div>
                </div>
                <span className="admin-lead-number admin-signup-number">
                  报名 #{selectedItem.id}
                </span>
              </header>

              <div className="admin-lead-quick-actions admin-signup-quick-actions">
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

              <div className="admin-lead-info-grid admin-signup-info-grid">
                <div>
                  <span>
                    <UserRound size={15} aria-hidden="true" />
                    联系人
                  </span>
                  <strong>{selectedItem.contact_name}</strong>
                </div>
                <div>
                  <span>
                    <Building2 size={15} aria-hidden="true" />
                    品牌名称
                  </span>
                  <strong>{selectedItem.brand_name || '未填写'}</strong>
                </div>
                <div>
                  <span>
                    <Phone size={15} aria-hidden="true" />
                    联系方式
                  </span>
                  <strong>{selectedItem.phone_or_email}</strong>
                </div>
                <div>
                  <span>
                    <Clock3 size={15} aria-hidden="true" />
                    提交时间
                  </span>
                  <strong>{formatDate(selectedItem.created_at)}</strong>
                </div>
              </div>

              <div className="admin-lead-demand admin-signup-description">
                <div className="admin-lead-detail-section-title admin-signup-detail-section-title">
                  <div>
                    <MessageSquareText size={17} aria-hidden="true" />
                    <strong>业务描述</strong>
                  </div>
                  <span>{selectedItem.business_details.length} 字</span>
                </div>
                <p>{selectedItem.business_details || '商户暂未填写业务描述。'}</p>
              </div>

              <div className="admin-signup-attachments">
                <div className="admin-lead-detail-section-title admin-signup-detail-section-title">
                  <div>
                    <FolderOpen size={17} aria-hidden="true" />
                    <strong>报名附件</strong>
                  </div>
                  <span>{selectedItem.files?.length || 0} 份资料</span>
                </div>
                {selectedItem.files?.length ? (
                  <div className="admin-signup-file-list">
                    {selectedItem.files.map((file) => {
                      const FileIcon = isImageFile(file) ? FileImage : FileText
                      return (
                        <a
                          key={file.id}
                          href={resolveMediaUrl(file.file_url)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="admin-signup-file-icon">
                            <FileIcon size={18} aria-hidden="true" />
                          </span>
                          <span>
                            <strong>{getFileDisplayName(file)}</strong>
                            <small>{getFileTypeLabel(file)} 文件</small>
                          </span>
                          <span className="admin-signup-file-open">
                            查看
                            <ExternalLink size={14} aria-hidden="true" />
                          </span>
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <div className="admin-signup-no-files">
                    <Paperclip size={17} aria-hidden="true" />
                    本次报名未上传附件
                  </div>
                )}
              </div>

              <div className="admin-lead-process admin-signup-process">
                <div className="admin-lead-detail-section-title admin-signup-detail-section-title">
                  <div>
                    <CheckCircle2 size={17} aria-hidden="true" />
                    <strong>跟进状态</strong>
                  </div>
                  {updatingId === selectedItem.id ? <span>正在更新…</span> : null}
                </div>
                <div
                  className="admin-lead-status-flow admin-signup-status-flow"
                  aria-label="更新报名状态"
                >
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

              <footer className="admin-lead-detail-footer admin-signup-detail-footer">
                {selectedItem.status !== 'archived' ? (
                  <button
                    type="button"
                    className="admin-lead-archive-btn admin-signup-archive-btn"
                    onClick={() => void updateStatus(selectedItem, 'archived')}
                    disabled={updatingId !== null}
                  >
                    <Archive size={16} aria-hidden="true" />
                    归档报名
                  </button>
                ) : (
                  <span className="admin-lead-archived-note admin-signup-archived-note">
                    <Archive size={15} aria-hidden="true" />
                    此报名已归档
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
            <div className="admin-lead-detail-empty admin-signup-detail-empty">
              <Store size={28} aria-hidden="true" />
              <strong>选择一条商户报名</strong>
              <p>品牌信息、业务描述、附件和处理操作会显示在这里。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
