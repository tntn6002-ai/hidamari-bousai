// 端末内（localStorage）に保存する小さなリスト。
// 既存の ChecklistSection / WorkInfoSection と同じ方式に合わせている。
// 注意：この保存先は端末ごと。家族間・機種間では同期されない。

import { useCallback, useEffect, useState } from 'react'

export function useLocalList<T>(key: string, initial: T[] = []): [T[], (next: T[]) => void] {
  const [list, setList] = useState<T[]>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T[]) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(list))
    } catch {
      /* 保存できなくても表示は続ける */
    }
  }, [key, list])

  const update = useCallback((next: T[]) => setList(next), [])
  return [list, update]
}

export function useLocalSet(key: string): [Set<string>, (id: string) => void] {
  const [set, setSet] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(key) || '[]'))
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify([...set]))
    } catch {
      /* 同上 */
    }
  }, [key, set])

  const toggle = useCallback((id: string) => {
    setSet(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  return [set, toggle]
}

export const VIDEO_KEY = 'hidamari-video-links'

export interface VideoLink {
  id: string
  title: string
  url: string
  note: string
}

/** YouTube の動画IDを取り出す。取れなければ null（サムネイルを出さないだけ）。 */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const m = u.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)
      if (m) return m[1]
    }
    return null
  } catch {
    return null
  }
}

export const thumbnailUrl = (videoId: string) => `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
