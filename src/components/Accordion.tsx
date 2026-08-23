import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionProps {
  title: string
  subtitle?: string
  Icon?: React.ComponentType<{ size?: number; className?: string }>
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

export function Accordion({ title, subtitle, Icon, badge, defaultOpen = false, children }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left hover:bg-orange-50/50 transition-colors"
      >
        {Icon && <Icon size={18} className="text-amber-500 shrink-0" />}
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-sm">{title}</h2>
          {subtitle && <p className="text-[11px] text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
        <ChevronDown
          size={17}
          className={`text-stone-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="px-4 pb-4 pt-1 border-t border-orange-50">{children}</div>}
    </section>
  )
}
