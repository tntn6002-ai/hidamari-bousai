import { NAV_GROUPS } from '../lib/nav'
import type { GroupId, TabId } from '../types'

interface SubTabsProps {
  group: GroupId
  tab: TabId
  setTab: (t: TabId) => void
  alertCount: number
}

/** グループ内のページ切り替え。タブが1つだけのグループでは何も出さない。 */
export function SubTabs({ group, tab, setTab, alertCount }: SubTabsProps) {
  const g = NAV_GROUPS.find(x => x.id === group)
  if (!g || g.tabs.length < 2) return null

  return (
    <div className="sticky top-[57px] lg:top-[65px] z-[5] bg-[#FBF0DA]/95 backdrop-blur-sm border-b border-orange-100">
      <div className="flex gap-2 overflow-x-auto px-4 lg:px-8 py-2.5 max-w-5xl mx-auto">
        {g.tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap border shrink-0 transition-colors flex items-center gap-1.5 ${
              tab === t.id
                ? 'bg-amber-400 border-amber-400 text-white font-bold'
                : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
            }`}
          >
            {t.label}
            {t.id === 'alert' && alertCount > 0 && (
              <span
                className={`min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center ${
                  tab === t.id ? 'bg-white text-amber-600' : 'bg-red-500 text-white'
                }`}
              >
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
