import { useEffect, useState } from 'react'
import { API_BASE_URL } from '../api'
import type { SiteConfig } from '../types'

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null)

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/site-config`)
      .then((res) => res.json())
      .then((data: SiteConfig) => setConfig(data))
      .catch(() => setConfig(null))
  }, [])

  return config
}
