import { useEffect, useState } from 'react'
import type { Base, Item } from '../types'
import { REQ } from '../lib/constants'
import { requiredQty, stockOf } from '../lib/calculations'
import { computeLevel, computeBadges, weeklyMissions, readyBaseCount, roleTargetKey, ROLES, QUIZZES } from '../lib/game'
import { loadGame, saveGame, checkIn, checkedInToday, mergeEarned } from '../lib/gameStore'

interface ChallengeProps {
  bases: Base[]
  items: Item[]
}

export function Challenge({ bases, items }: ChallengeProps) {
  const [g, setG] = useState(loadGame)
  const [pick, setPick] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [order] = useState(() => [...QUIZZES].sort(() => Math.random() - 0.5))
  const [celebrate, setCelebrate] = useState<number | null>(null)

  const quizDoneCount = Object.keys(g.quizDone).length
  const badges = computeBadges(bases, items, { quizScore: g.quizScore, quizDoneCount, streakCount: g.streakCount })
  const level = computeLevel(bases, items, g)
  const missions = weeklyMissions(bases, items)
  const ready = readyBaseCount(bases, items)
  const goalPct = bases.length ? Math.round((ready / bases.length) * 100) : 0
  const earnedCount = badges.filter(b => b.earned || g.earned.includes(b.id)).length
  const current = order.find(q => !g.quizDone[q.id]) ?? null

  // 担当ごとの専用ミッション（自分の“出番”をつくる）
  const roleKey = roleTargetKey(g.role)
  const roleShort = roleKey ? bases.filter(b => requiredQty(b, roleKey) > 0 && stockOf(items, b.id, roleKey) < requiredQty(b, roleKey)) : []
  const roleMission = !g.role ? null
    : roleKey
      ? { text: `${REQ[roleKey].label}が足りない家をゼロにしよう`, done: roleShort.length === 0, hint: roleShort.length ? `あと${roleShort.length}軒` : 'クリア！' }
      : { text: '防災クイズを5問 正解しよう', done: g.quizScore >= 5, hint: `いま ${Math.min(g.quizScore, 5)}/5` }

  // 達成済みバッジを sticky に保存（データ＋クイズ/連続の実績）
  useEffect(() => {
    setG(prev => {
      const ids = computeBadges(bases, items, {
        quizScore: prev.quizScore,
        quizDoneCount: Object.keys(prev.quizDone).length,
        streakCount: prev.streakCount,
      }).filter(b => b.earned).map(b => b.id)
      const merged = mergeEarned(prev, ids)
      if (merged !== prev) saveGame(merged)
      return merged
    })
  }, [bases, items, g.quizScore, g.streakCount])

  const already = checkedInToday(g)
  const doCheckIn = () => {
    if (already) return
    const next = checkIn(g)
    saveGame(next)
    setG(next)
    setCelebrate(next.streakCount)
    window.setTimeout(() => setCelebrate(null), 1900)
  }
  const milestoneMsg = (n: number) =>
    n >= 30 ? ' 1か月達成！🏆' : n >= 14 ? ' 2週間！' : n >= 7 ? ' 1週間達成！⚡' : n >= 3 ? ' その調子！' : ''
  const pickRole = (r: string) => setG(prev => { const next = { ...prev, role: prev.role === r ? null : r }; saveGame(next); return next })

  const answer = (i: number) => {
    if (revealed || !current) return
    setPick(i); setRevealed(true)
    const correct = i === current.answer
    setG(prev => {
      const next = { ...prev, quizDone: { ...prev.quizDone, [current.id]: true }, quizScore: prev.quizScore + (correct ? 1 : 0) }
      saveGame(next); return next
    })
  }
  const nextQ = () => { setPick(null); setRevealed(false) }
  const resetQuiz = () => { setG(prev => { const next = { ...prev, quizDone: {}, quizScore: 0 }; saveGame(next); return next }); setPick(null); setRevealed(false) }

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-5">
      <style>{`
        @keyframes ci-fade { 0%{opacity:0} 12%{opacity:1} 78%{opacity:1} 100%{opacity:0} }
        @keyframes ci-pop { 0%{transform:scale(.2) rotate(-10deg);opacity:0} 45%{transform:scale(1.2) rotate(6deg);opacity:1} 70%{transform:scale(.92) rotate(-3deg)} 100%{transform:scale(1) rotate(0)} }
        @keyframes ci-float { 0%{transform:translateY(10px) scale(.5);opacity:0} 25%{opacity:1} 100%{transform:translateY(-130px) scale(1.15);opacity:0} }
        .ci-overlay{ animation: ci-fade 1.9s ease forwards }
        .ci-pop{ animation: ci-pop .7s cubic-bezier(.2,1.4,.4,1) }
        .ci-spark{ position:absolute; bottom:42%; font-size:1.4rem; animation: ci-float 1.6s ease-out forwards }
        @media (prefers-reduced-motion: reduce){ .ci-pop{ animation:none } .ci-spark{ display:none } }
      `}</style>

      {celebrate !== null && (
        <div className="ci-overlay fixed inset-0 z-40 pointer-events-none flex items-center justify-center">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <span key={i} className="ci-spark" style={{ left: `${18 + i * 12}%`, animationDelay: `${i * 90}ms` }}>
              {i % 2 ? '✨' : '🔥'}
            </span>
          ))}
          <div className="ci-pop text-center">
            <div className="text-6xl">🔥</div>
            <p className="mt-2 text-base font-bold text-amber-700 bg-white/95 rounded-full px-5 py-2 shadow-lg">
              {celebrate}日連続！{milestoneMsg(celebrate)}
            </p>
          </div>
        </div>
      )}

      <p className="text-sm text-stone-500">遊びながら、家族の備えを育てましょう ☀️</p>

      {/* 備えレベル */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
            <span className="text-[10px] leading-none">Lv.</span>
            <span className="text-2xl font-bold leading-none tabular-nums">{level.level}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base">{level.title}</p>
            <div className="mt-1.5 h-2.5 rounded-full bg-orange-100 overflow-hidden">
              <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${level.pct}%` }} />
            </div>
            <p className="text-xs text-stone-500 mt-1">次のレベルまで あと {level.toNext}pt</p>
          </div>
        </div>
      </section>

      {/* ストリーク & 協力ゴール */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
          <p className="text-xs font-bold text-stone-500 mb-2">つづける</p>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">🔥</span>
            <p className="text-2xl font-bold tabular-nums leading-none">
              {g.streakCount}<span className="text-sm font-normal text-stone-400"> 日連続</span>
            </p>
          </div>
          <button
            onClick={doCheckIn}
            disabled={already}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-colors bg-amber-400 text-white hover:bg-amber-500 disabled:bg-emerald-50 disabled:text-emerald-600"
          >
            {already ? '今日はチェック済み ✓' : '今日のチェックイン'}
          </button>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
          <p className="text-xs font-bold text-stone-500 mb-2">家族の協力ゴール</p>
          <p className="text-sm">全部の家を準備OKに！ <span className="font-bold tabular-nums">{ready}/{bases.length}</span></p>
          <div className="mt-2 h-2.5 rounded-full bg-orange-100 overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-500" style={{ width: `${goalPct}%` }} />
          </div>
          {bases.length > 0 && ready === bases.length
            ? <p className="text-xs font-bold text-emerald-600 mt-1.5">🎉 全員達成！</p>
            : <p className="text-xs text-stone-400 mt-1.5">みんなで100%を目指そう</p>}
        </section>
      </div>

      {/* バッジ */}
      <section>
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2 px-1">
          バッジ（{earnedCount}/{badges.length}）
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {badges.map(b => {
            const got = b.earned || g.earned.includes(b.id)
            return (
              <div key={b.id} className={`rounded-2xl border p-3 text-center ${got ? 'bg-amber-50 border-amber-200' : 'bg-white border-orange-100 opacity-70'}`}>
                <div className="text-2xl">{got ? b.emoji : '🔒'}</div>
                <p className="text-xs font-bold mt-1">{b.label}</p>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-tight">{b.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 今週のミッション */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">今週のミッション</h2>
        <div className="space-y-2.5">
          {missions.map(m => (
            <div key={m.id} className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${m.done ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-stone-400'}`}>
                {m.done ? '✓' : '…'}
              </span>
              <span className={`flex-1 text-sm ${m.done ? 'text-stone-400 line-through' : ''}`}>{m.label}</span>
              <span className="text-[11px] text-stone-400 tabular-nums shrink-0">{m.hint}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 担当 */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-1">あなたの担当</h2>
        <p className="text-xs text-stone-500 mb-2.5">家族で分担しよう</p>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => pickRole(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                g.role === r ? 'bg-amber-400 border-amber-400 text-white' : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {roleMission && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${roleMission.done ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-amber-600 border border-amber-300'}`}>
              {roleMission.done ? '✓' : '!'}
            </span>
            <span className="flex-1 text-sm"><span className="font-bold">{g.role}</span>のミッション：{roleMission.text}</span>
            <span className="text-[11px] text-stone-500 shrink-0 tabular-nums">{roleMission.hint}</span>
          </div>
        )}
      </section>

      {/* 防災クイズ */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wide">
          防災クイズ <span className="text-[11px] normal-case text-stone-400">（正解 {g.quizScore}）</span>
        </h2>
        {current ? (
          <>
            <p className="text-sm font-semibold mt-2 mb-3">{current.q}</p>
            <div className="space-y-2">
              {current.choices.map((c, i) => {
                const isAns = i === current.answer
                const style = !revealed ? 'idle' : isAns ? 'correct' : i === pick ? 'wrong' : 'idle'
                return (
                  <button
                    key={i}
                    onClick={() => answer(i)}
                    disabled={revealed}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      style === 'correct' ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold'
                        : style === 'wrong' ? 'bg-red-50 border-red-300 text-red-700'
                        : 'bg-white border-orange-200 hover:border-amber-300'
                    }`}
                  >
                    {c}{style === 'correct' ? ' ✓' : style === 'wrong' ? ' ✗' : ''}
                  </button>
                )
              })}
            </div>
            {revealed && (
              <div className="mt-3">
                <p className="text-xs text-stone-600 bg-orange-50 rounded-xl p-3 leading-relaxed">
                  {pick === current.answer ? '正解！（+3pt） ' : 'おしい！ '}{current.explain}
                </p>
                <button onClick={nextQ} className="mt-2 w-full py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors">
                  次の問題へ
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm font-bold">全問クリア！ 🎉</p>
            <p className="text-xs text-stone-500 mt-1 tabular-nums">正解 {g.quizScore}/{QUIZZES.length}</p>
            <button onClick={resetQuiz} className="mt-3 px-4 py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors">
              もう一度挑戦
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
