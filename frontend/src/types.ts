export type SiteConfig = {
  id: number
  home_hero_title: string
  home_hero_subtitle: string
  service_highlights: string
  contact_channels: string
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
  seo_title?: string
  seo_description?: string
}

export type LeadForm = {
  name: string
  company: string
  phone_or_email: string
  demand_desc: string
}
