import { Plus, Minus, Trash2, ExternalLink, Pencil } from 'lucide-react'
import { REQ } from '../lib/constants'
import { daysUntil, amazonSearch } from '../lib/calculations'
import type { Base, Item, ItemDraft, ReqKey } from '../types'

interface InventoryProps {
  bases: Base[]
  items: Item[]
  invBase: string
  setInvBase: (id: string) => void
  onChangeQty: (id: string, delta: number) => void
  onDeleteItem: (id: string) => void
  openAdd: (preset?: Partial<ItemDraft>) => void
  openEdit: (item: Item) => void
}

export function Inventory({ bases, items, invBase, setInvBase, onChangeQty, onDeleteItem, openAdd, openEdit }: InventoryProps) {
  const changeQty = (id: string, delta: number) => onChangeQty(id, delta)

  const removeItem = (id: string) => {
    if (!window.confirm('この在庫を削除しますか？')) return
    onDeleteItem(id)
  }

  const baseName = (id: string) => bases.find(b => b.id === id)?.name || '?'

  const filtered = items.filter(it => invBase === 'all' || it.baseId === invBase)

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">

      {/* Base filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {[{ id: 'all', name: 'すべて' }, ...bases].map(b => (
          <button
            key={b.id}
            onClick={() => setInvBase(b.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border shrink-0 transition-colors ${
              invBase === b.id
                ? 'bg-amber-400 border-amber-400 text-white font-semibold'
                : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-8 text-center text-sm text-stone-400">
          まだ在庫がありません。<br />
          下の「＋ 在庫を追加」か、計画タブの不足行から追加できます。
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(it => {
            const d = daysUntil(it.expiry)
            const unit = it.reqKey === 'other' ? it.unit : REQ[it.reqKey as ReqKey]?.unit

            const expChip = d === null ? null
              : d < 0
                ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-semibold">期限切れ</span>
                : d <= 30
                  ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">あと{d}日</span>
                  : <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{it.expiry}</span>

            const amazonHref = it.url
              || (it.reqKey !== 'other' ? amazonSearch(REQ[it.reqKey as ReqKey].q) : amazonSearch(it.name))

            return (
              <div key={it.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm truncate">{it.name}</span>
                      {expChip}
                    </div>
                    <p className="text-[11px] text-stone-400 truncate">
                      {baseName(it.baseId)}
                      {it.place ? ` ・ ${it.place}` : ''}
                      {it.reqKey !== 'other' ? ` ・ ${REQ[it.reqKey as ReqKey].label}に算入` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => changeQty(it.id, -1)}
                      className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center active:bg-orange-100 hover:bg-orange-100 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-14 text-center text-sm font-bold tabular-nums">
                      {it.qty}<span className="text-[10px] font-normal text-stone-400">{unit}</span>
                    </span>
                    <button
                      onClick={() => changeQty(it.id, 1)}
                      className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center active:bg-orange-100 hover:bg-orange-100 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-2 text-stone-400">
                  <a
                    href={amazonHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] flex items-center gap-1 text-amber-600 font-semibold hover:text-amber-700"
                  >
                    <ExternalLink size={12} /> Amazonで開く
                  </a>
                  <button
                    onClick={() => openEdit(it)}
                    className="text-[11px] flex items-center gap-1 hover:text-stone-600"
                  >
                    <Pencil size={12} />編集
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="text-[11px] flex items-center gap-1 hover:text-red-500"
                  >
                    <Trash2 size={12} />削除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        onClick={() => openAdd({ baseId: invBase === 'all' ? bases[0]?.id : invBase })}
        className="w-full py-3 rounded-2xl bg-amber-400 text-white font-bold text-sm shadow-sm active:bg-amber-500 hover:bg-amber-500 transition-colors flex items-center justify-center gap-1"
      >
        <Plus size={16} /> 在庫を追加
      </button>
    </div>
  )
}
