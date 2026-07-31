import { useEffect, useState } from 'react'
import type { Base, Item } from '../types'
import { computeLevel, computeBadges, weeklyMissions, readyBaseCount, ROLES, QUIZZES } from '../lib/game'
import { loadGame, saveGame, checkIn, checkedInToday, mergeEarned } from '../lib/gameStore'

interface ChallengeProps {
  bases: Base[]
  items: Item[]
}

export function Challenge({ bases, items }: ChallengeProps) {
  const [g, setG] = useState(loadGame)
  const [pick, setPick] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)

  const badges = computeBadges(bases, items)
  const level = computeLevel(bases, items)
  const missions = weeklyMissions(bases, items)
  const ready = readyBaseCount(bases, items)
  const goalPct = bases.length ? Math.round((ready / bases.length) * 100) : 0
  const earnedCount = badges.filter(b => b.earned || g.earned.includes(b.id)).length
  const current = QUIZZES.find(q => !g.quizDone[q.id]) ?? null

  // 達成済みバッジを sticky に保存
  useEffect(() => {
    const ids = computeBadges(bases, items).filter(b => b.earned).map(b => b.id)
    setG(prev => { const merged = mergeEarned(prev, ids); if (merged !== prev) saveGame(merged); return merged })
  }, [bases, items])

  const already = checkedInToday(g)
  const doCheckIn = () => setG(prev => { const next = checkIn(prev); saveGame(next); return next })
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
            <p className="text-xs text-stone-500 mt-1">次のレベルまで あと {level.toNext}pt（備蓄の登録や達成で増えます）</p>
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
        <p className="text-xs text-stone-500 mb-2.5">家族で分担しよう（この端末に保存されます）</p>
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
                  {pick === current.answer ? '正解！ ' : 'おしい！ '}{current.explain}
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
