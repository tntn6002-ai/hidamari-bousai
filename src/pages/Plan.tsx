import { Plus, Minus, Check, ExternalLink } from 'lucide-react'
import { REQ, REQ_KEYS, REQ_GROUPS } from '../lib/constants'
import { dailyNeed, requiredQty, stockOf, amazonSearch } from '../lib/calculations'
import { ChecklistSection } from '../components/ChecklistSection'
import type { Base, Item, ItemDraft, ReqKey } from '../types'

interface PlanProps {
  bases: Base[]
  items: Item[]
  planBase: string
  setPlanBase: (id: string) => void
  onUpdateBase: (id: string, patch: Partial<Base>) => void
  openAdd: (preset?: Partial<ItemDraft>) => void
}

export function Plan({ bases, items, planBase, setPlanBase, onUpdateBase, openAdd }: PlanProps) {
  const b = bases.find(x => x.id === planBase) || bases[0]

  const updateBase = (patch: Partial<Base>) => onUpdateBase(b.id, patch)

  if (!b) return null

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">

      {/* Base selector */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {bases.map(x => (
          <button
            key={x.id}
            onClick={() => setPlanBase(x.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border shrink-0 transition-colors ${
              planBase === x.id
                ? 'bg-amber-400 border-amber-400 text-white font-semibold'
                : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
            }`}
          >
            {x.name}
          </button>
        ))}
      </div>

      {/* World settings card */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-4">
        <h2 className="font-bold text-sm">拠点の設定</h2>

        {/* 拠点名・タグ編集 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-orange-50">
          <label className="text-xs text-stone-500">
            拠点名
            <input
              value={b.name}
              onChange={e => updateBase({ name: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <label className="text-xs text-stone-500">
            メモ（構造・階数など）
            <input
              value={b.tag}
              onChange={e => updateBase({ tag: e.target.value })}
              placeholder="例：2階・犬1"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Adults counter */}
          <div className="flex items-center justify-between sm:flex-col sm:gap-2 sm:items-start">
            <span className="text-sm text-stone-500">大人（人）</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateBase({ adults: Math.max(1, b.adults - 1) })}
                className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold tabular-nums text-lg">{b.adults}</span>
              <button
                onClick={() => updateBase({ adults: b.adults + 1 })}
                className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Dogs counter */}
          <div className="flex items-center justify-between sm:flex-col sm:gap-2 sm:items-start">
            <span className="text-sm text-stone-500">犬（匹）</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateBase({ dogs: Math.max(0, b.dogs - 1) })}
                className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-bold tabular-nums text-lg">{b.dogs}</span>
              <button
                onClick={() => updateBase({ dogs: b.dogs + 1 })}
                className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Target days */}
          <div className="sm:col-span-1">
            <p className="text-sm text-stone-500 mb-2">備蓄目標</p>
            <div className="grid grid-cols-3 gap-2">
              {([7, 14, 30] as const).map(d => (
                <button
                  key={d}
                  onClick={() => updateBase({ days: d })}
                  className={`py-2 rounded-xl text-sm font-bold border transition-colors ${
                    b.days === d
                      ? 'bg-amber-400 border-amber-400 text-white'
                      : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
                  }`}
                >
                  {d === 7 ? '1週間' : d === 14 ? '2週間' : '1ヶ月'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Items by group */}
      {REQ_GROUPS.map(group => {
        const groupKeys = REQ_KEYS.filter(k => REQ[k].group === group.id && dailyNeed(b, k) > 0)
        if (groupKeys.length === 0) return null
        return (
          <section key={group.id} className="bg-white rounded-2xl shadow-sm border border-orange-100">
            <div className="px-4 pt-3 pb-1 border-b border-orange-50">
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wide">{group.label}</h3>
            </div>
            <div className="divide-y divide-orange-50">
              {groupKeys.map(k => {
                const need = requiredQty(b, k as ReqKey)
                const have = stockOf(items, b.id, k as ReqKey)
                const lack = Math.max(0, need - have)

                return (
                  <div key={k} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{REQ[k].label}</span>
                      <span className="text-xs text-stone-500 tabular-nums">
                        目安 {need}{REQ[k].unit} / 在庫 {have}{REQ[k].unit}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-stone-100 overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          lack === 0 ? 'bg-emerald-500' : have / need >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
                        }`}
                        style={{ width: `${Math.min(100, need > 0 ? (have / need) * 100 : 100)}%` }}
                      />
                    </div>
                    {lack > 0 ? (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-red-500 font-semibold">あと {lack}{REQ[k].unit} 不足</span>
                        <div className="flex gap-2">
                          <a
                            href={amazonSearch(REQ[k].q)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-amber-700 font-semibold flex items-center gap-1 hover:bg-orange-100 transition-colors"
                          >
                            <ExternalLink size={11} /> Amazon
                          </a>
                          <button
                            onClick={() => openAdd({ baseId: b.id, reqKey: k as ReqKey, name: REQ[k].label, qty: lack })}
                            className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-400 text-white font-semibold flex items-center gap-1 hover:bg-amber-500 transition-colors"
                          >
                            <Plus size={11} /> 在庫に登録
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <Check size={12} /> 充足しています
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      <ChecklistSection baseId={b.id} />
    </div>
  )
}
