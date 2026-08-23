import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  fetchCurated, fetchUserLinks, fetchIsCurator,
  insertCurated, patchCurated, removeCurated,
  insertUserLink, removeUserLink,
  type CuratedLink, type CuratedDraft, type UserLink, type UserDraft,
} from '../lib/links'

interface LinksValue {
  curated: CuratedLink[]
  mine: UserLink[]
  isCurator: boolean
  loading: boolean
  error: string
  addCurated: (draft: CuratedDraft) => Promise<void>
  editCurated: (id: string, patch: Partial<CuratedDraft>) => Promise<void>
  deleteCurated: (id: string) => Promise<void>
  addMine: (draft: UserDraft) => Promise<void>
  deleteMine: (id: string) => Promise<void>
}

export const LinksContext = createContext<LinksValue | null>(null)
export type { LinksValue }

export function LinksProvider({ children }: { children: React.ReactNode }) {
  const [curated, setCurated] = useState<CuratedLink[]>([])
  const [mine, setMine] = useState<UserLink[]>([])
  const [isCurator, setIsCurator] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    // 片方のテーブルだけ落ちても、取れたほうは表示する。
    // マイグレーション未実行でもアプリ全体は動くようにしておく。
    Promise.allSettled([fetchCurated(), fetchUserLinks(), fetchIsCurator()])
      .then(([c, m, cur]) => {
        if (cancelled) return
        if (c.status === 'fulfilled') setCurated(c.value)
        if (m.status === 'fulfilled') setMine(m.value)
        if (cur.status === 'fulfilled') setIsCurator(cur.value)
        if (c.status === 'rejected' || m.status === 'rejected') {
          setError('リンクを読み込めませんでした')
        }
      })
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [])

  const addCurated = useCallback(async (draft: CuratedDraft) => {
    const created = await insertCurated(draft)
    setCurated(prev => [...prev, created])
  }, [])

  const editCurated = useCallback(async (id: string, patch: Partial<CuratedDraft>) => {
    await patchCurated(id, patch)
    setCurated(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const deleteCurated = useCallback(async (id: string) => {
    await removeCurated(id)
    setCurated(prev => prev.filter(c => c.id !== id))
  }, [])

  const addMine = useCallback(async (draft: UserDraft) => {
    const created = await insertUserLink(draft)
    setMine(prev => [...prev, created])
  }, [])

  const deleteMine = useCallback(async (id: string) => {
    await removeUserLink(id)
    setMine(prev => prev.filter(l => l.id !== id))
  }, [])

  return (
    <LinksContext.Provider
      value={{ curated, mine, isCurator, loading, error, addCurated, editCurated, deleteCurated, addMine, deleteMine }}
    >
      {children}
    </LinksContext.Provider>
  )
}

export function useLinks(): LinksValue {
  const ctx = useContext(LinksContext)
  if (!ctx) throw new Error('useLinks must be used within LinksProvider')
  return ctx
}
