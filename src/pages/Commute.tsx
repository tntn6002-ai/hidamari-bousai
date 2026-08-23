import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { WorkInfoSection } from '../components/WorkInfoSection'
import type { Base } from '../types'

interface CommuteProps {
  bases: Base[]
  onUpdateBase: (id: string, patch: Partial<Base>) => void
  setTab: (t: 'plan') => void
}

/** 職場にいるときに被災した場合。もとは計画タブの下に埋まっていた。 */
export function Commute({ bases, onUpdateBase, setTab }: CommuteProps) {
  const workBases = bases.filter(b => b.baseType === 'work')
  const [activeBase, setActiveBase] = useState(workBases[0]?.id || '')
  const b = workBases.find(x => x.id === activeBase) || workBases[0]

  if (!b) {
    return (
      <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-8 text-center space-y-3">
          <Building2 size={26} className="mx-auto text-amber-300" />
          <p className="text-sm text-stone-500">職場の拠点がまだ登録されていません</p>
          <p className="text-xs text-stone-400 leading-relaxed">
            職場を登録すると、待機の判断と帰宅の準備をチェックできます。
          </p>
          <button
            onClick={() => setTab('plan')}
            className="px-4 py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors"
          >
            計画タブで拠点を追加する
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">
      <p className="text-sm text-stone-500 leading-relaxed">
        大地震の直後は、無理に帰らないほうが安全です。まず職場で待てる状態をつくっておきましょう。
      </p>

      {workBases.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {workBases.map(x => (
            <button
              key={x.id}
              onClick={() => setActiveBase(x.id)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border shrink-0 transition-colors flex items-center gap-1 ${
                activeBase === x.id
                  ? 'bg-amber-400 border-amber-400 text-white font-semibold'
                  : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
              }`}
            >
              <Building2 size={10} /> {x.name}
            </button>
          ))}
        </div>
      )}

      <WorkInfoSection base={b} onUpdate={patch => onUpdateBase(b.id, patch)} />
    </div>
  )
}
