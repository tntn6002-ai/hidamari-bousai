import { Siren, ShieldCheck, Toilet, Play, Package, MapPin, ChevronRight, Plus, Sun } from 'lucide-react'
import { Ring } from '../components/Ring'
import { MiniBar } from '../components/MiniBar'
import { Accordion } from '../components/Accordion'
import { REQ, REQ_KEYS } from '../lib/constants'
import { baseSummary, dailyNeed, stockOf, requiredQty, daysUntil } from '../lib/calculations'
import { SAFETY_ACTIONS, SAFETY_GROUPS, TOILET_STEPS, TOILET_WHY, TOILET_SUPPLIES } from '../lib/knowledge'
import { useLocalSet, useLocalList, youtubeId, thumbnailUrl, VIDEO_KEY, type VideoLink } from '../lib/localList'
import type { Base, Item, TabId } from '../types'

interface HomeProps {
  bases: Base[]
  items: Item[]
  setTab: (t: TabId) => void
}

export function Home({ bases, items, setTab }: HomeProps) {
  const [doneActions, toggleAction] = useLocalSet('hidamari-safety-actions')
  const [videos] = useLocalList<VideoLink>(VIDEO_KEY)

  const expiryAlertCount = items.filter(it => {
    const d = daysUntil(it.expiry)
    return d !== null && d <= 30
  }).length

  const shortageCount = bases.reduce(
    (acc, b) => acc + REQ_KEYS.filter(k => {
      const need = requiredQty(b, k)
      return need > 0 && stockOf(items, b.id, k) < need
    }).length,
    0,
  )

  const totalAlerts = expiryAlertCount + shortageCount
  const allReady = bases.length > 0 && items.length > 0 && bases.every(b => baseSummary(items, b).pct >= 1)
  const safetyDone = SAFETY_ACTIONS.filter(a => doneActions.has(a.id)).length
  const safetyPct = Math.round((safetyDone / SAFETY_ACTIONS.length) * 100)

  // 携帯トイレの充足状況（非常トイレの説明と結びつける）
  const toiletNeed = bases.reduce((s, b) => s + requiredQty(b, 'toilet'), 0)
  const toiletHave = bases.reduce((s, b) => s + stockOf(items, b.id, 'toilet'), 0)

  const homeBases = bases.filter(b => b.baseType !== 'work')
  const locatedCount = bases.filter(b => b.lat && b.lon).length

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-3.5">

      {/* ① 発災直後 ─────────────────────────────── */}
      <button
        onClick={() => setTab('firstaid')}
        className="w-full text-left rounded-2xl bg-red-500 text-white p-4 shadow-sm hover:bg-red-600 transition-colors flex items-center gap-3.5"
      >
        <Siren size={26} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-base leading-tight">いま揺れたら</h2>
          <p className="text-xs text-red-50 mt-1 leading-relaxed">
            身を守る → 火と出口 → 安否 → 逃げるか決める。順番に読むだけで動けます。
          </p>
        </div>
        <ChevronRight size={20} className="shrink-0 opacity-80" />
      </button>

      {/* ② 我が家のリスク ────────────────────────── */}
      <Accordion
        title="我が家のリスク"
        subtitle={locatedCount === bases.length ? '場所は全拠点で設定済み' : `${bases.length - locatedCount}件の拠点が場所未設定`}
        Icon={MapPin}
        defaultOpen
      >
        <div className="space-y-2 pt-2">
          {bases.map(b => (
            <div key={b.id} className="flex items-center gap-3 py-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{b.name}</p>
                <p className="text-[11px] text-stone-400">
                  {b.lat && b.lon
                    ? `${b.floor ? `${b.floor}階・` : ''}場所設定済み`
                    : '場所が未設定です'}
                  {b.floor && b.floor <= 2 && b.lat && b.lon && (
                    <span className="text-amber-600 font-semibold ml-1">低層階は浸水に注意</span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setTab(b.lat && b.lon ? 'shelter' : 'hazard')}
                className="text-[11px] px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-amber-700 font-semibold shrink-0 hover:bg-orange-100 transition-colors"
              >
                {b.lat && b.lon ? '避難先を見る' : '場所を設定'}
              </button>
            </div>
          ))}
          <button
            onClick={() => setTab('hazard')}
            className="w-full mt-1 py-2 rounded-xl border border-orange-200 text-xs text-stone-500 font-semibold hover:bg-orange-50 transition-colors"
          >
            ハザードマップで洪水・土砂・津波を確認する
          </button>
        </div>
      </Accordion>

      {/* ③ 命を守る備え ──────────────────────────── */}
      <Accordion
        title="今からすべき、命を守る備え"
        subtitle="備蓄より先に効く、家の中の対策"
        Icon={ShieldCheck}
        badge={
          <span className="text-[11px] font-bold text-amber-600 tabular-nums shrink-0">
            {safetyDone}/{SAFETY_ACTIONS.length}
          </span>
        }
      >
        <div className="pt-2 space-y-4">
          <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-500"
              style={{ width: `${safetyPct}%` }}
            />
          </div>

          {SAFETY_GROUPS.map(g => (
            <div key={g}>
              <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1.5">{g}</h3>
              <div className="space-y-1">
                {SAFETY_ACTIONS.filter(a => a.group === g).map(a => {
                  const done = doneActions.has(a.id)
                  return (
                    <button
                      key={a.id}
                      onClick={() => toggleAction(a.id)}
                      className="w-full text-left flex gap-2.5 p-2 rounded-xl hover:bg-orange-50 transition-colors"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center text-[10px] font-bold ${
                          done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-stone-300'
                        }`}
                      >
                        {done ? '✓' : ''}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm leading-snug ${done ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                          {a.label}
                        </span>
                        <span className="block text-[11px] text-stone-400 leading-relaxed mt-0.5">{a.why}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Accordion>

      {/* ④ 非常トイレ ───────────────────────────── */}
      <Accordion
        title="非常トイレの使い方"
        subtitle="断水しても、下水が壊れていたら流せません"
        Icon={Toilet}
        badge={
          toiletNeed > 0 ? (
            <span
              className={`text-[11px] font-bold tabular-nums shrink-0 ${
                toiletHave >= toiletNeed ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {toiletHave}/{toiletNeed}回分
            </span>
          ) : undefined
        }
      >
        <div className="pt-3 space-y-4">
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-1.5">
            {TOILET_WHY.map(w => (
              <p key={w} className="text-xs text-amber-800 leading-relaxed">{w}</p>
            ))}
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-2">作り方</h3>
            <ol className="space-y-2.5">
              {TOILET_STEPS.map(s => (
                <li key={s.n} className="flex gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {s.n}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">{s.title}</p>
                    <p className="text-xs text-stone-500 leading-relaxed mt-0.5">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-wide mb-1.5">そろえておく物</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
              {TOILET_SUPPLIES.map(s => (
                <li key={s} className="text-xs text-stone-600 flex gap-1.5">
                  <span className="text-amber-400">・</span>{s}
                </li>
              ))}
            </ul>
          </div>

          {toiletNeed > 0 && toiletHave < toiletNeed && (
            <button
              onClick={() => setTab('plan')}
              className="w-full py-2.5 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors"
            >
              携帯トイレがあと{toiletNeed - toiletHave}回分足りません
            </button>
          )}
        </div>
      </Accordion>

      {/* ⑤ 動画 ────────────────────────────────── */}
      <Accordion
        title="覚えておきたい動画"
        subtitle={videos.length ? `${videos.length}本` : 'まだ登録がありません'}
        Icon={Play}
        defaultOpen={videos.length > 0}
      >
        <div className="pt-2 space-y-2">
          {videos.slice(0, 3).map(v => {
            const vid = youtubeId(v.url)
            return (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 items-center p-2 rounded-xl hover:bg-orange-50 transition-colors"
              >
                {vid ? (
                  <img src={thumbnailUrl(vid)} alt="" className="w-20 h-12 object-cover rounded-lg shrink-0" loading="lazy" />
                ) : (
                  <span className="w-20 h-12 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                    <Play size={14} className="text-amber-300" />
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold line-clamp-2 leading-snug">{v.title}</span>
                  {v.note && <span className="block text-[11px] text-stone-400 mt-0.5">{v.note}</span>}
                </span>
              </a>
            )
          })}
          <button
            onClick={() => setTab('video')}
            className="w-full py-2 rounded-xl border border-dashed border-amber-300 text-amber-600 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-amber-50 transition-colors"
          >
            <Plus size={13} /> {videos.length > 3 ? `すべて見る（${videos.length}本）` : '動画を追加する'}
          </button>
        </div>
      </Accordion>

      {/* ⑥ 備えの状況 ───────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
        <div className="px-4 py-3.5 flex items-center gap-3 border-b border-orange-50">
          <Package size={18} className="text-amber-500 shrink-0" />
          <h2 className="font-bold text-sm flex-1">備えの状況</h2>
          {totalAlerts > 0 ? (
            <button
              onClick={() => setTab('alert')}
              className="text-[11px] px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold hover:bg-red-100 transition-colors"
            >
              要対応 {totalAlerts}件
            </button>
          ) : allReady ? (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
              準備OK
            </span>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center space-y-3">
            <Sun size={26} className="mx-auto text-amber-400" />
            <p className="text-sm font-bold text-stone-600">まずは備蓄を1つ登録しましょう</p>
            <button
              onClick={() => setTab('inv')}
              className="px-4 py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors"
            >
              まず水を1本 登録する
            </button>
          </div>
        ) : (
          <div className="divide-y divide-orange-50">
            {bases.map(b => {
              const s = baseSummary(items, b)
              return (
                <button
                  key={b.id}
                  onClick={() => setTab('plan')}
                  className="w-full p-4 flex gap-4 items-center text-left hover:bg-orange-50/50 transition-colors"
                >
                  <Ring pct={s.pct} size={64} stroke={7}>
                    <span className="text-sm font-bold tabular-nums leading-none">
                      {s.minDays >= 99 ? '99+' : Math.floor(s.minDays * 10) / 10}
                    </span>
                    <span className="text-[9px] text-stone-400">日分</span>
                  </Ring>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
                      <h3 className="font-bold text-sm">{b.name}</h3>
                      <span className="text-[11px] text-stone-400">目標 {b.days}日</span>
                      {s.pct >= 1 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          準備OK
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {REQ_KEYS.filter(k => REQ[k].core && dailyNeed(b, k) > 0).map(k => (
                        <MiniBar
                          key={k}
                          label={REQ[k].label}
                          have={stockOf(items, b.id, k)}
                          need={requiredQty(b, k)}
                          unit={REQ[k].unit}
                        />
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-stone-300 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </section>

      <p className="text-[11px] text-stone-400 leading-relaxed">
        計算根拠：大人1人1日＝水3L・3食・トイレ5回、カセットボンベ約6本/週（2人）、犬1匹1日＝水0.5L・フード1日分・シーツ3枚（目安）。リングは水・主食・トイレのうち最少の日数。
        {homeBases.length > 0 && ' 在宅避難を前提にしています。'}
      </p>
    </div>
  )
}
