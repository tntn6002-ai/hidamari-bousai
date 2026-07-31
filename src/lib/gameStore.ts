// ゲーム進捗の端末内保存（localStorage）。ストリーク・獲得バッジ・担当・クイズ結果。
const KEY = 'hidamari-game-v1'

export interface GameState {
  earned: string[]                    // 一度でも獲得したバッジID（sticky）
  role: string | null                 // 自分の担当
  streakCount: number
  streakLast: string | null           // 最終チェックイン日（YYYY-M-D）
  quizDone: Record<string, boolean>   // 回答済みクイズ
  quizScore: number                   // 正解数
}

const EMPTY: GameState = { earned: [], role: null, streakCount: 0, streakLast: null, quizDone: {}, quizScore: 0 }

export function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...EMPTY }
}

export function saveGame(s: GameState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* ignore */ }
}

function dayKey(offset = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// 今日ぶんのチェックイン。昨日から連続なら+1、間が空いたら1にリセット。同日は据え置き。
export function checkIn(s: GameState): GameState {
  const today = dayKey(0)
  if (s.streakLast === today) return s
  const continued = s.streakLast === dayKey(-1)
  return { ...s, streakCount: continued ? s.streakCount + 1 : 1, streakLast: today }
}

export function checkedInToday(s: GameState): boolean {
  return s.streakLast === dayKey(0)
}

// 現在の達成バッジIDを sticky にマージ（一度取ったら消えない）
export function mergeEarned(s: GameState, ids: string[]): GameState {
  const set = new Set([...s.earned, ...ids])
  if (set.size === s.earned.length) return s
  return { ...s, earned: [...set] }
}
