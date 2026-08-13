export type SiteConfig = {
  id: number
  home_hero_title: string
  home_hero_subtitle: string
  service_highlights: string
  contact_channels: string
}

export const CASE_EVENT_TYPE_LABELS = {
  sports: '赛事活动',
  carnival: '城市嘉年华',
  market: '潮流集市',
  annual: '企业年会',
  brand: '品牌活动',
} as const

export type CaseEventType = keyof typeof CASE_EVENT_TYPE_LABELS

export const CASE_EVENT_TYPES = Object.keys(CASE_EVENT_TYPE_LABELS) as CaseEventType[]

export const CASE_PUBLISH_STATUSES = ['draft', 'published'] as const

export type CasePublishStatus = (typeof CASE_PUBLISH_STATUSES)[number]

export function isCaseEventType(value: string): value is CaseEventType {
  return value in CASE_EVENT_TYPE_LABELS
}

export function isCasePublishStatus(value: string): value is CasePublishStatus {
  return CASE_PUBLISH_STATUSES.includes(value as CasePublishStatus)
}

export type CaseItem = {
  id: number
  title: string
  slug: string
  event_type: string
  summary: string
  cover_image_url: string
  publish_status: string
  published_at: string | null
  tags: string
  gallery_urls?: string
  project_background?: string | null
  project_goals?: string | null
  execution_highlights?: string | null
  result_metrics?: string | null
  result_summary?: string | null
  seo_title?: string
  seo_description?: string
}

export type ExecutionHighlight = {
  title: string
  description: string
}

export type ResultMetric = {
  label: string
  value: string
  description?: string | null
}

export type LeadForm = {
  name: string
  company: string
  phone_or_email: string
  demand_desc: string
}

export type MerchantSignupForm = {
  contact_name: string
  brand_name: string
  phone_or_email: string
  business_details: string
}
