import { useState } from 'react'
import { Sun, Home, Package, ClipboardList, Bell, Map, UserPlus } from 'lucide-react'
import { InviteModal } from './InviteModal'
import type { TabId } from '../types'

const NAV_ITEMS: { id: TabId; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: 'home',   label: 'ホーム',     Icon: Home },
  { id: 'inv',    label: '在庫',       Icon: Package },
  { id: 'plan',   label: '計画',       Icon: ClipboardList },
  { id: 'alert',  label: 'アラート',   Icon: Bell },
  { id: 'hazard', label: 'ハザード',   Icon: Map },
]

const PAGE_TITLE: Record<TabId, string> = {
  home:   'ホーム',
  inv:    '在庫管理',
  plan:   '備蓄計画',
  alert:  'アラート',
  hazard: 'ハザード確認',
}

interface LayoutProps {
  tab: TabId
  setTab: (t: TabId) => void
  alertCount: number
  saveState: string
  children: React.ReactNode
}

export function Layout({ tab, setTab, alertCount, saveState, children }: LayoutProps) {
  const [showInvite, setShowInvite] = useState(false)
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800">

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 bg-white border-r border-orange-100 flex-col z-20 shadow-sm">
        <div className="px-5 py-5 border-b border-orange-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center shadow-sm shrink-0">
            <Sun size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-sm leading-tight">ひだまり防災ボード</h1>
            <p className="text-[10px] text-stone-400 leading-tight mt-0.5">在宅避難のための見える化</p>
          </div>
        </div>

        <nav className="flex-1 py-3">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors relative ${
                tab === id
                  ? 'text-amber-600 font-bold bg-amber-50 border-r-2 border-amber-400'
                  : 'text-stone-500 hover:bg-orange-50 hover:text-stone-700'
              }`}
            >
              <div className="relative">
                <Icon size={18} strokeWidth={tab === id ? 2.4 : 1.8} />
                {id === 'alert' && alertCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </div>
              <span>{label}</span>
              {id === 'alert' && alertCount > 0 && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">
                  {alertCount}
                </span>
              )}
            </button>
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
            ※ハザード表示は公的データの再表示。最終確認は各自治体の公式資料で。
          </p>
          {saveState && (
            <p className="text-[10px] mt-1 text-stone-400 tabular-nums">
              {saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '保存済み ✓' : '保存エラー'}
            </p>
          )}
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="lg:pl-56 flex flex-col min-h-screen">

        {/* Mobile/tablet header */}
        <header className="lg:hidden sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-orange-100">
          <div className="px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
                <Sun size={16} className="text-white" />
              </div>
              <h1 className="font-bold text-base leading-tight">ひだまり防災ボード</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 tabular-nums">
                {saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '保存済み ✓' : saveState === 'error' ? '保存エラー' : ''}
              </span>
              <button onClick={() => setShowInvite(true)} className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-orange-50">
                <UserPlus size={18} />
              </button>
            </div>
          </div>
        </header>

        {/* Desktop page header */}
        <header className="hidden lg:flex sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-orange-100 px-8 py-4 items-center justify-between">
          <h2 className="font-bold text-xl">{PAGE_TITLE[tab]}</h2>
          <span className="text-xs text-stone-400 tabular-nums">
            {saveState === 'saving' ? '保存中…' : saveState === 'saved' ? '保存済み ✓' : saveState === 'error' ? '保存エラー' : ''}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {/* ── Mobile/tablet bottom nav ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-orange-100 safe-area-inset-bottom">
        <div className="grid grid-cols-5 max-w-2xl mx-auto">
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative py-2.5 flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
                tab === id ? 'text-amber-600 font-bold' : 'text-stone-400'
              }`}
            >
              <Icon size={20} strokeWidth={tab === id ? 2.4 : 1.8} />
              {label}
              {id === 'alert' && alertCount > 0 && (
                <span className="absolute top-1.5 left-1/2 ml-2 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
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
