import { Sun, RotateCcw, ExternalLink } from 'lucide-react'
import { REQ, REQ_KEYS } from '../lib/constants'
import { daysUntil, requiredQty, stockOf, amazonSearch } from '../lib/calculations'
import type { Base, Item, ItemDraft, ReqKey } from '../types'

interface AlertsProps {
  bases: Base[]
  items: Item[]
  openAdd: (preset?: Partial<ItemDraft>) => void
  onReset: () => void
}

export function Alerts({ bases, items, openAdd, onReset }: AlertsProps) {
  const baseName = (id: string) => bases.find(b => b.id === id)?.name || '?'

  const expiryAlerts = items
    .map(it => ({ it, d: daysUntil(it.expiry) }))
    .filter(x => x.d !== null && x.d <= 30)
    .sort((a, b) => (a.d ?? 0) - (b.d ?? 0))

  const shortageAlerts: { base: Base; key: ReqKey; have: number; need: number }[] = []
  bases.forEach(b => {
    REQ_KEYS.forEach(k => {
      const need = requiredQty(b, k as ReqKey)
      if (need <= 0) return
      const have = stockOf(items, b.id, k as ReqKey)
      if (have < need) shortageAlerts.push({ base: b, key: k as ReqKey, have, need })
    })
  })

  const alertCount = expiryAlerts.length + shortageAlerts.length

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-5">

      {alertCount === 0 && (
        <div className="bg-white rounded-2xl border border-orange-100 p-10 text-center">
          <Sun size={36} className="mx-auto text-amber-400 mb-3" />
          <p className="text-base font-semibold">今日の備えは晴れです</p>
          <p className="text-xs text-stone-400 mt-1">期限間近・目標不足はありません。</p>
        </div>
      )}

      {expiryAlerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            そろそろ食べごろ（期限30日以内）
          </h2>
          {expiryAlerts.map(({ it, d }) => {
            const amazonHref = it.url
              || (it.reqKey !== 'other' ? amazonSearch(REQ[it.reqKey as ReqKey].q) : amazonSearch(it.name))
            return (
              <div
                key={it.id}
                className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{it.name}</p>
                  <p className="text-[11px] text-stone-400">
                    {baseName(it.baseId)} ・{' '}
                    {(d ?? 0) < 0
                      ? <span className="text-red-500 font-semibold">期限切れ（{-(d ?? 0)}日前）</span>
                      : `あと${d}日（${it.expiry}）`
                    }
                  </p>
                </div>
                <a
                  href={amazonHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-[11px] px-3 py-2 rounded-xl bg-amber-400 text-white font-bold flex items-center gap-1 hover:bg-amber-500 transition-colors"
                >
                  <ExternalLink size={12} /> 買い足す
                </a>
              </div>
            )
          })}
          <p className="text-[11px] text-stone-400 px-1">
            食べたら在庫タブで「−」を。ローリングストックの回し時です。
          </p>
        </section>
      )}

      {shortageAlerts.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            目標に足りていないもの
          </h2>
          {shortageAlerts.map((a, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{a.base.name}：{REQ[a.key].label}</p>
                <p className="text-[11px] text-stone-400 tabular-nums">
                  あと {a.need - a.have}{REQ[a.key].unit}（{a.have}/{a.need}）
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={amazonSearch(REQ[a.key].q)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-amber-700 font-bold flex items-center gap-1 hover:bg-orange-100 transition-colors"
                >
                  <ExternalLink size={12} /> Amazon
                </a>
                <button
                  onClick={() => openAdd({ baseId: a.base.id, reqKey: a.key, name: REQ[a.key].label, qty: a.need - a.have })}
                  className="text-[11px] px-3 py-2 rounded-xl bg-amber-400 text-white font-bold flex items-center gap-1 hover:bg-amber-500 transition-colors"
                >
                  登録
                </button>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="pt-2 border-t border-orange-100">
        <p className="text-[11px] text-stone-400 mb-3 leading-relaxed">
          ※ハザード表示は公的オープンデータの再表示であり、最終確認は各自治体の公式資料で。備蓄係数は公的ガイド由来の目安。
        </p>
        <button
          onClick={onReset}
          className="w-full py-2 text-[11px] text-stone-400 flex items-center justify-center gap-1 hover:text-stone-600 transition-colors"
        >
          <RotateCcw size={11} /> データを初期化する
        </button>
      </div>
    </div>
  )
}
