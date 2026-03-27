import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { useCases } from '../hooks/useCases'

export function CasesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialType = searchParams.get('type') || searchParams.get('event_type') || ''
  const [type, setType] = useState(initialType)
  const cases = useCases(type)

  return (
    <Layout>
      <section className="section">
        <div className="container">
          <h1>项目案例</h1>
          <div className="filters">
            {[
              ['', '全部'],
              ['sports', '赛事'],
              ['carnival', '嘉年华'],
              ['market', '潮流集市'],
              ['annual', '企业年会'],
              ['brand', '品牌活动'],
            ].map(([value, label]) => (
              <button
                key={value || 'all'}
                className={`chip ${type === value ? 'active' : ''}`}
                onClick={() => {
                  setType(value)
                  if (!value) {
                    setSearchParams({})
                    return
                  }
                  setSearchParams({ type: value })
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="card-grid">
            {cases.map((c) => (
              <Link key={c.id} to={`/cases/${c.slug}`} className="card card-link">
                <h3>{c.title}</h3>
                <p>{c.summary}</p>
                <span className="tag">{c.event_type}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  )
}
