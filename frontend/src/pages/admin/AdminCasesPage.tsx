import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  ExternalLink,
  FileText,
  Globe2,
  Image,
  Images,
  LayoutGrid,
  ListChecks,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Settings2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import { adminFetch, adminUpload } from '../../admin/api'
import { resolveMediaUrl } from '../../media'
import {
  CASE_EVENT_TYPES,
  CASE_EVENT_TYPE_LABELS,
  isCaseEventType,
  isCasePublishStatus,
  type CaseEventType,
  type CasePublishStatus,
  type ResultMetric,
} from '../../types'

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
  project_background: string | null
  project_goals: string | null
  execution_highlights: string | null
  result_metrics: string | null
  result_summary: string | null
  tags: string
  seo_title: string
  seo_description: string
}

type CaseForm = {
  title: string
  slug: string
  event_type: CaseEventType
  summary: string
  cover_image_url: string
  gallery_urls: string
  project_background: string
  project_goals: string
  execution_highlights: string
  result_metrics: string
  result_summary: string
  tags: string
  seo_title: string
  seo_description: string
  publish_status: CasePublishStatus
  published_at: string | null
}

type CaseStats = {
  total: number
  published: number
  draft: number
  updated_today: number
}

type UploadResult = {
  url: string
  file_name: string
}

type SaveFeedback = {
  type: 'success' | 'error'
  text: string
}

type EditorTab = 'content' | 'review' | 'media' | 'seo'

type ExecutionHighlight = {
  title: string
  description: string
}

type EditableResultMetric = {
  label: string
  value: string
  description: string
}

const EMPTY_STATS: CaseStats = {
  total: 0,
  published: 0,
  draft: 0,
  updated_today: 0,
}

const EMPTY_FORM: CaseForm = {
  title: '',
  slug: '',
  event_type: 'sports',
  summary: '',
  cover_image_url: '',
  gallery_urls: '[]',
  project_background: '',
  project_goals: '',
  execution_highlights: '[]',
  result_metrics: '[]',
  result_summary: '',
  tags: '[]',
  seo_title: '',
  seo_description: '',
  publish_status: 'draft',
  published_at: null,
}

const EVENT_TYPES = CASE_EVENT_TYPES.map((value) => ({
  value,
  label: CASE_EVENT_TYPE_LABELS[value],
}))

const PUBLISH_STATUS_OPTIONS = [
  { value: 'draft', label: '草稿', help: '仅后台可见' },
  { value: 'published', label: '已发布', help: '客户可在前台查看' },
] as const

const EDITOR_TABS: Array<{
  value: EditorTab
  label: string
  icon: typeof FileText
}> = [
  { value: 'content', label: '基础内容', icon: FileText },
  { value: 'review', label: '项目复盘', icon: ListChecks },
  { value: 'media', label: '图片素材', icon: Images },
  { value: 'seo', label: '标签与搜索', icon: Settings2 },
]

const CASE_FALLBACK_IMAGES: Record<string, string> = {
  sports: '/case-carousel/page18_img01.jpeg',
  carnival: '/case-carousel/page22_img01.jpeg',
  market: '/case-carousel/page30_img01.jpeg',
  annual: '/case-carousel/page12_img01.jpeg',
  brand: '/case-carousel/page25_img01.jpeg',
  default: '/case-carousel/page31_img01.jpeg',
}

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

function jsonArrayToItems(value: string) {
  try {
    const parsed = JSON.parse(value || '[]')
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    }
  } catch {
    // Preserve recoverable values from the previous line-based editor.
  }
  return (value || '')
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function jsonArrayToLines(value: string) {
  return jsonArrayToItems(value).join('\n')
}

function linesToJsonArray(value: string) {
  return JSON.stringify(
    value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
  )
}

function appendJsonArrayItems(value: string, newItems: string[]) {
  return JSON.stringify(
    Array.from(
      new Set([...jsonArrayToItems(value), ...newItems.map((item) => item.trim())]),
    ).filter(Boolean),
  )
}

function jsonObjectArrayToItems<T extends object>(value: string | null | undefined): T[] {
  try {
    const parsed: unknown = JSON.parse(value || '[]')
    return Array.isArray(parsed)
      ? parsed.filter((item): item is T => typeof item === 'object' && item !== null)
      : []
  } catch {
    return []
  }
}

function resultMetricsToItems(value: string | null | undefined): EditableResultMetric[] {
  return jsonObjectArrayToItems<ResultMetric>(value)
    .filter((item) => typeof item.label === 'string' && typeof item.value === 'string')
    .map((item) => ({
      label: item.label,
      value: item.value,
      description: typeof item.description === 'string' ? item.description : '',
    }))
}

function getEventTypeLabel(value: string) {
  return EVENT_TYPES.find((item) => item.value === value)?.label || value || '未分类'
}

function getPublishStatusLabel(value: string) {
  return (
    PUBLISH_STATUS_OPTIONS.find((item) => item.value === value)?.label ||
    value ||
    '未知状态'
  )
}

function getCaseImage(item: Pick<CaseItem, 'event_type' | 'cover_image_url'>) {
  if (item.cover_image_url && !item.cover_image_url.includes('example.com')) {
    return resolveMediaUrl(item.cover_image_url)
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

function formatDate(value: string | null) {
  if (!value) return '尚未发布'
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
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const diffMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000))
  if (diffMinutes < 1) return '刚刚更新'
  if (diffMinutes < 60) return `${diffMinutes} 分钟前更新`
  if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} 小时前更新`
  if (diffMinutes < 7 * 24 * 60) return `${Math.floor(diffMinutes / (24 * 60))} 天前更新`
  return `${date.getMonth() + 1}月${date.getDate()}日更新`
}

function detailToForm(detail: CaseDetail): CaseForm {
  return {
    title: detail.title || '',
    slug: detail.slug || '',
    event_type: isCaseEventType(detail.event_type) ? detail.event_type : 'sports',
    summary: detail.summary || '',
    cover_image_url: detail.cover_image_url || '',
    gallery_urls: detail.gallery_urls || '[]',
    project_background: detail.project_background || '',
    project_goals: detail.project_goals || '',
    execution_highlights: detail.execution_highlights || '[]',
    result_metrics: detail.result_metrics || '[]',
    result_summary: detail.result_summary || '',
    tags: detail.tags || '[]',
    seo_title: detail.seo_title || '',
    seo_description: detail.seo_description || '',
    publish_status: isCasePublishStatus(detail.publish_status)
      ? detail.publish_status
      : 'draft',
    published_at: detail.published_at,
  }
}

function cleanForm(form: CaseForm): CaseForm {
  return {
    ...form,
    title: form.title.trim(),
    slug: form.slug.trim(),
    summary: form.summary.trim(),
    cover_image_url: form.cover_image_url.trim(),
    gallery_urls: JSON.stringify(jsonArrayToItems(form.gallery_urls)),
    project_background: form.project_background.trim(),
    project_goals: form.project_goals.trim(),
    execution_highlights: JSON.stringify(
      jsonObjectArrayToItems<ExecutionHighlight>(form.execution_highlights).filter(
        (item) => item.title.trim() || item.description.trim(),
      ),
    ),
    result_metrics: JSON.stringify(
      resultMetricsToItems(form.result_metrics).filter(
        (item) => item.label.trim() || item.value.trim() || item.description.trim(),
      ),
    ),
    result_summary: form.result_summary.trim(),
    tags: JSON.stringify(jsonArrayToItems(form.tags)),
    seo_title: form.seo_title.trim(),
    seo_description: form.seo_description.trim(),
  }
}

async function uploadCaseImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return adminUpload<UploadResult>('/api/admin/uploads/cases', formData)
}

export function AdminCasesPage() {
  const [items, setItems] = useState<CaseItem[]>([])
  const [stats, setStats] = useState<CaseStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState('')
  const [publishStatus, setPublishStatus] = useState('')
  const [eventType, setEventType] = useState('')
  const [editing, setEditing] = useState<CaseItem | null>(null)
  const [form, setForm] = useState<CaseForm>({ ...EMPTY_FORM })
  const [savedForm, setSavedForm] = useState<CaseForm>({ ...EMPTY_FORM })
  const [activeTab, setActiveTab] = useState<EditorTab>('content')
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchInput.trim()), 320)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isEditingField = target?.matches(
        'input, textarea, select, [contenteditable="true"]',
      )
      if (event.key === '/' && !isEditingField) {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const queryString = useMemo(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (publishStatus) params.set('publish_status', publishStatus)
    if (eventType) params.set('event_type', eventType)
    params.set('page', '1')
    params.set('page_size', '50')
    return params.toString()
  }, [eventType, publishStatus, query])

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<CaseStats>('/api/admin/cases/stats')
      setStats(data)
    } catch {
      // The editor remains available when summary statistics cannot load.
    }
  }, [])

  const loadItems = useCallback(
    async (showFullLoading = true) => {
      if (showFullLoading) setLoading(true)
      else setRefreshing(true)
      setError('')
      try {
        const data = await adminFetch<CaseItem[]>(`/api/admin/cases?${queryString}`)
        setItems(data)
      } catch (loadError: any) {
        setError(loadError?.message || '案例列表加载失败，请稍后重试。')
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

  const galleryItems = useMemo(() => jsonArrayToItems(form.gallery_urls), [form.gallery_urls])
  const tagItems = useMemo(() => jsonArrayToItems(form.tags), [form.tags])
  const highlightItems = useMemo(
    () => jsonObjectArrayToItems<ExecutionHighlight>(form.execution_highlights),
    [form.execution_highlights],
  )
  const metricItems = useMemo(
    () => resultMetricsToItems(form.result_metrics),
    [form.result_metrics],
  )
  const isDirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm],
  )
  const contentIsComplete = Boolean(form.title.trim() && form.summary.trim())
  const reviewIsComplete = Boolean(
    form.project_background.trim().length >= 20 &&
      form.project_goals.trim().length >= 10 &&
      highlightItems.length >= 1 &&
      highlightItems.every(
        (item) =>
          item.title.trim().length >= 2 && item.description.trim().length >= 10,
      ) &&
      metricItems.every((item) => item.label.trim() && item.value.trim()),
  )
  const preservesPublishedReview = Boolean(
    editing?.publish_status === 'published' &&
      savedForm.publish_status === 'published' &&
      form.publish_status === 'published' &&
      form.project_background === savedForm.project_background &&
      form.project_goals === savedForm.project_goals &&
      form.execution_highlights === savedForm.execution_highlights &&
      form.result_metrics === savedForm.result_metrics &&
      form.result_summary === savedForm.result_summary,
  )
  const reviewRequirementIsSatisfied = reviewIsComplete || preservesPublishedReview
  const mediaIsComplete = Boolean(form.cover_image_url.trim())
  const seoIsComplete = Boolean(form.seo_title.trim() || form.seo_description.trim())
  const completedRequired = [
    contentIsComplete,
    reviewRequirementIsSatisfied,
    mediaIsComplete,
  ].filter(Boolean).length
  const isValid =
    contentIsComplete &&
    mediaIsComplete &&
    (form.publish_status !== 'published' || reviewRequirementIsSatisfied)
  const isBusy = saving || detailLoading || coverUploading || galleryUploading

  useEffect(() => {
    if (!isDirty) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isDirty])

  const updateForm = <K extends keyof CaseForm>(key: K, value: CaseForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setMessage('')
    setError('')
    setSaveFeedback(null)
  }

  const confirmDiscardChanges = () => {
    if (!isDirty) return true
    return window.confirm('当前案例还有未保存的修改，确定要放弃吗？')
  }

  const resetToNew = () => {
    const nextForm = { ...EMPTY_FORM }
    setEditing(null)
    setForm(nextForm)
    setSavedForm(nextForm)
    setActiveTab('content')
    setTagInput('')
    setMessage('')
    setError('')
    setSaveFeedback(null)
  }

  const startCreate = () => {
    if (!confirmDiscardChanges()) return
    resetToNew()
  }

  const startEdit = async (item: CaseItem) => {
    if (editing?.id === item.id && !detailLoading) return
    if (!confirmDiscardChanges()) return

    const previewForm: CaseForm = {
      ...EMPTY_FORM,
      title: item.title,
      slug: item.slug,
      event_type: isCaseEventType(item.event_type) ? item.event_type : 'sports',
      summary: item.summary,
      cover_image_url: item.cover_image_url,
      publish_status: isCasePublishStatus(item.publish_status)
        ? item.publish_status
        : 'draft',
      published_at: item.published_at,
    }
    setEditing(item)
    setForm(previewForm)
    setSavedForm(previewForm)
    setActiveTab('content')
    setTagInput('')
    setDetailLoading(true)
    setMessage('')
    setError('')
    setSaveFeedback(null)

    try {
      const detail = await adminFetch<CaseDetail>(`/api/admin/cases/${item.id}`)
      const nextForm = detailToForm(detail)
      setForm(nextForm)
      setSavedForm(nextForm)
    } catch (loadError: any) {
      setError(loadError?.message || '案例详情加载失败，请稍后重试。')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleCoverUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setCoverUploading(true)
    setMessage('')
    setError('')
    setSaveFeedback(null)
    try {
      const result = await uploadCaseImage(file)
      updateForm('cover_image_url', result.url)
      setMessage('封面图上传成功，保存案例后正式生效。')
    } catch (uploadError: any) {
      setError(uploadError?.message || '封面图上传失败，请稍后重试。')
    } finally {
      setCoverUploading(false)
    }
  }

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (files.length === 0) return

    setGalleryUploading(true)
    setMessage('')
    setError('')
    setSaveFeedback(null)
    try {
      const results = await Promise.all(files.map(uploadCaseImage))
      setForm((current) => ({
        ...current,
        gallery_urls: appendJsonArrayItems(
          current.gallery_urls,
          results.map((result) => result.url),
        ),
      }))
      setMessage(`已上传 ${results.length} 张现场图片，保存案例后正式生效。`)
    } catch (uploadError: any) {
      setError(uploadError?.message || '图集上传失败，请稍后重试。')
    } finally {
      setGalleryUploading(false)
    }
  }

  const moveGalleryItem = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= galleryItems.length) return
    const nextItems = [...galleryItems]
    ;[nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]]
    updateForm('gallery_urls', JSON.stringify(nextItems))
  }

  const removeGalleryItem = (index: number) => {
    updateForm(
      'gallery_urls',
      JSON.stringify(galleryItems.filter((_, itemIndex) => itemIndex !== index)),
    )
  }

  const setHighlightItems = (items: ExecutionHighlight[]) => {
    updateForm('execution_highlights', JSON.stringify(items))
  }

  const updateHighlight = (
    index: number,
    field: keyof ExecutionHighlight,
    value: string,
  ) => {
    const nextItems = highlightItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    )
    setHighlightItems(nextItems)
  }

  const moveHighlight = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= highlightItems.length) return
    const nextItems = [...highlightItems]
    ;[nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]]
    setHighlightItems(nextItems)
  }

  const setMetricItems = (items: EditableResultMetric[]) => {
    updateForm('result_metrics', JSON.stringify(items))
  }

  const updateMetric = (
    index: number,
    field: keyof EditableResultMetric,
    value: string,
  ) => {
    const nextItems = metricItems.map((item, itemIndex) =>
      itemIndex === index ? { ...item, [field]: value } : item,
    )
    setMetricItems(nextItems)
  }

  const moveMetric = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= metricItems.length) return
    const nextItems = [...metricItems]
    ;[nextItems[index], nextItems[targetIndex]] = [nextItems[targetIndex], nextItems[index]]
    setMetricItems(nextItems)
  }

  const focusInvalidField = (tab: EditorTab) => {
    setActiveTab(tab)
    window.setTimeout(() => {
      const field = document.querySelector<HTMLElement>(
        `[data-editor-tab="${tab}"] [aria-invalid="true"]`,
      )
      field?.focus()
    })
  }

  const addTag = () => {
    const value = tagInput.trim().replace(/,$/, '')
    if (!value) return
    updateForm('tags', JSON.stringify(Array.from(new Set([...tagItems, value]))))
    setTagInput('')
  }

  const onTagKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    }
  }

  const removeTag = (target: string) => {
    updateForm('tags', JSON.stringify(tagItems.filter((item) => item !== target)))
  }

  const onSave = useCallback(async () => {
    if (isBusy || !isDirty) return
    if (!contentIsComplete) {
      focusInvalidField('content')
      setSaveFeedback({ type: 'error', text: '请先填写案例标题和摘要。' })
      return
    }
    if (!mediaIsComplete) {
      focusInvalidField('media')
      setSaveFeedback({ type: 'error', text: '请先上传或填写案例封面图。' })
      return
    }
    if (form.publish_status === 'published' && !reviewRequirementIsSatisfied) {
      focusInvalidField('review')
      setSaveFeedback({
        type: 'error',
        text: '发布前请完善项目背景、项目目标和至少一项执行亮点。',
      })
      return
    }

    setSaving(true)
    setMessage('')
    setError('')
    setSaveFeedback(null)
    const cleaned = cleanForm(form)
    const slug = cleaned.slug || createSlug(cleaned.title)
    try {
      let savedItem: CaseItem
      if (editing) {
        savedItem = await adminFetch<CaseItem>(`/api/admin/cases/${editing.id}`, {
          method: 'PUT',
          json: {
            title: cleaned.title,
            event_type: cleaned.event_type,
            summary: cleaned.summary,
            cover_image_url: cleaned.cover_image_url,
            gallery_urls: cleaned.gallery_urls,
            project_background: cleaned.project_background || null,
            project_goals: cleaned.project_goals || null,
            execution_highlights: cleaned.execution_highlights,
            result_metrics: cleaned.result_metrics,
            result_summary: cleaned.result_summary || null,
            tags: cleaned.tags,
            seo_title: cleaned.seo_title,
            seo_description: cleaned.seo_description,
            publish_status: cleaned.publish_status,
            published_at: cleaned.published_at,
          },
        })
      } else {
        savedItem = await adminFetch<CaseItem>('/api/admin/cases', {
          method: 'POST',
          json: {
            title: cleaned.title,
            slug,
            event_type: cleaned.event_type,
            summary: cleaned.summary,
            cover_image_url: cleaned.cover_image_url,
            gallery_urls: cleaned.gallery_urls,
            project_background: cleaned.project_background || null,
            project_goals: cleaned.project_goals || null,
            execution_highlights: cleaned.execution_highlights,
            result_metrics: cleaned.result_metrics,
            result_summary: cleaned.result_summary || null,
            tags: cleaned.tags,
            seo_title: cleaned.seo_title,
            seo_description: cleaned.seo_description,
            publish_status: cleaned.publish_status,
          },
        })
      }

      const nextForm: CaseForm = {
        ...cleaned,
        slug: savedItem.slug,
        published_at: savedItem.published_at,
      }
      setEditing(savedItem)
      setForm(nextForm)
      setSavedForm(nextForm)
      const successText =
        savedItem.publish_status === 'published'
          ? '案例已保存并发布，前台刷新后即可看到。'
          : '案例已保存为草稿。'
      setMessage(successText)
      setSaveFeedback({ type: 'success', text: successText })
      await Promise.all([loadItems(false), loadStats()])
    } catch (saveError: any) {
      const errorText = saveError?.message || '保存失败，请检查填写内容后重试。'
      setError(errorText)
      setSaveFeedback({ type: 'error', text: errorText })
    } finally {
      setSaving(false)
    }
  }, [
    contentIsComplete,
    editing,
    form,
    isBusy,
    isDirty,
    loadItems,
    loadStats,
    mediaIsComplete,
    reviewRequirementIsSatisfied,
  ])

  useEffect(() => {
    const saveWithKeyboard = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void onSave()
      }
    }
    window.addEventListener('keydown', saveWithKeyboard)
    return () => window.removeEventListener('keydown', saveWithKeyboard)
  }, [onSave])

  const onDelete = async (item: CaseItem) => {
    if (!window.confirm(`确认永久删除案例“${item.title}”？此操作无法撤销。`)) return
    setError('')
    setMessage('')
    try {
      await adminFetch(`/api/admin/cases/${item.id}`, { method: 'DELETE' })
      if (editing?.id === item.id) resetToNew()
      setMessage('案例已删除。')
      await Promise.all([loadItems(false), loadStats()])
    } catch (deleteError: any) {
      setError(deleteError?.message || '删除失败，请稍后重试。')
    }
  }

  const onRefresh = async () => {
    setMessage('')
    await Promise.all([loadItems(false), loadStats()])
  }

  const clearFilters = () => {
    setSearchInput('')
    setQuery('')
    setPublishStatus('')
    setEventType('')
  }

  const hasFilters = Boolean(searchInput.trim() || publishStatus || eventType)

  return (
    <div className="admin-page admin-cases-page">
      <div className="admin-page-header admin-cases-header">
        <div>
          <div className="admin-page-eyebrow">Project portfolio</div>
          <h1 className="admin-page-title">项目案例</h1>
          <p className="admin-page-sub">维护案例内容、现场图片与前台发布状态。</p>
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
          <button type="button" className="admin-primary-btn admin-inline-btn" onClick={startCreate}>
            <Plus size={17} aria-hidden="true" />
            新建案例
          </button>
        </div>
      </div>

      <section className="admin-case-stats" aria-label="案例内容概览">
        <button
          type="button"
          className={!publishStatus ? 'is-active' : ''}
          onClick={() => setPublishStatus('')}
        >
          <span className="admin-case-stat-icon stat-total">
            <LayoutGrid size={18} aria-hidden="true" />
          </span>
          <span>
            <small>全部案例</small>
            <strong>{stats.total}</strong>
          </span>
          <em>覆盖 {EVENT_TYPES.length} 类活动</em>
        </button>
        <button
          type="button"
          className={publishStatus === 'published' ? 'is-active' : ''}
          onClick={() => setPublishStatus('published')}
        >
          <span className="admin-case-stat-icon stat-published">
            <Globe2 size={18} aria-hidden="true" />
          </span>
          <span>
            <small>前台已发布</small>
            <strong>{stats.published}</strong>
          </span>
          <em>客户当前可见</em>
        </button>
        <button
          type="button"
          className={publishStatus === 'draft' ? 'is-active' : ''}
          onClick={() => setPublishStatus('draft')}
        >
          <span className="admin-case-stat-icon stat-draft">
            <Edit3 size={18} aria-hidden="true" />
          </span>
          <span>
            <small>待完善草稿</small>
            <strong>{stats.draft}</strong>
          </span>
          <em>仅后台可见</em>
        </button>
        <div className="admin-case-stat-card">
          <span className="admin-case-stat-icon stat-updated">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <span>
            <small>今日更新</small>
            <strong>{stats.updated_today}</strong>
          </span>
          <em>内容保持活跃</em>
        </div>
      </section>

      <div className="admin-cases-toolbar">
        <div className="admin-case-status-tabs" role="group" aria-label="按发布状态筛选">
          <button
            type="button"
            className={!publishStatus ? 'is-active' : ''}
            onClick={() => setPublishStatus('')}
          >
            全部
          </button>
          {PUBLISH_STATUS_OPTIONS.map((item) => (
            <button
              type="button"
              className={publishStatus === item.value ? 'is-active' : ''}
              key={item.value}
              onClick={() => setPublishStatus(item.value)}
            >
              {item.label}
              <span>{item.value === 'published' ? stats.published : stats.draft}</span>
            </button>
          ))}
        </div>
        <select
          className="admin-case-type-filter"
          value={eventType}
          onChange={(event) => setEventType(event.target.value)}
          aria-label="按活动类型筛选"
        >
          <option value="">全部活动类型</option>
          {EVENT_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <label className="admin-cases-search">
          <Search size={17} aria-hidden="true" />
          <input
            ref={searchInputRef}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="搜索案例标题或页面地址"
            aria-label="搜索案例"
          />
          {searchInput ? (
            <button type="button" onClick={() => setSearchInput('')} aria-label="清空搜索">
              <X size={15} aria-hidden="true" />
            </button>
          ) : (
            <kbd>/</kbd>
          )}
        </label>
      </div>

      {message ? (
        <div className="admin-success admin-cases-feedback" role="status">
          <Check size={17} aria-hidden="true" />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="admin-error admin-cases-feedback" role="alert">
          {error}
        </div>
      ) : null}

      <div className="admin-cases-workspace">
        <section className="admin-cases-list-panel" aria-label="案例列表">
          <header className="admin-cases-list-head">
            <div>
              <strong>
                {publishStatus ? getPublishStatusLabel(publishStatus) : '全部案例'}
              </strong>
              <span>共 {items.length} 条结果</span>
            </div>
            {eventType ? <small>{getEventTypeLabel(eventType)}</small> : null}
          </header>

          <div className="admin-cases-records">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div className="admin-case-record-skeleton" key={index} aria-hidden="true">
                  <span />
                  <i />
                  <i />
                </div>
              ))
            ) : (
              items.map((item) => (
                <article
                  className={`admin-case-record ${
                    editing?.id === item.id ? 'is-selected' : ''
                  }`}
                  key={item.id}
                >
                  <button
                    type="button"
                    className="admin-case-record-main"
                    onClick={() => void startEdit(item)}
                  >
                    <img src={getCaseImage(item)} alt="" />
                    <span className="admin-case-record-body">
                      <span className="admin-case-record-top">
                        <span className={`admin-status-pill status-${item.publish_status}`}>
                          {getPublishStatusLabel(item.publish_status)}
                        </span>
                        <small>{formatRelativeDate(item.updated_at)}</small>
                      </span>
                      <strong>{item.title}</strong>
                      <span className="admin-case-record-type">
                        {getEventTypeLabel(item.event_type)}
                      </span>
                      <span className="admin-case-record-summary">
                        {item.summary || '暂无摘要'}
                      </span>
                    </span>
                  </button>
                  <div className="admin-case-record-actions">
                    {item.publish_status === 'published' ? (
                      <a href={`/cases/${item.slug}`} target="_blank" rel="noreferrer">
                        <ExternalLink size={14} aria-hidden="true" />
                        查看
                      </a>
                    ) : (
                      <span>草稿</span>
                    )}
                    <button type="button" onClick={() => void onDelete(item)}>
                      <Trash2 size={14} aria-hidden="true" />
                      删除
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {!loading && items.length === 0 ? (
            <div className="admin-case-empty">
              <LayoutGrid size={25} aria-hidden="true" />
              <strong>{hasFilters ? '没有符合条件的案例' : '还没有项目案例'}</strong>
              <p>{hasFilters ? '可以调整搜索或清除筛选条件。' : '创建首个案例后会显示在这里。'}</p>
              <button type="button" onClick={hasFilters ? clearFilters : startCreate}>
                {hasFilters ? '清除筛选' : '新建案例'}
              </button>
            </div>
          ) : null}
        </section>

        <section className="admin-case-editor-panel" aria-label="案例编辑器">
          <header className="admin-case-editor-head">
            <div>
              <span className="admin-case-editor-mode">
                {editing ? `案例 #${editing.id}` : '新案例'}
              </span>
              <div className="admin-case-editor-title-row">
                <h2>{editing ? editing.title : '创建项目案例'}</h2>
                <span className={`admin-status-pill status-${form.publish_status}`}>
                  {getPublishStatusLabel(form.publish_status)}
                </span>
              </div>
              <p>
                {isDirty ? '有尚未保存的修改' : editing ? `上次发布：${formatDate(form.published_at)}` : '填写内容后保存为草稿或直接发布'}
              </p>
            </div>
            <div className="admin-case-editor-head-actions">
              {isDirty ? (
                <button
                  type="button"
                  onClick={() => {
                    setForm(savedForm)
                    setSaveFeedback(null)
                  }}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  恢复
                </button>
              ) : null}
              {editing?.publish_status === 'published' ? (
                <a href={`/cases/${editing.slug}`} target="_blank" rel="noreferrer">
                  查看前台
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </header>

          <div className="admin-case-completeness">
            <div>
              <span>发布必填</span>
              <strong>{completedRequired}/3 已完成</strong>
            </div>
            <div className="admin-case-completeness-track">
              <span style={{ width: `${(completedRequired / 3) * 100}%` }} />
            </div>
            <div className="admin-case-completeness-items">
              <span className={contentIsComplete ? 'is-complete' : ''}>
                {contentIsComplete ? <Check size={13} aria-hidden="true" /> : null}
                标题与摘要
              </span>
              <span className={mediaIsComplete ? 'is-complete' : ''}>
                {mediaIsComplete ? <Check size={13} aria-hidden="true" /> : null}
                案例封面
              </span>
              <span className={reviewIsComplete ? 'is-complete' : ''}>
                {reviewIsComplete ? <Check size={13} aria-hidden="true" /> : null}
                项目复盘
              </span>
            </div>
          </div>

          <nav className="admin-case-editor-tabs" aria-label="案例编辑分区">
            {EDITOR_TABS.map((tab) => {
              const Icon = tab.icon
              const complete =
                tab.value === 'content'
                  ? contentIsComplete
                  : tab.value === 'review'
                    ? reviewIsComplete
                  : tab.value === 'media'
                    ? mediaIsComplete
                    : seoIsComplete
              return (
                <button
                  type="button"
                  className={activeTab === tab.value ? 'is-active' : ''}
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                >
                  <Icon size={16} aria-hidden="true" />
                  {tab.label}
                  {complete ? <CheckCircle2 size={14} aria-hidden="true" /> : null}
                </button>
              )
            })}
          </nav>

          {detailLoading ? (
            <div className="admin-case-editor-loading">
              <span className="admin-loading-spinner" aria-hidden="true" />
              正在读取案例详情…
            </div>
          ) : (
            <div className="admin-case-editor-body">
              {activeTab === 'content' ? (
                <div className="admin-case-editor-section" data-editor-tab="content">
                  <div className="admin-case-section-intro">
                    <div>
                      <h3>基础内容</h3>
                      <p>这些信息会直接显示在案例列表和详情页。</p>
                    </div>
                  </div>

                  <label className="admin-field">
                    <span className="admin-field-label">
                      <strong>案例标题</strong>
                      <small>{form.title.length}/200</small>
                    </span>
                    <input
                      value={form.title}
                      onChange={(event) => updateForm('title', event.target.value)}
                      maxLength={200}
                      placeholder="例如：WTT 重庆站大型赛事执行案例"
                      aria-invalid={!form.title.trim()}
                    />
                    {!form.title.trim() ? (
                      <small className="admin-field-error">案例标题不能为空。</small>
                    ) : (
                      <small className="admin-field-hint">建议突出项目名称、活动类型或成果。</small>
                    )}
                  </label>

                  <label className="admin-field">
                    <span>活动类型</span>
                    <select
                      value={form.event_type}
                      onChange={(event) => {
                        if (isCaseEventType(event.target.value)) {
                          updateForm('event_type', event.target.value)
                        }
                      }}
                    >
                      {EVENT_TYPES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="admin-field">
                    <span className="admin-field-label">
                      <strong>案例摘要</strong>
                      <small>{form.summary.length}/500</small>
                    </span>
                    <textarea
                      className="admin-textarea admin-case-summary-input"
                      rows={5}
                      value={form.summary}
                      onChange={(event) => updateForm('summary', event.target.value)}
                      maxLength={500}
                      placeholder="用 1–2 句话说明项目目标、交付内容和结果。"
                      aria-invalid={!form.summary.trim()}
                    />
                    {!form.summary.trim() ? (
                      <small className="admin-field-error">案例摘要不能为空。</small>
                    ) : (
                      <small className="admin-field-hint">建议控制在 80–160 字，便于客户快速阅读。</small>
                    )}
                  </label>

                  <div className="admin-case-publish-control">
                    <div>
                      <strong>前台展示状态</strong>
                      <p>发布后，客户可在官网案例列表和详情页看到此内容。</p>
                    </div>
                    <div role="group" aria-label="选择案例发布状态">
                      {PUBLISH_STATUS_OPTIONS.map((item) => (
                        <button
                          type="button"
                          className={form.publish_status === item.value ? 'is-active' : ''}
                          key={item.value}
                          onClick={() => updateForm('publish_status', item.value)}
                        >
                          {item.value === 'published' ? (
                            <Globe2 size={16} aria-hidden="true" />
                          ) : (
                            <Edit3 size={16} aria-hidden="true" />
                          )}
                          <span>
                            <strong>{item.label}</strong>
                            <small>{item.help}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {activeTab === 'review' ? (
                <div className="admin-case-editor-section" data-editor-tab="review">
                  <div className="admin-case-section-intro">
                    <div>
                      <h3>项目复盘</h3>
                      <p>按前台阅读顺序维护项目背景、执行亮点与真实成果。</p>
                    </div>
                    <span>发布时必填背景、目标和至少 1 项亮点</span>
                  </div>

                  <div className="admin-case-review-editor">
                    <label className="admin-field">
                      <span className="admin-field-label">
                        <strong>项目背景</strong>
                        <small>{form.project_background.length}/2000</small>
                      </span>
                      <textarea
                        className="admin-textarea"
                        rows={6}
                        value={form.project_background}
                        onChange={(event) => updateForm('project_background', event.target.value)}
                        maxLength={2000}
                        placeholder="说明项目缘起、客户需求、活动场景与关键约束。"
                        aria-invalid={
                          form.publish_status === 'published' &&
                          form.project_background.trim().length < 20
                        }
                      />
                      <small className="admin-field-hint">发布时需填写 20–2000 字。</small>
                    </label>

                    <label className="admin-field">
                      <span className="admin-field-label">
                        <strong>项目目标</strong>
                        <small>{form.project_goals.length}/1000</small>
                      </span>
                      <textarea
                        className="admin-textarea"
                        rows={5}
                        value={form.project_goals}
                        onChange={(event) => updateForm('project_goals', event.target.value)}
                        maxLength={1000}
                        placeholder="说明项目希望达成的业务、传播或现场体验目标。"
                        aria-invalid={
                          form.publish_status === 'published' &&
                          form.project_goals.trim().length < 10
                        }
                      />
                      <small className="admin-field-hint">发布时需填写 10–1000 字。</small>
                    </label>

                    <div className="admin-case-structured-editor">
                      <div className="admin-case-gallery-head">
                        <div>
                          <strong>执行亮点</strong>
                          <p>至少 1 项，最多 6 项；可通过箭头调整展示顺序。</p>
                        </div>
                        <button
                          type="button"
                          className="admin-secondary-btn"
                          disabled={highlightItems.length >= 6}
                          onClick={() =>
                            setHighlightItems([
                              ...highlightItems,
                              { title: '', description: '' },
                            ])
                          }
                        >
                          <Plus size={15} aria-hidden="true" />
                          添加亮点
                        </button>
                      </div>
                      {highlightItems.length > 0 ? (
                        <div className="admin-case-structured-list">
                          {highlightItems.map((item, index) => (
                            <article key={index} className="admin-case-structured-item">
                              <div className="admin-case-structured-item-head">
                                <strong>亮点 {index + 1}</strong>
                                <div>
                                  <button type="button" disabled={index === 0} onClick={() => moveHighlight(index, -1)} aria-label={`上移亮点 ${index + 1}`}><ArrowUp size={14} /></button>
                                  <button type="button" disabled={index === highlightItems.length - 1} onClick={() => moveHighlight(index, 1)} aria-label={`下移亮点 ${index + 1}`}><ArrowDown size={14} /></button>
                                  <button type="button" className="is-danger" onClick={() => setHighlightItems(highlightItems.filter((_, itemIndex) => itemIndex !== index))} aria-label={`删除亮点 ${index + 1}`}><Trash2 size={14} /></button>
                                </div>
                              </div>
                              <label className="admin-field">
                                <span>亮点标题</span>
                                <input
                                  value={item.title}
                                  maxLength={40}
                                  onChange={(event) => updateHighlight(index, 'title', event.target.value)}
                                  placeholder="2–40 字"
                                  aria-invalid={form.publish_status === 'published' && item.title.trim().length < 2}
                                />
                              </label>
                              <label className="admin-field">
                                <span>亮点说明</span>
                                <textarea
                                  className="admin-textarea"
                                  rows={4}
                                  value={item.description}
                                  maxLength={500}
                                  onChange={(event) => updateHighlight(index, 'description', event.target.value)}
                                  placeholder="10–500 字，说明具体做法和价值。"
                                  aria-invalid={form.publish_status === 'published' && item.description.trim().length < 10}
                                />
                              </label>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="admin-case-gallery-empty">
                          <ListChecks size={23} aria-hidden="true" />
                          <strong>还没有执行亮点</strong>
                          <span>发布前至少添加一项真实执行亮点。</span>
                          <button
                            type="button"
                            aria-invalid={form.publish_status === 'published'}
                            onClick={() => setHighlightItems([{ title: '', description: '' }])}
                          >添加第一项</button>
                        </div>
                      )}
                    </div>

                    <div className="admin-case-structured-editor">
                      <div className="admin-case-gallery-head">
                        <div>
                          <strong>成果数据</strong>
                          <p>可选，最多 6 项；没有真实数据时请留空。</p>
                        </div>
                        <button
                          type="button"
                          className="admin-secondary-btn"
                          disabled={metricItems.length >= 6}
                          onClick={() =>
                            setMetricItems([
                              ...metricItems,
                              { label: '', value: '', description: '' },
                            ])
                          }
                        >
                          <Plus size={15} aria-hidden="true" />
                          添加指标
                        </button>
                      </div>
                      {metricItems.length > 0 ? (
                        <div className="admin-case-structured-list">
                          {metricItems.map((item, index) => (
                            <article key={index} className="admin-case-structured-item">
                              <div className="admin-case-structured-item-head">
                                <strong>指标 {index + 1}</strong>
                                <div>
                                  <button type="button" disabled={index === 0} onClick={() => moveMetric(index, -1)} aria-label={`上移指标 ${index + 1}`}><ArrowUp size={14} /></button>
                                  <button type="button" disabled={index === metricItems.length - 1} onClick={() => moveMetric(index, 1)} aria-label={`下移指标 ${index + 1}`}><ArrowDown size={14} /></button>
                                  <button type="button" className="is-danger" onClick={() => setMetricItems(metricItems.filter((_, itemIndex) => itemIndex !== index))} aria-label={`删除指标 ${index + 1}`}><Trash2 size={14} /></button>
                                </div>
                              </div>
                              <div className="admin-grid-2">
                                <label className="admin-field">
                                  <span>指标名称</span>
                                  <input value={item.label} maxLength={20} onChange={(event) => updateMetric(index, 'label', event.target.value)} placeholder="例如：到场人次" aria-invalid={form.publish_status === 'published' && !item.label.trim()} />
                                </label>
                                <label className="admin-field">
                                  <span>指标数值</span>
                                  <input value={item.value} maxLength={30} onChange={(event) => updateMetric(index, 'value', event.target.value)} placeholder="例如：12,000+" aria-invalid={form.publish_status === 'published' && !item.value.trim()} />
                                </label>
                              </div>
                              <label className="admin-field">
                                <span>指标说明（可选）</span>
                                <input value={item.description} maxLength={100} onChange={(event) => updateMetric(index, 'description', event.target.value)} placeholder="补充口径、时间范围或来源" />
                              </label>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <div className="admin-case-gallery-empty">
                          <LayoutGrid size={23} aria-hidden="true" />
                          <strong>未填写成果数据</strong>
                          <span>前台不会显示成果数据模块。</span>
                        </div>
                      )}
                    </div>

                    <label className="admin-field">
                      <span className="admin-field-label">
                        <strong>项目成果总结（可选）</strong>
                        <small>{form.result_summary.length}/1000</small>
                      </span>
                      <textarea
                        className="admin-textarea"
                        rows={5}
                        value={form.result_summary}
                        onChange={(event) => updateForm('result_summary', event.target.value)}
                        maxLength={1000}
                        placeholder="总结项目最终价值、影响或客户反馈。"
                      />
                    </label>
                  </div>

                  <div className="admin-case-content-preview" aria-label="案例内容预览">
                    <div className="admin-case-section-intro">
                      <div>
                        <h3>内容预览</h3>
                        <p>模块顺序与前台详情页一致，空的可选模块不会展示。</p>
                      </div>
                    </div>
                    <article>
                      <header>
                        <span>{getEventTypeLabel(form.event_type)}</span>
                        <h3>{form.title || '案例标题'}</h3>
                        <p>{form.summary || '案例摘要'}</p>
                      </header>
                      {form.project_background || form.project_goals ? (
                        <section>
                          <h4>项目背景</h4>
                          {form.project_background ? <p>{form.project_background}</p> : null}
                          {form.project_goals ? <p><strong>项目目标：</strong>{form.project_goals}</p> : null}
                        </section>
                      ) : null}
                      {highlightItems.length > 0 ? (
                        <section><h4>执行亮点</h4>{highlightItems.map((item, index) => <div key={index}><strong>{item.title || `亮点 ${index + 1}`}</strong><p>{item.description || '亮点说明'}</p></div>)}</section>
                      ) : null}
                      {metricItems.length > 0 ? (
                        <section><h4>成果数据</h4><div className="admin-case-preview-metrics">{metricItems.map((item, index) => <div key={index}><span>{item.label || '指标'}</span><strong>{item.value || '数值'}</strong>{item.description ? <small>{item.description}</small> : null}</div>)}</div></section>
                      ) : null}
                      {form.result_summary ? <section><h4>项目成果总结</h4><p>{form.result_summary}</p></section> : null}
                      {galleryItems.length > 0 ? <section><h4>现场图集</h4><p>{galleryItems.length} 张图片，将按当前顺序展示。</p></section> : null}
                      <section><h4>合作咨询</h4><p>咨询同类项目</p></section>
                    </article>
                  </div>
                </div>
              ) : null}

              {activeTab === 'media' ? (
                <div className="admin-case-editor-section" data-editor-tab="media">
                  <div className="admin-case-section-intro">
                    <div>
                      <h3>图片素材</h3>
                      <p>先设置封面，再按前台展示顺序整理现场图集。</p>
                    </div>
                    <span>{galleryItems.length} 张现场图</span>
                  </div>

                  <div className="admin-case-cover-editor">
                    <div className="admin-case-cover-preview">
                      {form.cover_image_url ? (
                        <img src={resolveMediaUrl(form.cover_image_url)} alt="案例封面预览" />
                      ) : (
                        <div>
                          <Image size={28} aria-hidden="true" />
                          <strong>还没有封面图</strong>
                          <span>建议使用 16:9 横图</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <strong>案例封面</strong>
                      <p>用于前台案例卡片及详情页首屏，支持 JPG、PNG、WebP 或 GIF，单张不超过 8MB。</p>
                      <div className="admin-upload-actions">
                        <label
                          className={`admin-upload-button${coverUploading ? ' is-disabled' : ''}`}
                        >
                          <UploadCloud size={17} aria-hidden="true" />
                          {coverUploading
                            ? '上传中…'
                            : form.cover_image_url
                              ? '更换封面'
                              : '上传封面'}
                          <input
                            className="admin-file-input"
                            type="file"
                            accept={IMAGE_ACCEPT}
                            disabled={coverUploading}
                            onChange={handleCoverUpload}
                          />
                        </label>
                        {form.cover_image_url ? (
                          <button
                            type="button"
                            className="admin-case-remove-media"
                            onClick={() => updateForm('cover_image_url', '')}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                            移除
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="admin-case-gallery-editor">
                    <div className="admin-case-gallery-head">
                      <div>
                        <strong>现场图集</strong>
                        <p>可一次上传多张，并通过箭头调整前台展示顺序。</p>
                      </div>
                      <label
                        className={`admin-upload-button${galleryUploading ? ' is-disabled' : ''}`}
                      >
                        <Plus size={16} aria-hidden="true" />
                        {galleryUploading ? '上传中…' : '添加图片'}
                        <input
                          className="admin-file-input"
                          type="file"
                          accept={IMAGE_ACCEPT}
                          multiple
                          disabled={galleryUploading}
                          onChange={handleGalleryUpload}
                        />
                      </label>
                    </div>

                    {galleryItems.length > 0 ? (
                      <div className="admin-case-gallery-grid">
                        {galleryItems.map((url, index) => (
                          <figure className="admin-case-gallery-item" key={`${url}-${index}`}>
                            <img src={resolveMediaUrl(url)} alt={`现场图片 ${index + 1}`} />
                            <figcaption>{String(index + 1).padStart(2, '0')}</figcaption>
                            <div>
                              <button
                                type="button"
                                onClick={() => moveGalleryItem(index, -1)}
                                disabled={index === 0}
                                aria-label={`上移第 ${index + 1} 张图片`}
                              >
                                <ArrowUp size={14} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveGalleryItem(index, 1)}
                                disabled={index === galleryItems.length - 1}
                                aria-label={`下移第 ${index + 1} 张图片`}
                              >
                                <ArrowDown size={14} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                className="is-danger"
                                onClick={() => removeGalleryItem(index)}
                                aria-label={`移除第 ${index + 1} 张图片`}
                              >
                                <Trash2 size={14} aria-hidden="true" />
                              </button>
                            </div>
                          </figure>
                        ))}
                      </div>
                    ) : (
                      <div className="admin-case-gallery-empty">
                        <Images size={23} aria-hidden="true" />
                        <strong>还没有现场图片</strong>
                        <span>添加后会按顺序展示在案例详情页。</span>
                      </div>
                    )}
                  </div>

                  <details className="admin-advanced-settings admin-case-media-addresses">
                    <summary>手动管理图片地址</summary>
                    <label className="admin-field">
                      <span>封面图地址</span>
                      <input
                        value={form.cover_image_url}
                        aria-invalid={!form.cover_image_url.trim()}
                        onChange={(event) => updateForm('cover_image_url', event.target.value)}
                        placeholder="/uploads/cases/image.jpg"
                      />
                    </label>
                    <label className="admin-field">
                      <span>图集图片地址</span>
                      <textarea
                        className="admin-textarea"
                        rows={4}
                        value={jsonArrayToLines(form.gallery_urls)}
                        onChange={(event) =>
                          updateForm('gallery_urls', linesToJsonArray(event.target.value))
                        }
                        placeholder="一行一个图片地址"
                      />
                    </label>
                  </details>
                </div>
              ) : null}

              {activeTab === 'seo' ? (
                <div className="admin-case-editor-section" data-editor-tab="seo">
                  <div className="admin-case-section-intro">
                    <div>
                      <h3>标签与搜索展示</h3>
                      <p>标签帮助客户理解项目能力，搜索文案用于页面分享与检索。</p>
                    </div>
                  </div>

                  <div className="admin-case-tag-editor">
                    <label htmlFor="case-tag-input">案例标签</label>
                    <div className="admin-case-tags">
                      {tagItems.map((tag) => (
                        <span key={tag}>
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            aria-label={`移除标签 ${tag}`}
                          >
                            <X size={12} aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                      <input
                        id="case-tag-input"
                        value={tagInput}
                        onChange={(event) => setTagInput(event.target.value)}
                        onKeyDown={onTagKeyDown}
                        onBlur={addTag}
                        placeholder={tagItems.length ? '继续添加…' : '输入标签后按回车'}
                      />
                    </div>
                    <small>例如：赛事、城市活动、现场运营。</small>
                  </div>

                  <label className="admin-field">
                    <span className="admin-field-label">
                      <strong>页面地址</strong>
                      <small>{editing ? '创建后不可修改' : '可自动生成'}</small>
                    </span>
                    <input
                      value={form.slug}
                      disabled={Boolean(editing)}
                      onChange={(event) => updateForm('slug', event.target.value)}
                      placeholder="不填写时系统会自动生成"
                    />
                    {editing ? (
                      <small className="admin-field-hint">/cases/{form.slug}</small>
                    ) : null}
                  </label>

                  <label className="admin-field">
                    <span className="admin-field-label">
                      <strong>搜索标题</strong>
                      <small>{form.seo_title.length}/255</small>
                    </span>
                    <input
                      value={form.seo_title}
                      onChange={(event) => updateForm('seo_title', event.target.value)}
                      maxLength={255}
                      placeholder="不填则默认使用案例标题"
                    />
                  </label>

                  <label className="admin-field">
                    <span className="admin-field-label">
                      <strong>搜索描述</strong>
                      <small>{form.seo_description.length}/500</small>
                    </span>
                    <textarea
                      className="admin-textarea"
                      rows={4}
                      value={form.seo_description}
                      onChange={(event) => updateForm('seo_description', event.target.value)}
                      maxLength={500}
                      placeholder="用于搜索结果或分享时展示的说明"
                    />
                  </label>

                  <div className="admin-case-search-preview">
                    <span>搜索结果预览</span>
                    <strong>{form.seo_title || form.title || '案例标题'}</strong>
                    <small>
                      /cases/{form.slug || createSlug(form.title || 'case')}
                    </small>
                    <p>{form.seo_description || form.summary || '案例说明会显示在这里。'}</p>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          <footer className="admin-case-save-bar">
            <div>
              <span className={isDirty ? 'is-dirty' : 'is-saved'} aria-hidden="true" />
              <div>
                <strong>{isDirty ? '有未保存的修改' : '所有修改均已保存'}</strong>
                <small>
                  {!isValid
                    ? form.publish_status === 'published'
                      ? '请完善基础内容、项目复盘和封面图'
                      : '请完善标题、摘要和封面图'
                    : form.publish_status === 'published'
                      ? '保存后将同步到前台'
                      : '保存后仅后台可见'}
                </small>
              </div>
            </div>
            <div>
              <kbd>⌘ S</kbd>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={() => void onSave()}
                disabled={isBusy || !isDirty}
              >
                <Save size={16} aria-hidden="true" />
                {saving ? '保存中…' : editing ? '保存修改' : '创建案例'}
              </button>
            </div>
            {saveFeedback ? (
              <div
                className={`admin-case-save-feedback ${saveFeedback.type}`}
                role={saveFeedback.type === 'error' ? 'alert' : 'status'}
              >
                {saveFeedback.text}
              </div>
            ) : null}
          </footer>
        </section>
      </div>
    </div>
  )
}
