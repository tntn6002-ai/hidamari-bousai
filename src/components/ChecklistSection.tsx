import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CheckItem {
  id: string
  label: string
  qty: string
}

interface CheckGroup {
  id: string
  label: string
  items: CheckItem[]
}

const CHECKLIST: CheckGroup[] = [
  {
    id: 'cooking',
    label: '調理・光熱',
    items: [
      { id: 'stove',       label: 'カセットコンロ',           qty: '1台' },
      { id: 'igniter',     label: '点火棒',                   qty: '1本' },
      { id: 'flashlight',  label: '懐中電灯',                 qty: '最低2台' },
      { id: 'lantern',     label: 'LEDランタン',              qty: '1〜2灯' },
      { id: 'headlight',   label: 'ヘッドライト',             qty: '人数分' },
      { id: 'battery',     label: '乾電池（単1〜単4）',       qty: '多めに' },
      { id: 'radio',       label: '手回し充電式ラジオ',       qty: '1台' },
      { id: 'charger',     label: '携帯電話充電器・モバイルバッテリー', qty: '1台以上' },
    ],
  },
  {
    id: 'daily',
    label: '生活用品',
    items: [
      { id: 'bag',         label: 'リュックサック（避難用）', qty: '人数分' },
      { id: 'polybag',     label: 'ポリ袋',                   qty: '1箱' },
      { id: 'wrap',        label: 'ラップ',                   qty: '1本' },
      { id: 'foil',        label: 'アルミホイル',             qty: '1本' },
      { id: 'tissue',      label: 'ティッシュペーパー',       qty: '4箱' },
      { id: 'toilet_p',    label: 'トイレットペーパー',       qty: '多めに' },
      { id: 'tape',        label: '布製ガムテープ',           qty: '2巻' },
      { id: 'gloves',      label: '軍手',                     qty: '人数分' },
      { id: 'vinyl_g',     label: 'ビニール手袋',             qty: '1箱' },
      { id: 'cash',        label: '現金（小銭含む）',         qty: '数日分' },
    ],
  },
  {
    id: 'hygiene',
    label: '衛生用品',
    items: [
      { id: 'firstaid',    label: '救急箱',                   qty: '1箱' },
      { id: 'medicine',    label: '常備薬・処方薬',           qty: '1週間分以上' },
      { id: 'mask',        label: 'マスク',                   qty: '人数×日数分' },
      { id: 'wet_tissue',  label: '除菌ウェットティッシュ',   qty: '90枚以上' },
      { id: 'alcohol',     label: 'アルコールスプレー',       qty: '2本' },
      { id: 'dental_wipe', label: '歯磨き用ウェットティッシュ', qty: '多めに' },
      { id: 'contact',     label: '使い捨てコンタクトレンズ', qty: '予備あり' },
    ],
  },
  {
    id: 'women',
    label: '女性向け',
    items: [
      { id: 'sanitary',    label: '生理用品',                 qty: '多めに' },
      { id: 'cosmetics',   label: '基礎化粧品',               qty: '適宜' },
    ],
  },
  {
    id: 'work',
    label: '職場備蓄（ロッカー等）',
    items: [
      { id: 'work_water',    label: '飲料水',                     qty: '3L/人/日×3日' },
      { id: 'work_food',     label: '非常食（レトルト・缶詰等）', qty: '3食/人/日×3日' },
      { id: 'work_toilet',   label: '携帯トイレ',                 qty: '5回分/人/日×3日' },
      { id: 'work_shoes',    label: '歩きやすい靴・スニーカー',   qty: '1足' },
      { id: 'work_clothes',  label: '着替え（上下1セット）',      qty: '1セット' },
      { id: 'work_cash',     label: '現金（小銭含む）',           qty: '数日分' },
      { id: 'work_map',      label: '紙の地図（帰宅ルート）',     qty: '1枚' },
      { id: 'work_medicine', label: '常備薬',                     qty: '3日分' },
      { id: 'work_charger',  label: 'モバイルバッテリー',         qty: '1台' },
      { id: 'work_radio',    label: 'ラジオ（小型）',             qty: '1台' },
      { id: 'work_mask',     label: 'マスク・防塵マスク',         qty: '複数枚' },
      { id: 'work_gloves',   label: '軍手',                       qty: '1組' },
    ],
  },
]

interface ChecklistSectionProps {
  baseId: string
}

export function ChecklistSection({ baseId }: ChecklistSectionProps) {
  const storageKey = `checklist-${baseId}`
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      return new Set(saved ? JSON.parse(saved) : [])
    } catch { return new Set() }
  })
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['cooking', 'daily', 'hygiene']))

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify([...checked]))
  }, [checked, storageKey])

  const toggle = (id: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const totalItems = CHECKLIST.flatMap(g => g.items).length
  const checkedCount = CHECKLIST.flatMap(g => g.items).filter(i => checked.has(i.id)).length

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-orange-100">
      <div className="px-4 pt-4 pb-3 border-b border-orange-50">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm">その他の備品チェックリスト</h2>
          <span className="text-xs font-semibold text-stone-500 tabular-nums">
            {checkedCount}/{totalItems}
          </span>
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5">東京都防災リーフレット（令和7年10月版）準拠</p>
        <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${(checkedCount / totalItems) * 100}%` }}
          />
        </div>
      </div>

      <div className="divide-y divide-orange-50">
        {CHECKLIST.map(group => {
          const groupChecked = group.items.filter(i => checked.has(i.id)).length
          const isOpen = openGroups.has(group.id)
          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-orange-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{group.label}</span>
                  <span className="text-[10px] text-stone-400 tabular-nums">
                    {groupChecked}/{group.items.length}
                  </span>
                </div>
                {isOpen ? <ChevronUp size={14} className="text-stone-400" /> : <ChevronDown size={14} className="text-stone-400" />}
              </button>

              {isOpen && (
                <div className="px-4 pb-3 space-y-2">
                  {group.items.map(item => (
                    <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked.has(item.id)
                          ? 'bg-emerald-400 border-emerald-400'
                          : 'border-orange-200 group-hover:border-amber-300'
                      }`}>
                        {checked.has(item.id) && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked.has(item.id)}
                        onChange={() => toggle(item.id)}
                      />
                      <span className={`text-sm flex-1 ${checked.has(item.id) ? 'line-through text-stone-400' : ''}`}>
                        {item.label}
                      </span>
                      <span className="text-[11px] text-stone-400 tabular-nums shrink-0">{item.qty}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
