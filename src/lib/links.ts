import { supabase } from './supabase'

export interface CuratedLink {
  id: string
  kind: 'video' | 'link'
  title: string
  url: string
  note: string
  sortOrder: number
  published: boolean
}

export interface UserLink {
  id: string
  title: string
  url: string
  note: string
}

export type CuratedDraft = Omit<CuratedLink, 'id'>
export type UserDraft = Omit<UserLink, 'id'>

// ── YouTube ────────────────────────────────────────────────

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

// ── ベースデータ（curated_links）────────────────────────────

function toCurated(row: Record<string, unknown>): CuratedLink {
  return {
    id: row.id as string,
    kind: (row.kind as 'video' | 'link') || 'video',
    title: (row.title as string) || '',
    url: (row.url as string) || '',
    note: (row.note as string) || '',
    sortOrder: (row.sort_order as number) ?? 0,
    published: (row.published as boolean) ?? true,
  }
}

export async function fetchCurated(): Promise<CuratedLink[]> {
  const { data, error } = await supabase
    .from('curated_links')
    .select('*')
    .order('sort_order')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(toCurated)
}

export async function insertCurated(draft: CuratedDraft): Promise<CuratedLink> {
  const { data, error } = await supabase
    .from('curated_links')
    .insert({
      kind: draft.kind,
      title: draft.title,
      url: draft.url,
      note: draft.note,
      sort_order: draft.sortOrder,
      published: draft.published,
    })
    .select()
    .single()
  if (error || !data) throw error ?? new Error('追加に失敗しました')
  return toCurated(data)
}

export async function patchCurated(id: string, patch: Partial<CuratedDraft>): Promise<void> {
  const row: Record<string, unknown> = {}
  if (patch.kind !== undefined) row.kind = patch.kind
  if (patch.title !== undefined) row.title = patch.title
  if (patch.url !== undefined) row.url = patch.url
  if (patch.note !== undefined) row.note = patch.note
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder
  if (patch.published !== undefined) row.published = patch.published
  const { error } = await supabase.from('curated_links').update(row).eq('id', id)
  if (error) throw error
}

export async function removeCurated(id: string): Promise<void> {
  const { error } = await supabase.from('curated_links').delete().eq('id', id)
  if (error) throw error
}

// ── 個人のリンク（user_links）──────────────────────────────

function toUserLink(row: Record<string, unknown>): UserLink {
  return {
    id: row.id as string,
    title: (row.title as string) || '',
    url: (row.url as string) || '',
    note: (row.note as string) || '',
  }
}

export async function fetchUserLinks(): Promise<UserLink[]> {
  const { data, error } = await supabase
    .from('user_links')
    .select('*')
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(toUserLink)
}

export async function insertUserLink(draft: UserDraft): Promise<UserLink> {
  const { data, error } = await supabase
    .from('user_links')
    .insert({ title: draft.title, url: draft.url, note: draft.note })
    .select()
    .single()
  if (error || !data) throw error ?? new Error('追加に失敗しました')
  return toUserLink(data)
}

export async function removeUserLink(id: string): Promise<void> {
  const { error } = await supabase.from('user_links').delete().eq('id', id)
  if (error) throw error
}

// ── 編集者かどうか ──────────────────────────────────────────

/** 自分が編集者かを確認する。RLS上、他人の行は見えないので自分の分だけが返る。 */
export async function fetchIsCurator(): Promise<boolean> {
  const { data, error } = await supabase.from('curators').select('user_id').limit(1)
  if (error) return false
  return (data ?? []).length > 0
}
