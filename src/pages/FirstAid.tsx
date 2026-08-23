import { Siren, Phone, ExternalLink } from 'lucide-react'
import { FIRST_ACTIONS } from '../lib/knowledge'

/** 発災直後にやることを時系列で。迷っている時間を短くするのが目的。 */
export function FirstAid() {
  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">

      <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
        <h2 className="font-bold text-red-700 flex items-center gap-2 text-sm">
          <Siren size={17} /> 揺れたら、この順番で
        </h2>
        <p className="text-xs text-red-700/80 mt-1.5 leading-relaxed">
          上から順に読めば大丈夫です。落ち着いているときに一度目を通しておくと、本番で思い出せます。
        </p>
      </div>

      <ol className="space-y-3">
        {FIRST_ACTIONS.map((step, i) => (
          <li key={step.time} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
            <div className="px-4 py-2.5 bg-orange-50/60 border-b border-orange-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-amber-400 text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-[11px] font-bold text-amber-700 tabular-nums">{step.time}</span>
              <span className="font-bold text-sm">{step.title}</span>
            </div>
            <ul className="px-4 py-3 space-y-1.5">
              {step.points.map(p => (
                <li key={p} className="text-sm text-stone-600 leading-relaxed flex gap-2">
                  <span className="text-amber-400 shrink-0">・</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            {step.warn && (
              <p className="mx-4 mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 leading-relaxed">
                {step.warn}
              </p>
            )}
          </li>
        ))}
      </ol>

      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Phone size={15} className="text-amber-500" /> 安否確認の手段
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-baseline gap-3">
            <span className="font-bold text-amber-600 tabular-nums shrink-0">171</span>
            <span className="text-stone-600 text-xs leading-relaxed">
              災害用伝言ダイヤル。録音は<strong>1</strong>、再生は<strong>2</strong>を押し、自宅の電話番号を入れる。
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-bold text-amber-600 shrink-0 text-xs">web171</span>
            <a
              href="https://www.web171.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-700 underline flex items-center gap-1"
            >
              災害用伝言板（文字で残せる） <ExternalLink size={11} />
            </a>
          </div>
        </div>
        <p className="text-[11px] text-stone-400 leading-relaxed">
          毎月1日・15日などに体験利用ができます。一度使っておくと本番で迷いません。
        </p>
      </section>

      <p className="text-[11px] text-stone-400 leading-relaxed">
        ここに書いてあるのは一般的な行動の目安です。実際の避難の判断は、お住まいの自治体が出す避難情報に従ってください。
      </p>
    </div>
  )
}
