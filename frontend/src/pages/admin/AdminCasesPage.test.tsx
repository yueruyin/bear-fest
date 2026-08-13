import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminCasesPage } from './AdminCasesPage'

const HISTORICAL_ITEM = {
  id: 7,
  title: '历史最小案例',
  slug: 'historical-minimal',
  event_type: 'market',
  summary: '历史案例只保留经过确认的基础内容。',
  cover_image_url: '/uploads/cases/history.jpg',
  publish_status: 'published',
  published_at: '2026-08-01T09:00:00',
  created_at: '2026-08-01T09:00:00',
  updated_at: '2026-08-01T09:00:00',
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AdminCasesPage', () => {
  it('saves basic changes to a published historical minimal case', async () => {
    let updateBody: Record<string, unknown> | null = null
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input)
        if (url.includes('/api/admin/cases/stats')) {
          return jsonResponse({ total: 1, published: 1, draft: 0, updated_today: 0 })
        }
        if (url.includes('/api/admin/cases?')) {
          return jsonResponse([HISTORICAL_ITEM])
        }
        if (url.endsWith('/api/admin/cases/7') && init?.method === 'PUT') {
          updateBody = JSON.parse(String(init.body)) as Record<string, unknown>
          return jsonResponse({ ...HISTORICAL_ITEM, title: updateBody.title })
        }
        if (url.endsWith('/api/admin/cases/7')) {
          return jsonResponse({
            ...HISTORICAL_ITEM,
            gallery_urls: '[]',
            project_background: null,
            project_goals: null,
            execution_highlights: null,
            result_metrics: null,
            result_summary: null,
            tags: '[]',
            seo_title: '',
            seo_description: '',
          })
        }
        throw new Error(`Unexpected request: ${url}`)
      }),
    )

    render(<AdminCasesPage />)
    fireEvent.click(await screen.findByRole('button', { name: /历史最小案例/ }))
    const titleInput = await screen.findByDisplayValue('历史最小案例')
    fireEvent.change(titleInput, { target: { value: '历史最小案例（已更新）' } })
    fireEvent.click(screen.getByRole('button', { name: '保存修改' }))

    await waitFor(() => expect(updateBody).not.toBeNull())
    expect(updateBody).toMatchObject({
      title: '历史最小案例（已更新）',
      project_background: null,
      project_goals: null,
      execution_highlights: '[]',
      result_metrics: '[]',
      result_summary: null,
      publish_status: 'published',
    })
    expect(
      await screen.findAllByText('案例已保存并发布，前台刷新后即可看到。'),
    ).toHaveLength(2)
  })
})
