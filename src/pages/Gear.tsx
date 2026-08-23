import { useState } from 'react'
import { Building2, Home } from 'lucide-react'
import { ChecklistSection } from '../components/ChecklistSection'
import type { Base } from '../types'

/** 備蓄以外の「持っておく物」。もとは計画タブの下に埋まっていた。 */
export function Gear({ bases }: { bases: Base[] }) {
  const [activeBase, setActiveBase] = useState(bases[0]?.id || '')
  const b = bases.find(x => x.id === activeBase) || bases[0]
  if (!b) return null

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">
        数で管理しない「一度そろえれば終わる物」のリストです。チェックはこの端末に保存されます。
      </p>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {bases.map(x => (
          <button
            key={x.id}
            onClick={() => setActiveBase(x.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border shrink-0 transition-colors flex items-center gap-1 ${
              activeBase === x.id
                ? 'bg-amber-400 border-amber-400 text-white font-semibold'
                : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
            }`}
          >
            {x.baseType === 'work' ? <Building2 size={10} /> : <Home size={10} />}
            {x.name}
          </button>
        ))}
      </div>

      <ChecklistSection baseId={b.id} />
    </div>
  )
}
