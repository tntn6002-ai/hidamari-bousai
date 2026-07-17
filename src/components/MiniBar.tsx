interface MiniBarProps {
  label: string
  have: number
  need: number
  unit: string
}

export function MiniBar({ label, have, need, unit }: MiniBarProps) {
  const p = need > 0 ? Math.min(1, have / need) : 1
  const color = p >= 1 ? 'bg-emerald-500' : p >= 0.5 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-stone-500 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${p * 100}%`, transition: 'width 500ms ease' }}
        />
      </div>
      <span className="w-20 text-right text-stone-600 tabular-nums shrink-0">
        {have}/{need}{unit}
      </span>
    </div>
  )
}
