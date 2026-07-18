import { useState, useEffect } from 'react'
import { Train, Footprints, AlertTriangle, CheckSquare } from 'lucide-react'
import type { Base } from '../types'

interface WorkInfoSectionProps {
  base: Base
  onUpdate: (patch: Partial<Base>) => void
}

const STAY_CHECKLIST = [
  { id: 'rule',    label: '会社の待機ルールを確認している' },
  { id: 'water3',  label: '職場に3日分の水がある（またはロッカーに自分用）' },
  { id: 'food3',   label: '職場に3日分の食料がある（またはロッカーに自分用）' },
  { id: 'toilet',  label: '携帯トイレが職場またはロッカーにある' },
  { id: 'contact', label: '家族への連絡手段・連絡順序が決まっている' },
  { id: 'shoes',   label: '歩きやすい靴が職場にある' },
  { id: 'charge',  label: 'モバイルバッテリーをロッカーに常備している' },
]

const RETURN_CHECKLIST = [
  { id: 'safe',    label: '職場の建物の安全が確認された' },
  { id: 'family',  label: '家族と連絡が取れ、帰宅を伝えた' },
  { id: 'info',    label: '帰宅ルートの情報を確認した（交通・道路状況）' },
  { id: 'ready',   label: '水・食料・歩きやすい靴の準備ができた' },
  { id: 'time',    label: '帰宅開始は混雑が落ち着いてから（発災後数時間）' },
]

export function WorkInfoSection({ base, onUpdate }: WorkInfoSectionProps) {
  const stayKey = `work-stay-${base.id}`
  const returnKey = `work-return-${base.id}`

  const [stayChecked, setStayChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(stayKey) || '[]')) } catch { return new Set() }
  })
  const [returnChecked, setReturnChecked] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem(returnKey) || '[]')) } catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(stayKey, JSON.stringify([...stayChecked]))
  }, [stayChecked, stayKey])

  useEffect(() => {
    localStorage.setItem(returnKey, JSON.stringify([...returnChecked]))
  }, [returnChecked, returnKey])

  const toggleStay = (id: string) => setStayChecked(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleReturn = (id: string) => setReturnChecked(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  return (
    <div className="space-y-4">

      {/* Route info */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
        <h2 className="font-bold text-sm flex items-center gap-1.5">
          <Train size={14} className="text-amber-500" />
          帰宅ルート情報
        </h2>

        <label className="block text-xs text-stone-500">
          最寄り駅・路線
          <input
            value={base.station || ''}
            onChange={e => onUpdate({ station: e.target.value })}
            placeholder="例：東京駅・JR山手線"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </label>

        <label className="block text-xs text-stone-500">
          通常ルート（電車）
          <input
            value={base.commuteNormal || ''}
            onChange={e => onUpdate({ commuteNormal: e.target.value })}
            placeholder="例：〇〇線で△△駅乗換、約40分"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </label>

        <label className="block text-xs text-stone-500">
          代替ルート（部分復旧・バス等）
          <input
            value={base.commuteAlt || ''}
            onChange={e => onUpdate({ commuteAlt: e.target.value })}
            placeholder="例：〇〇バスで△△、徒歩で□□駅へ"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </label>

        <label className="block text-xs text-stone-500">
          <span className="flex items-center gap-1"><Footprints size={11} />徒歩フルルート（距離・所要時間）</span>
          <input
            value={base.commuteWalk || ''}
            onChange={e => onUpdate({ commuteWalk: e.target.value })}
            placeholder="例：約15km・徒歩4〜5時間、〇〇通り経由"
            className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </label>

        <label className="block text-xs text-stone-500">
          職場の待機ポリシーメモ
          <textarea
            value={base.stayPolicy || ''}
            onChange={e => onUpdate({ stayPolicy: e.target.value })}
            placeholder="例：震度5以上は全員待機。総務から連絡あるまで帰宅禁止。"
            rows={2}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          />
        </label>
      </section>

      {/* Stay checklist */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <CheckSquare size={14} className="text-amber-500" />
            職場待機の準備
          </h2>
          <span className="text-xs text-stone-400 tabular-nums">
            {STAY_CHECKLIST.filter(i => stayChecked.has(i.id)).length}/{STAY_CHECKLIST.length}
          </span>
        </div>
        <div className="space-y-2">
          {STAY_CHECKLIST.map(item => (
            <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                stayChecked.has(item.id) ? 'bg-emerald-400 border-emerald-400' : 'border-orange-200 group-hover:border-amber-300'
              }`}>
                {stayChecked.has(item.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={stayChecked.has(item.id)} onChange={() => toggleStay(item.id)} />
              <span className={`text-sm ${stayChecked.has(item.id) ? 'line-through text-stone-400' : ''}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Return decision checklist */}
      <section className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" />
            帰宅開始の判断基準
          </h2>
          <span className="text-xs text-stone-400 tabular-nums">
            {RETURN_CHECKLIST.filter(i => returnChecked.has(i.id)).length}/{RETURN_CHECKLIST.length}
          </span>
        </div>
        <p className="text-xs text-stone-500 bg-amber-50 rounded-xl p-3">
          「歩いて帰る」より「帰らない判断」が大切です。すべて確認できてから帰宅しましょう。
        </p>
        <div className="space-y-2">
          {RETURN_CHECKLIST.map(item => (
            <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                returnChecked.has(item.id) ? 'bg-amber-400 border-amber-400' : 'border-orange-200 group-hover:border-amber-300'
              }`}>
                {returnChecked.has(item.id) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <input type="checkbox" className="sr-only" checked={returnChecked.has(item.id)} onChange={() => toggleReturn(item.id)} />
              <span className={`text-sm ${returnChecked.has(item.id) ? 'line-through text-stone-400' : ''}`}>{item.label}</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
