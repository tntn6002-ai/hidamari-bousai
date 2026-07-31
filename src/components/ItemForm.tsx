import { X } from 'lucide-react'
import { REQ, REQ_KEYS, REQ_GROUPS } from '../lib/constants'
import { todayStr } from '../lib/calculations'
import type { Base, ItemDraft, ReqKey } from '../types'

interface ItemFormProps {
  draft: ItemDraft
  setDraft: (d: ItemDraft | null) => void
  bases: Base[]
  onSave: () => void
}

export function ItemForm({ draft, setDraft, bases, onSave }: ItemFormProps) {
  const set = (patch: Partial<ItemDraft>) => setDraft({ ...draft, ...patch })
  const canSave = draft.name.trim().length > 0

  // よく使う備蓄のワンタップ・テンプレ（品名・種類・数量を一括入力）
  const QUICK: { label: string; name: string; reqKey: ReqKey; qty: number }[] = [
    { label: '水 2L×6', name: '保存水 2L×6本', reqKey: 'water', qty: 12 },
    { label: '主食（ご飯）', name: 'レトルトご飯', reqKey: 'food', qty: 6 },
    { label: '携帯トイレ', name: '携帯トイレ', reqKey: 'toilet', qty: 50 },
    { label: 'カセットボンベ', name: 'カセットボンベ', reqKey: 'gas', qty: 12 },
    { label: '犬フード', name: '犬フード', reqKey: 'dogfood', qty: 7 },
  ]

  return (
    <div
      className="fixed inset-0 bg-black/40 z-30 flex items-end lg:items-center justify-center p-0 lg:p-4"
      onClick={() => setDraft(null)}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl lg:rounded-3xl p-5 space-y-3 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-bold text-base">{draft.id ? '在庫を編集' : '在庫を追加'}</h2>
          <button onClick={() => setDraft(null)} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={18} />
          </button>
        </div>

        {!draft.id && (
          <div className="space-y-2">
            <p className="text-xs text-stone-500">よく使うものから選ぶと早いです（あとで数量は調整できます）</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK.map(q => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => set({ name: q.name, reqKey: q.reqKey, qty: q.qty })}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  ＋ {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs text-stone-500 sm:col-span-2">
            品名
            <input
              value={draft.name}
              onChange={e => set({ name: e.target.value })}
              placeholder="例：保存水2L×6本"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>

          <label className="text-xs text-stone-500">
            拠点
            <select
              value={draft.baseId}
              onChange={e => set({ baseId: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              {bases.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </label>

          <label className="text-xs text-stone-500">
            種類（在庫計算に使用）
            <select
              value={draft.reqKey}
              onChange={e => set({ reqKey: e.target.value as ReqKey | 'other' })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
                {REQ_GROUPS.map(group => (
                <optgroup key={group.id} label={group.label}>
                  {REQ_KEYS.filter(k => REQ[k].group === group.id).map(k => (
                    <option key={k} value={k}>{REQ[k].label}（{REQ[k].unit}）</option>
                  ))}
                </optgroup>
              ))}
              <option value="other">その他（計算対象外）</option>
            </select>
          </label>

          <label className="text-xs text-stone-500">
            数量{draft.reqKey !== 'other' ? `（${REQ[draft.reqKey as ReqKey]?.unit}）` : ''}
            <input
              type="number"
              inputMode="decimal"
              value={draft.qty}
              onChange={e => set({ qty: e.target.value })}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>

          <label className="text-xs text-stone-500">
            賞味・使用期限（任意）
            <input
              type="date"
              value={draft.expiry}
              onChange={e => set({ expiry: e.target.value })}
              min={todayStr()}
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>

          <label className="text-xs text-stone-500">
            保管場所（任意）
            <input
              value={draft.place}
              onChange={e => set({ place: e.target.value })}
              placeholder="例：押入れ上段"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>

          <label className="text-xs text-stone-500 sm:col-span-2">
            商品URL（任意・次回そこへ直行）
            <input
              value={draft.url}
              onChange={e => set({ url: e.target.value })}
              placeholder="https://www.amazon.co.jp/…"
              className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
        </div>

        <p className="text-xs text-stone-500">必須は<span className="font-semibold text-stone-600">品名と数量</span>だけ。ほかは空でも保存できます。</p>
        <button
          onClick={onSave}
          disabled={!canSave}
          className="w-full py-3 rounded-2xl bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-sm active:bg-amber-500 hover:bg-amber-500 transition-colors"
        >
          保存する
        </button>
      </div>
    </div>
  )
}
