import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { InviteModal } from './InviteModal'
import { SubTabs } from './SubTabs'
import { NAV_GROUPS, PAGE_TITLE, firstTabOf, groupOf } from '../lib/nav'
import type { TabId } from '../types'

interface LayoutProps {
  tab: TabId
  setTab: (t: TabId) => void
  alertCount: number
  saveState: string
  children: React.ReactNode
}

/** アラート件数を出すのは「そなえる」グループ（中身は不足・期限） */
const BADGE_GROUP = 'prep'

export function Layout({ tab, setTab, alertCount, saveState, children }: LayoutProps) {
  const [showInvite, setShowInvite] = useState(false)
  const group = groupOf(tab)

  const saveLabel =
    saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '保存済み ✓' : saveState === 'error' ? '保存エラー' : ''

  return (
    <div className="min-h-screen bg-[#FBF0DA] text-stone-800">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 bg-white border-r border-orange-100 flex-col z-20 shadow-sm">
        <div className="px-5 py-5 border-b border-orange-100 flex items-center gap-3">
          <img src="/pwa-192x192.png" alt="ひだまりの防災" className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight">ひだまり防災ボード</h1>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">在宅避難のための見える化</p>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV_GROUPS.map(g => (
            <div key={g.id} className="mb-1">
              <button
                onClick={() => setTab(firstTabOf(g.id))}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  group === g.id
                    ? 'text-amber-600 font-bold bg-amber-50 border-r-2 border-amber-400'
                    : 'text-stone-500 hover:bg-orange-50 hover:text-stone-700'
                }`}
              >
                <g.Icon size={18} strokeWidth={group === g.id ? 2.4 : 1.8} />
                <span>{g.label}</span>
                {g.id === BADGE_GROUP && alertCount > 0 && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
                    {alertCount}
                  </span>
                )}
              </button>

              {/* 展開中グループの中のページ */}
              {group === g.id && g.tabs.length > 1 && (
                <div className="pb-1">
                  {g.tabs.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`w-full text-left pl-14 pr-5 py-1.5 text-xs transition-colors ${
                        tab === t.id ? 'text-amber-600 font-bold' : 'text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      {t.label}
                      {t.id === 'alert' && alertCount > 0 && (
                        <span className="ml-1.5 text-red-500 font-bold">{alertCount}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-orange-100">
          <button
            onClick={() => setShowInvite(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-stone-500 hover:bg-orange-50 hover:text-amber-600 transition-colors mb-2"
          >
            <UserPlus size={15} /> 招待する
          </button>
          <p className="text-[10px] text-stone-400 leading-relaxed">
            ※ハザード・避難所の表示は公的データの再表示。最終確認は各自治体の公式資料で。
          </p>
          {saveLabel && <p className="text-[10px] mt-1 text-stone-400 tabular-nums">{saveLabel}</p>}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="lg:pl-56 flex flex-col min-h-screen">

        {/* Mobile/tablet header */}
        <header className="lg:hidden sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-orange-100">
          <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <img src="/pwa-192x192.png" alt="ひだまりの防災" className="w-8 h-8" />
              <h1 className="font-bold text-base leading-tight">ひだまり防災ボード</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 tabular-nums">{saveLabel}</span>
              <button onClick={() => setShowInvite(true)} className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-orange-50">
                <UserPlus size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Desktop page header */}
        <header className="hidden lg:flex sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-orange-100 px-8 py-4 items-center justify-between">
          <h2 className="font-bold text-xl">{PAGE_TITLE[tab]}</h2>
          <span className="text-xs text-stone-400 tabular-nums">{saveLabel}</span>
        </header>

        {/* グループ内のページ切り替え（モバイル中心。デスクトップはサイドにも出る） */}
        <div className="lg:hidden">
          <SubTabs group={group} tab={tab} setTab={setTab} alertCount={alertCount} />
        </div>

        {/* Page content */}
        <main className="flex-1 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* ── Mobile/tablet bottom nav（5グループ）── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-orange-100 safe-area-inset-bottom">
        <div className="grid grid-cols-5 max-w-2xl mx-auto">
          {NAV_GROUPS.map(g => (
            <button
              key={g.id}
              onClick={() => setTab(firstTabOf(g.id))}
              className={`relative py-2.5 flex flex-col items-center gap-0.5 text-[11px] transition-colors ${
                group === g.id ? 'text-amber-600 font-bold' : 'text-stone-400'
              }`}
            >
              <g.Icon size={21} strokeWidth={group === g.id ? 2.4 : 1.8} />
              {g.label}
              {g.id === BADGE_GROUP && alertCount > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-3 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

    </div>
  )
}
