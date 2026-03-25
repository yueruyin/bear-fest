import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../api'
import type { CaseItem } from '../types'

export function useCases(type = '') {
  const [items, setItems] = useState<CaseItem[]>([])

  useEffect(() => {
    const query = type ? `?event_type=${encodeURIComponent(type)}` : ''
    fetch(`${API_BASE_URL}/api/v1/cases${query}`)
      .then((res) => res.json())
      .then((data: CaseItem[]) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
  }, [type])

  return items
}
