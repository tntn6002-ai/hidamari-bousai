import { Home, Package, Map, Siren, MoreHorizontal } from 'lucide-react'
import type { GroupId, TabId } from '../types'

export interface NavGroup {
  id: GroupId
  label: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  tabs: { id: TabId; label: string }[]
}

/** 下タブ（モバイル）とサイドバー（デスクトップ）で共有する5グループ。 */
export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'home',
    label: 'ホーム',
    Icon: Home,
    tabs: [{ id: 'home', label: 'ホーム' }],
  },
  {
    id: 'prep',
    label: 'そなえる',
    Icon: Package,
    tabs: [
      { id: 'inv', label: '在庫' },
      { id: 'plan', label: '計画' },
      { id: 'alert', label: '不足・期限' },
      { id: 'gear', label: '持ち物リスト' },
    ],
  },
  {
    id: 'learn',
    label: 'しらべる',
    Icon: Map,
    tabs: [
      { id: 'hazard', label: 'ハザード' },
      { id: 'shelter', label: '避難所' },
    ],
  },
  {
    id: 'act',
    label: 'そのとき',
    Icon: Siren,
    tabs: [
      { id: 'firstaid', label: '初動手順' },
      { id: 'commute', label: '職場・帰宅' },
    ],
  },
  {
    id: 'more',
    label: 'もっと',
    Icon: MoreHorizontal,
    tabs: [
      { id: 'game', label: 'チャレンジ' },
      { id: 'video', label: '動画リンク' },
    ],
  },
]

export const groupOf = (tab: TabId): GroupId =>
  NAV_GROUPS.find(g => g.tabs.some(t => t.id === tab))?.id ?? 'home'

export const firstTabOf = (group: GroupId): TabId =>
  NAV_GROUPS.find(g => g.id === group)!.tabs[0].id

export const PAGE_TITLE: Record<TabId, string> = {
  home: 'ホーム',
  inv: '在庫管理',
  plan: '備蓄計画',
  alert: '不足・期限',
  gear: '持ち物リスト',
  hazard: 'ハザード確認',
  shelter: '避難所を探す',
  firstaid: '発災直後の初動',
  commute: '職場・帰宅',
  game: 'チャレンジ',
  video: '動画リンク',
}
