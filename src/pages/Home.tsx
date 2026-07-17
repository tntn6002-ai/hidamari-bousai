import { Sun } from 'lucide-react'
import { Ring } from '../components/Ring'
import { MiniBar } from '../components/MiniBar'
import { REQ, REQ_KEYS } from '../lib/constants'
import { baseSummary, dailyNeed, stockOf, requiredQty, daysUntil } from '../lib/calculations'
import type { Base, Item, TabId } from '../types'

interface HomeProps {
  bases: Base[]
  items: Item[]
  setTab: (t: TabId) => void
}

export function Home({ bases, items, setTab }: HomeProps) {
  const expiryAlertCount = items.filter(it => {
    const d = daysUntil(it.expiry)
    return d !== null && d <= 30
  }).length

  const shortageCount = bases.reduce((acc, b) => {
    return acc + REQ_KEYS.filter(k => {
      const need = requiredQty(b, k)
      return need > 0 && stockOf(items, b.id, k) < need
    }).length
  }, 0)

  const totalAlerts = expiryAlertCount + shortageCount

  return (
    <div className="px-4 lg:px-8 py-5 max-w-5xl mx-auto space-y-5">
      <p className="text-sm text-stone-500 leading-relaxed">
        合言葉は
        <span className="font-semibold text-stone-700">「いま何日ぶん備えられているか」</span>。
        リングが目標日数に届けば、その家は在宅避難の準備完了です。
      </p>

      {totalAlerts > 0 && (
        <button
          onClick={() => setTab('alert')}
          className="w-full text-left px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-semibold flex items-center justify-between hover:bg-red-100 transition-colors"
        >
          <span>要対応が {totalAlerts} 件あります</span>
          <span className="text-xs">アラートを確認 →</span>
        </button>
      )}

      {/* Base cards grid: 1col→2col(md)→2col(lg) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bases.map(b => {
          const s = baseSummary(items, b)
          const baseAlerts =
            REQ_KEYS.filter(k => {
              const need = requiredQty(b, k)
              return need > 0 && stockOf(items, b.id, k) < need
            }).length +
            items.filter(it => it.baseId === b.id && (() => { const d = daysUntil(it.expiry); return d !== null && d <= 30 })()).length

          return (
            <section
              key={b.id}
              className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 flex gap-4 items-center hover:shadow-md transition-shadow"
            >
              <Ring pct={s.pct} size={96} stroke={9}>
                <span className="text-xl font-bold tabular-nums leading-none">
                  {s.minDays >= 99 ? '99+' : Math.floor(s.minDays * 10) / 10}
                </span>
                <span className="text-[10px] text-stone-400">日分</span>
              </Ring>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                  <h2 className="font-bold text-base">{b.name}</h2>
                  <span className="text-[11px] text-stone-400">{b.tag}</span>
                </div>
                <p className="text-[11px] text-stone-400 mb-2">
                  目標 {b.days}日 ・ 大人{b.adults}
                  {b.dogs > 0 ? ` ・ 犬${b.dogs}` : ''}
                  {baseAlerts > 0 && (
                    <span className="ml-2 text-red-500 font-semibold">要対応 {baseAlerts}件</span>
                  )}
                </p>
                <div className="space-y-1.5">
                  {REQ_KEYS.filter(k => REQ[k].core && dailyNeed(b, k) > 0).map(k => (
                    <MiniBar
                      key={k}
                      label={REQ[k].label}
                      have={stockOf(items, b.id, k)}
                      need={requiredQty(b, k)}
                      unit={REQ[k].unit}
                    />
                  ))}
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <p className="text-[11px] text-stone-400 leading-relaxed">
        計算根拠：大人1人1日＝水3L・3食・トイレ5回、カセットボンベ約6本/週（2人）、犬1匹1日＝水0.5L・フード1日分・シーツ3枚（目安）。リングは水・主食・トイレのうち最少の日数。
      </p>

      {items.length === 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 text-center">
          <Sun size={28} className="mx-auto text-amber-400 mb-2" />
          <p className="text-sm font-semibold text-amber-800">在庫がまだ登録されていません</p>
          <p className="text-xs text-amber-600 mt-1">「在庫」タブから備蓄品を追加してみましょう</p>
          <button
            onClick={() => setTab('inv')}
            className="mt-3 px-5 py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors"
          >
            在庫を追加する
          </button>
        </div>
      )}
    </div>
  )
}
