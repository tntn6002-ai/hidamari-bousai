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
  const allReady = bases.length > 0 && items.length > 0 && bases.every(b => baseSummary(items, b).pct >= 1)

  return (
    <div className="px-4 lg:px-8 py-5 max-w-5xl mx-auto space-y-5">
      <p className="text-sm text-stone-500 leading-relaxed">
        合言葉は
        <span className="font-semibold text-stone-700">「いま何日ぶん備えられているか」</span>。
        リングが目標日数に届けば、その家は在宅避難の準備完了です。
      </p>

      {allReady && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-emerald-800 text-sm font-bold">
          🎉 すべての家が準備OK！この調子で続けましょう。
        </div>
      )}

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
                  <span className="text-xs text-stone-500">{b.tag}</span>
                  {s.pct >= 1 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">準備OK</span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mb-2">
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

      <p className="text-xs text-stone-500 leading-relaxed">
        計算根拠：大人1人1日＝水3L・3食・トイレ5回、カセットボンベ約6本/週（2人）、犬1匹1日＝水0.5L・フード1日分・シーツ3枚（目安）。リングは水・主食・トイレのうち最少の日数。
      </p>

      {items.length === 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 space-y-4">
          <div className="text-center">
            <Sun size={28} className="mx-auto text-amber-400 mb-2" />
            <p className="text-sm font-bold text-amber-800">ようこそ！まずは備蓄を1つ登録しましょう</p>
          </div>
          <ol className="text-xs text-amber-800 space-y-1.5">
            <li><span className="font-bold">1.</span>「在庫」タブで水や食料を登録</li>
            <li><span className="font-bold">2.</span>「ホーム」で“あと何日分”を確認</li>
            <li><span className="font-bold">3.</span>「アラート」で不足・期限をチェック</li>
          </ol>
          <button
            onClick={() => setTab('inv')}
            className="w-full py-2.5 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors"
          >
            まず水を1本 登録する
          </button>
        </div>
      )}
    </div>
  )
}
