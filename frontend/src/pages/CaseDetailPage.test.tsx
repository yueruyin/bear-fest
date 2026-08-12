import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CaseItem } from '../types'
import { CaseDetailPage } from './CaseDetailPage'

const BASE_CASE: CaseItem = {
  id: 1,
  title: '普通赛事案例',
  slug: 'normal-sports',
  event_type: 'sports',
  summary: '这是当前赛事自己的摘要。',
  cover_image_url: '/uploads/cases/cover.jpg',
  publish_status: 'published',
  published_at: '2026-08-01T00:00:00Z',
  tags: '["赛事","现场运营"]',
  gallery_urls: '["/uploads/cases/first.jpg","/uploads/cases/second.jpg"]',
  project_background: '这是当前赛事自己保存的项目背景。',
  project_goals: '这是当前赛事自己保存的项目目标。',
  execution_highlights:
    '[{"title":"独立执行亮点","description":"这段内容只属于当前赛事案例。"}]',
  result_metrics:
    '[{"label":"服务点位","value":"8个","description":"来自当前案例"}]',
  result_summary: '这是当前赛事自己的成果总结。',
}

function mockResponse(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/cases/normal-sports']}>
      <Routes>
        <Route path="/cases/:slug" element={<CaseDetailPage />} />
        <Route path="/cases" element={<div>案例列表</div>} />
        <Route path="/contact" element={<div>联系页</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('CaseDetailPage', () => {
  it('renders a sports case only from its saved content', async () => {
    mockResponse(200, BASE_CASE)
    renderPage()

    expect(await screen.findByRole('heading', { name: '普通赛事案例' })).toBeInTheDocument()
    expect(screen.getByText('活动类型：赛事活动')).toBeInTheDocument()
    expect(screen.getByText('发布时间：2026年8月1日')).toBeInTheDocument()
    expect(screen.getByText('独立执行亮点')).toBeInTheDocument()
    expect(screen.getByText('8个')).toBeInTheDocument()
    expect(screen.queryByText('¥955,287')).not.toBeInTheDocument()
    expect(screen.queryByText('渠道表现分析')).not.toBeInTheDocument()
  })

  it('hides optional modules and preserves the full gallery order', async () => {
    mockResponse(200, {
      ...BASE_CASE,
      title: '普通非 WTT 赛事',
      project_background: null,
      project_goals: null,
      execution_highlights: '[]',
      result_metrics: '[]',
      result_summary: null,
    })
    renderPage()

    expect(await screen.findByRole('heading', { name: '普通非 WTT 赛事' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '项目背景' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '执行亮点' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '成果数据' })).not.toBeInTheDocument()
    const gallery = screen.getByRole('heading', { name: '现场图集' }).closest('section')
    expect(gallery).not.toBeNull()
    const images = within(gallery as HTMLElement).getAllByRole('img')
    expect(images).toHaveLength(2)
    expect(images[0].getAttribute('src')).toContain('/uploads/cases/first.jpg')
    expect(images[1].getAttribute('src')).toContain('/uploads/cases/second.jpg')
  })

  it('renders a non-sports case with the same data-driven structure', async () => {
    mockResponse(200, {
      ...BASE_CASE,
      title: '城市集市案例',
      event_type: 'market',
      execution_highlights:
        '[{"title":"商户协同","description":"协调本案例商户完成现场运营工作。"}]',
      result_metrics: '[]',
    })
    renderPage()

    expect(await screen.findByRole('heading', { name: '城市集市案例' })).toBeInTheDocument()
    expect(screen.getByText('活动类型：潮流集市')).toBeInTheDocument()
    expect(screen.getByText('商户协同')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '成果数据' })).not.toBeInTheDocument()
  })

  it('distinguishes not found, request failure, and malformed historical content', async () => {
    mockResponse(404, { detail: 'case not found' })
    const notFoundRender = renderPage()
    expect(await screen.findByRole('heading', { name: '未找到该案例' })).toBeInTheDocument()
    notFoundRender.unmount()

    mockResponse(500, { detail: 'server error' })
    const errorRender = renderPage()
    expect(await screen.findByRole('heading', { name: '案例加载失败' })).toBeInTheDocument()
    errorRender.unmount()

    mockResponse(200, { ...BASE_CASE, execution_highlights: '{bad-json' })
    renderPage()
    expect(await screen.findByText('该案例的部分历史内容暂时无法展示。')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '普通赛事案例' })).toBeInTheDocument()
  })
})
