import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Mail,
  MessageCircle,
  Monitor,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { adminFetch } from '../../admin/api'

type SiteConfigOut = {
  id: number
  home_hero_title: string
  home_hero_subtitle: string
  service_highlights: string
  contact_channels: string
  updated_at: string
}

type EditorState = {
  homeHeroTitle: string
  homeHeroSubtitle: string
  serviceHighlights: string[]
  contactEmail: string
  contactWechat: string
  contactPhone: string
}

const EMPTY_EDITOR: EditorState = {
  homeHeroTitle: '',
  homeHeroSubtitle: '',
  serviceHighlights: [],
  contactEmail: '',
  contactWechat: '',
  contactPhone: '',
}

function parseServiceHighlights(value: string) {
  try {
    const parsed = JSON.parse(value || '[]')
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string')
    }
  } catch {
    // The old editor accepted line-separated text, so keep it recoverable.
  }
  return (value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
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

function configToEditor(config: SiteConfigOut): EditorState {
  const contacts = parseContactChannels(config.contact_channels)
  return {
    homeHeroTitle: config.home_hero_title || '',
    homeHeroSubtitle: config.home_hero_subtitle || '',
    serviceHighlights: parseServiceHighlights(config.service_highlights),
    contactEmail: contacts.email,
    contactWechat: contacts.wechat,
    contactPhone: contacts.phone,
  }
}

function cleanEditor(editor: EditorState): EditorState {
  return {
    homeHeroTitle: editor.homeHeroTitle.trim(),
    homeHeroSubtitle: editor.homeHeroSubtitle.trim(),
    serviceHighlights: editor.serviceHighlights.map((item) => item.trim()).filter(Boolean),
    contactEmail: editor.contactEmail.trim(),
    contactWechat: editor.contactWechat.trim(),
    contactPhone: editor.contactPhone.trim(),
  }
}

function formatUpdatedAt(value: string) {
  if (!value) return '暂未记录'
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

export function AdminSiteConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [message, setMessage] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [editor, setEditor] = useState<EditorState>(EMPTY_EDITOR)
  const [savedEditor, setSavedEditor] = useState<EditorState>(EMPTY_EDITOR)

  const isDirty = useMemo(
    () => JSON.stringify(editor) !== JSON.stringify(savedEditor),
    [editor, savedEditor],
  )
  const emailIsValid =
    !editor.contactEmail.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editor.contactEmail.trim())
  const canSave =
    editor.homeHeroTitle.trim().length > 0 &&
    editor.homeHeroSubtitle.trim().length > 0 &&
    emailIsValid &&
    !saving

  const loadConfig = useCallback(() => {
    setLoading(true)
    setLoadError('')
    adminFetch<SiteConfigOut>('/api/admin/site-config')
      .then((data) => {
        const nextEditor = configToEditor(data)
        setEditor(nextEditor)
        setSavedEditor(nextEditor)
        setUpdatedAt(data.updated_at || '')
      })
      .catch((error) => setLoadError(error?.message || '站点内容加载失败，请稍后重试。'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    if (!isDirty) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isDirty])

  const updateEditor = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setEditor((current) => ({ ...current, [key]: value }))
    setMessage('')
    setSaveError('')
  }

  const onSave = useCallback(async () => {
    if (!canSave || !isDirty) return
    setSaving(true)
    setMessage('')
    setSaveError('')
    const cleaned = cleanEditor(editor)
    try {
      const updated = await adminFetch<SiteConfigOut>('/api/admin/site-config', {
        method: 'PUT',
        json: {
          home_hero_title: cleaned.homeHeroTitle,
          home_hero_subtitle: cleaned.homeHeroSubtitle,
          service_highlights: JSON.stringify(cleaned.serviceHighlights),
          contact_channels: JSON.stringify({
            email: cleaned.contactEmail,
            wechat: cleaned.contactWechat,
            phone: cleaned.contactPhone,
          }),
        },
      })
      const nextEditor = configToEditor(updated)
      setEditor(nextEditor)
      setSavedEditor(nextEditor)
      setUpdatedAt(updated.updated_at || '')
      setMessage('站点内容已保存，前台刷新后即可看到更新。')
    } catch (error: any) {
      setSaveError(error?.message || '保存失败，请稍后重试。')
    } finally {
      setSaving(false)
    }
  }, [canSave, editor, isDirty])

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

  const addHighlight = () => {
    updateEditor('serviceHighlights', [...editor.serviceHighlights, ''])
    window.setTimeout(() => {
      const inputs = document.querySelectorAll<HTMLInputElement>('.admin-highlight-input')
      inputs.item(inputs.length - 1)?.focus()
    }, 0)
  }

  const updateHighlight = (index: number, value: string) => {
    const next = [...editor.serviceHighlights]
    next[index] = value
    updateEditor('serviceHighlights', next)
  }

  const removeHighlight = (index: number) => {
    updateEditor(
      'serviceHighlights',
      editor.serviceHighlights.filter((_, itemIndex) => itemIndex !== index),
    )
  }

  const moveHighlight = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= editor.serviceHighlights.length) return
    const next = [...editor.serviceHighlights]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    updateEditor('serviceHighlights', next)
  }

  const restoreSaved = () => {
    setEditor(savedEditor)
    setMessage('已恢复为上次保存的内容。')
    setSaveError('')
  }

  if (loading) {
    return (
      <div className="admin-content-loading" role="status">
        <span className="admin-loading-spinner" aria-hidden="true" />
        <strong>正在准备内容工作台</strong>
        <small>正在读取首页文案与联系方式…</small>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="admin-content-error">
        <strong>站点内容暂时无法加载</strong>
        <p>{loadError}</p>
        <button type="button" className="admin-primary-btn" onClick={loadConfig}>
          重新加载
        </button>
      </div>
    )
  }

  const heroIsComplete = Boolean(
    editor.homeHeroTitle.trim() && editor.homeHeroSubtitle.trim(),
  )
  const highlightsAreComplete = editor.serviceHighlights.some((item) => item.trim())
  const contactsAreComplete = Boolean(
    editor.contactEmail.trim() || editor.contactWechat.trim() || editor.contactPhone.trim(),
  )
  const completedSections = [
    heroIsComplete,
    highlightsAreComplete,
    contactsAreComplete,
  ].filter(Boolean).length

  return (
    <div className="admin-page admin-content-page">
      <div className="admin-page-header admin-content-header">
        <div>
          <div className="admin-page-eyebrow">Website content</div>
          <h1 className="admin-page-title">站点内容</h1>
          <p className="admin-page-sub">编辑访客最先看到的首页信息，并在发布前确认展示效果。</p>
        </div>
        <div className="admin-header-actions">
          <a className="admin-secondary-btn" href="/" target="_blank" rel="noreferrer">
            查看前台
            <ExternalLink size={16} aria-hidden="true" />
          </a>
          <button
            type="button"
            className="admin-primary-btn admin-inline-btn"
            onClick={() => void onSave()}
            disabled={!canSave || !isDirty}
          >
            <Save size={17} aria-hidden="true" />
            {saving ? '正在保存…' : isDirty ? '保存并更新' : '已保存'}
          </button>
        </div>
      </div>

      <div className="admin-content-status" aria-live="polite">
        <div className={`admin-save-state ${isDirty ? 'is-dirty' : 'is-saved'}`}>
          <span aria-hidden="true" />
          {isDirty ? '有尚未保存的修改' : '所有修改均已保存'}
        </div>
        <div className="admin-content-meta">
          <span>{completedSections}/3 项内容已完善</span>
          <span>上次更新：{formatUpdatedAt(updatedAt)}</span>
        </div>
      </div>

      {message ? (
        <div className="admin-success admin-content-feedback" role="status">
          <Check size={17} aria-hidden="true" />
          {message}
        </div>
      ) : null}
      {saveError ? (
        <div className="admin-error admin-content-feedback" role="alert">
          {saveError}
        </div>
      ) : null}

      <div className="admin-content-workspace">
        <aside className="admin-content-toc" aria-label="内容分区">
          <div className="admin-content-toc-title">页面内容</div>
          <a href="#home-hero-content">
            <span>01</span>
            <div>
              <strong>首页首屏</strong>
              <small>主标题与说明文字</small>
            </div>
            {heroIsComplete ? <Check size={15} aria-hidden="true" /> : null}
          </a>
          <a href="#service-content">
            <span>02</span>
            <div>
              <strong>服务亮点</strong>
              <small>{editor.serviceHighlights.filter((item) => item.trim()).length} 条内容</small>
            </div>
            {highlightsAreComplete ? <Check size={15} aria-hidden="true" /> : null}
          </a>
          <a href="#contact-content">
            <span>03</span>
            <div>
              <strong>联系方式</strong>
              <small>邮箱、微信与电话</small>
            </div>
            {contactsAreComplete ? <Check size={15} aria-hidden="true" /> : null}
          </a>
          <div className="admin-shortcut-tip">
            <kbd>⌘</kbd>
            <span>+</span>
            <kbd>S</kbd>
            <small>快速保存</small>
          </div>
        </aside>

        <div className="admin-content-editor">
          <section className="admin-content-section" id="home-hero-content">
            <header className="admin-content-section-head">
              <div className="admin-section-number">01</div>
              <div>
                <h2>首页首屏</h2>
                <p>用一句明确的话告诉访客“我们是谁、能提供什么”。</p>
              </div>
            </header>
            <div className="admin-content-fields">
              <label className="admin-field">
                <span className="admin-field-label">
                  <strong>首页大标题</strong>
                  <small>{editor.homeHeroTitle.length}/255</small>
                </span>
                <input
                  value={editor.homeHeroTitle}
                  onChange={(event) => updateEditor('homeHeroTitle', event.target.value)}
                  maxLength={255}
                  placeholder="例如：小熊团队"
                  aria-invalid={!editor.homeHeroTitle.trim()}
                />
                {!editor.homeHeroTitle.trim() ? (
                  <small className="admin-field-error">请输入首页大标题。</small>
                ) : (
                  <small className="admin-field-hint">建议 4–16 个字，突出品牌或核心定位。</small>
                )}
              </label>
              <label className="admin-field">
                <span className="admin-field-label">
                  <strong>首页说明文字</strong>
                  <small>{editor.homeHeroSubtitle.length}/500</small>
                </span>
                <textarea
                  className="admin-textarea admin-content-textarea"
                  value={editor.homeHeroSubtitle}
                  onChange={(event) => updateEditor('homeHeroSubtitle', event.target.value)}
                  maxLength={500}
                  rows={4}
                  placeholder="简要说明服务能力和项目价值"
                  aria-invalid={!editor.homeHeroSubtitle.trim()}
                />
                {!editor.homeHeroSubtitle.trim() ? (
                  <small className="admin-field-error">请输入首页说明文字。</small>
                ) : (
                  <small className="admin-field-hint">建议控制在两行内，让访客能快速读完。</small>
                )}
              </label>
            </div>
          </section>

          <section className="admin-content-section" id="service-content">
            <header className="admin-content-section-head">
              <div className="admin-section-number">02</div>
              <div>
                <h2>服务亮点</h2>
                <p>每条亮点会成为首页的一张能力卡片，排列顺序即前台展示顺序。</p>
              </div>
            </header>
            <div className="admin-highlight-list">
              {editor.serviceHighlights.map((item, index) => (
                <div className="admin-highlight-row" key={`${index}-${editor.serviceHighlights.length}`}>
                  <span className="admin-highlight-index">{String(index + 1).padStart(2, '0')}</span>
                  <input
                    className="admin-highlight-input"
                    value={item}
                    onChange={(event) => updateHighlight(index, event.target.value)}
                    maxLength={80}
                    placeholder="输入一项服务亮点"
                    aria-label={`第 ${index + 1} 条服务亮点`}
                  />
                  <div className="admin-highlight-actions">
                    <button
                      type="button"
                      onClick={() => moveHighlight(index, -1)}
                      disabled={index === 0}
                      aria-label={`上移第 ${index + 1} 条`}
                      title="上移"
                    >
                      <ArrowUp size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveHighlight(index, 1)}
                      disabled={index === editor.serviceHighlights.length - 1}
                      aria-label={`下移第 ${index + 1} 条`}
                      title="下移"
                    >
                      <ArrowDown size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="is-danger"
                      onClick={() => removeHighlight(index)}
                      aria-label={`删除第 ${index + 1} 条`}
                      title="删除"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
              {editor.serviceHighlights.length === 0 ? (
                <div className="admin-highlight-empty">
                  <Sparkles size={20} aria-hidden="true" />
                  <div>
                    <strong>还没有服务亮点</strong>
                    <span>添加后会作为能力卡片展示在首页。</span>
                  </div>
                </div>
              ) : null}
            </div>
            <button type="button" className="admin-add-row-btn" onClick={addHighlight}>
              <Plus size={16} aria-hidden="true" />
              添加服务亮点
            </button>
          </section>

          <section className="admin-content-section" id="contact-content">
            <header className="admin-content-section-head">
              <div className="admin-section-number">03</div>
              <div>
                <h2>对外联系方式</h2>
                <p>填写需要公开展示的商务渠道，不使用的渠道可以留空。</p>
              </div>
            </header>
            <div className="admin-contact-grid">
              <label className="admin-field">
                <span>商务邮箱</span>
                <div className="admin-input-with-icon">
                  <Mail size={17} aria-hidden="true" />
                  <input
                    type="email"
                    value={editor.contactEmail}
                    onChange={(event) => updateEditor('contactEmail', event.target.value)}
                    placeholder="biz@example.com"
                    aria-invalid={!emailIsValid}
                  />
                </div>
                {!emailIsValid ? (
                  <small className="admin-field-error">请输入正确的邮箱地址。</small>
                ) : null}
              </label>
              <label className="admin-field">
                <span>微信号</span>
                <div className="admin-input-with-icon">
                  <MessageCircle size={17} aria-hidden="true" />
                  <input
                    value={editor.contactWechat}
                    onChange={(event) => updateEditor('contactWechat', event.target.value)}
                    placeholder="请输入对外微信号"
                  />
                </div>
              </label>
              <label className="admin-field">
                <span>联系电话</span>
                <div className="admin-input-with-icon">
                  <Phone size={17} aria-hidden="true" />
                  <input
                    type="tel"
                    value={editor.contactPhone}
                    onChange={(event) => updateEditor('contactPhone', event.target.value)}
                    placeholder="请输入对外联系电话"
                  />
                </div>
              </label>
            </div>
          </section>
        </div>

        <aside className="admin-content-preview" aria-label="首页内容预览">
          <div className="admin-preview-head">
            <div>
              <Monitor size={17} aria-hidden="true" />
              <strong>实时预览</strong>
            </div>
            <span>桌面端</span>
          </div>
          <div className="admin-preview-browser">
            <div className="admin-preview-browser-bar" aria-hidden="true">
              <i />
              <i />
              <i />
              <span>xiaoxiong.team</span>
            </div>
            <div className="admin-preview-hero">
              <span>城市商业活动全案伙伴</span>
              <h3>{editor.homeHeroTitle || '首页大标题'}</h3>
              <p>{editor.homeHeroSubtitle || '首页说明文字会显示在这里。'}</p>
              <button type="button" tabIndex={-1}>
                查看案例
              </button>
            </div>
            <div className="admin-preview-services">
              <small>服务能力</small>
              <div>
                {editor.serviceHighlights.filter((item) => item.trim()).length > 0 ? (
                  editor.serviceHighlights
                    .filter((item) => item.trim())
                    .slice(0, 5)
                    .map((item, index) => (
                      <span key={`${item}-${index}`}>{item}</span>
                    ))
                ) : (
                  <em>添加服务亮点后将在这里预览</em>
                )}
              </div>
            </div>
          </div>
          <p className="admin-preview-note">
            此处用于快速核对文案层级，最终效果以前台页面为准。
          </p>
        </aside>
      </div>

      <div className={`admin-sticky-save ${isDirty ? 'is-visible' : ''}`}>
        <div>
          <span aria-hidden="true" />
          <strong>有未保存的修改</strong>
          <small>离开页面前请先保存</small>
        </div>
        <div>
          <button type="button" className="admin-reset-btn" onClick={restoreSaved}>
            <RotateCcw size={15} aria-hidden="true" />
            恢复
          </button>
          <button
            type="button"
            className="admin-primary-btn"
            onClick={() => void onSave()}
            disabled={!canSave}
          >
            <Save size={16} aria-hidden="true" />
            {saving ? '保存中…' : '保存并更新'}
          </button>
        </div>
      </div>
    </div>
  )
}
