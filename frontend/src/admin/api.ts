import { API_BASE_URL } from '../api'
import { clearAdminToken, getAdminToken } from './auth'

export class AdminApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ApiValidationIssue = {
  loc?: Array<string | number>
  msg?: string
}

const ERROR_MESSAGE_MAP: Record<string, string> = {
  'slug already exists': '页面地址已被其他案例使用，请在高级设置里换一个地址。',
  'case not found': '没有找到这个案例，可能已被删除，请刷新列表后再试。',
  'lead not found': '没有找到这条合作咨询，可能已被删除，请刷新列表后再试。',
  'merchant signup not found': '没有找到这条商户报名，可能已被删除，请刷新列表后再试。',
  'not authenticated': '登录已过期，请重新登录后再操作。',
  'invalid token': '登录状态无效，请重新登录。',
  forbidden: '当前账号没有权限执行这个操作。',
}

const FIELD_LABELS: Record<string, string> = {
  title: '案例标题',
  slug: '页面地址',
  event_type: '活动类型',
  summary: '案例摘要',
  cover_image_url: '封面图',
  gallery_urls: '现场图集',
  tags: '案例标签',
  seo_title: '搜索标题',
  seo_description: '搜索描述',
  publish_status: '前台展示状态',
  published_at: '发布时间',
  file: '上传文件',
}

const STATUS_MESSAGE_MAP: Record<number, string> = {
  400: '请求内容有误，请检查后重试。',
  401: '登录已过期，请重新登录后再操作。',
  403: '当前账号没有权限执行这个操作。',
  404: '没有找到对应内容，请刷新后再试。',
  409: '内容发生冲突，请检查是否有重复信息。',
  413: '上传文件过大，请压缩后再试。',
  422: '填写内容不完整或格式不正确，请检查后再保存。',
  500: '服务器暂时无法完成操作，请稍后重试。',
}

function translateBackendMessage(message: string) {
  const key = message.trim()
  return ERROR_MESSAGE_MAP[key] || key
}

function getFieldLabel(loc: ApiValidationIssue['loc']) {
  const field = [...(loc || [])]
    .reverse()
    .find((item) => typeof item === 'string' && !['body', 'query', 'path'].includes(item))
  return typeof field === 'string' ? FIELD_LABELS[field] || field : ''
}

function translateValidationMessage(message: string) {
  if (message.includes('Field required')) return '不能为空'
  if (message.includes('Input should be a valid')) return '格式不正确'
  if (message.includes('String should have at least')) return '内容太短'
  if (message.includes('String should have at most')) return '内容太长'
  return translateBackendMessage(message)
}

function formatValidationIssue(issue: ApiValidationIssue) {
  const field = getFieldLabel(issue.loc)
  const message = translateValidationMessage(issue.msg || '填写不正确')
  return field ? `${field}：${message}` : message
}

function formatErrorDetail(detail: unknown) {
  if (typeof detail === 'string') return translateBackendMessage(detail)
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) =>
        typeof item === 'object' && item
          ? formatValidationIssue(item as ApiValidationIssue)
          : '填写内容不正确',
      )
      .filter(Boolean)
    return messages.length > 0 ? messages.join('；') : ''
  }
  if (detail && typeof detail === 'object' && 'msg' in detail) {
    const issue = detail as ApiValidationIssue
    return formatValidationIssue(issue)
  }
  return ''
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { detail?: unknown }
    const detailMessage = formatErrorDetail(data?.detail)
    if (detailMessage) return detailMessage
  } catch {
    // ignore
  }
  return STATUS_MESSAGE_MAP[res.status] || res.statusText || '请求失败，请稍后重试'
}

export async function adminFetch<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const token = getAdminToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init.json !== undefined) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  })

  if (res.status === 401) {
    clearAdminToken()
    throw new AdminApiError(401, translateBackendMessage('not authenticated'))
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res))
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }
  return (await res.text()) as T
}

export async function adminUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getAdminToken()
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (res.status === 401) {
    clearAdminToken()
    throw new AdminApiError(401, translateBackendMessage('not authenticated'))
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res))
  }

  return (await res.json()) as T
}

export async function adminDownload(path: string, filename: string): Promise<void> {
  const token = getAdminToken()
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  if (res.status === 401) {
    clearAdminToken()
    throw new AdminApiError(401, translateBackendMessage('not authenticated'))
  }
  if (!res.ok) {
    throw new AdminApiError(res.status, await parseErrorMessage(res))
  }

  const blob = await res.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
