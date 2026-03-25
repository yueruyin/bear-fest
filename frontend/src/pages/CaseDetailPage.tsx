import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API_BASE_URL } from '../api'
import { Layout } from '../components/Layout'
import type { CaseItem } from '../types'

export function CaseDetailPage() {
  const { slug } = useParams()
  const [detail, setDetail] = useState<CaseItem | null>(null)

  useEffect(() => {
    if (!slug) return
    fetch(`${API_BASE_URL}/api/v1/cases/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CaseItem | null) => setDetail(data))
      .catch(() => setDetail(null))
  }, [slug])

  return (
    <Layout>
      <section className="section">
        <div className="container">
          {!detail ? (
            <p>未找到该案例。</p>
          ) : (
            <>
              <h1>{detail.title}</h1>
              <p>{detail.summary}</p>
              <p className="meta">活动类型：{detail.event_type}</p>
              <p>详情内容可由后台持续补充与更新，当前版本用于联调演示。</p>
              <Link className="btn" to="/contact">
                咨询同类项目
              </Link>
            </>
          )}
        </div>
      </section>
    </Layout>
  )
}
