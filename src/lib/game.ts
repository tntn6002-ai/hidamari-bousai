import type { Base, Item } from '../types'
import { baseSummary, daysUntil, requiredQty, stockOf } from './calculations'

// ── 集計ヘルパー ─────────────────────────────────────────────
export function readyBaseCount(bases: Base[], items: Item[]): number {
  return bases.filter(b => baseSummary(items, b).pct >= 1).length
}
export function expiredCount(items: Item[]): number {
  return items.filter(it => { const d = daysUntil(it.expiry); return d !== null && d < 0 }).length
}
export function expiringSoonCount(items: Item[]): number {
  return items.filter(it => { const d = daysUntil(it.expiry); return d !== null && d >= 0 && d <= 30 }).length
}
export function withExpiryCount(items: Item[]): number {
  return items.filter(it => daysUntil(it.expiry) !== null).length
}

// ── 備えレベル ───────────────────────────────────────────────
const LEVEL_TITLES = ['はじめて', 'みならい', 'そなえびと', '防災ジュニア', '防災マイスター', '防災の達人', 'ひだまり博士']
const PER_LEVEL = 20

export function computeLevel(bases: Base[], items: Item[]) {
  const ready = readyBaseCount(bases, items)
  const points = items.length * 2 + ready * 12 + withExpiryCount(items)
  const level = Math.floor(points / PER_LEVEL) + 1
  const into = points % PER_LEVEL
  const pct = Math.round((into / PER_LEVEL) * 100)
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
  return { level, title, pct, toNext: PER_LEVEL - into, points }
}

// ── バッジ（実績）─────────────────────────────────────────────
export interface Badge { id: string; emoji: string; label: string; desc: string; earned: boolean }

export function computeBadges(bases: Base[], items: Item[]): Badge[] {
  const ready = readyBaseCount(bases, items)
  const waterOk = bases.some(b => requiredQty(b, 'water') > 0 && stockOf(items, b.id, 'water') >= requiredQty(b, 'water'))
  return [
    { id: 'first',    emoji: '🌱', label: 'はじめの一歩', desc: '備蓄を1つ登録した',          earned: items.length >= 1 },
    { id: 'ten',      emoji: '📦', label: 'ストック名人', desc: '備蓄を10品そろえた',          earned: items.length >= 10 },
    { id: 'ready1',   emoji: '✅', label: '準備完了',     desc: 'どこかの家が目標達成',        earned: ready >= 1 },
    { id: 'allready', emoji: '🏅', label: '家族まるごと', desc: 'すべての家が目標達成',        earned: bases.length > 0 && ready === bases.length },
    { id: 'water',    emoji: '💧', label: '水マスター',   desc: 'どこかの家で水が目標達成',    earned: waterOk },
    { id: 'noexp',    emoji: '⏰', label: '期限バッチリ', desc: '期限切れがゼロ（期限入力あり）', earned: withExpiryCount(items) > 0 && expiredCount(items) === 0 },
    { id: 'expset',   emoji: '📅', label: '記録じょうず', desc: '賞味期限を5品に登録',          earned: withExpiryCount(items) >= 5 },
  ]
}

// ── 今週のミッション（データから自動判定）──────────────────────
export interface Mission { id: string; label: string; done: boolean; hint: string }

export function weeklyMissions(bases: Base[], items: Item[]): Mission[] {
  const soon = expiringSoonCount(items)
  const under = bases.filter(b => baseSummary(items, b).pct < 1).length
  return [
    { id: 'add5', label: '備蓄を5品まで増やそう',       done: items.length >= 5, hint: `いま ${items.length}/5` },
    { id: 'exp',  label: '期限が近い備蓄を入れ替えよう', done: soon === 0,        hint: soon > 0 ? `対象 ${soon}件` : 'クリア！' },
    { id: 'fill', label: '足りない家に備蓄を足そう',     done: under === 0,       hint: under > 0 ? `あと ${under}軒` : 'クリア！' },
  ]
}

// ── 担当（役割）の選択肢 ─────────────────────────────────────
export const ROLES = ['水チェック係', '食料担当', 'トイレ担当', 'ペット担当', '情報係']

// ── 防災ミニクイズ ───────────────────────────────────────────
export interface Quiz { id: string; q: string; choices: string[]; answer: number; explain: string }

export const QUIZZES: Quiz[] = [
  { id: 'q1', q: '大人1人が1日に必要な飲料水の目安は？', choices: ['約0.5L', '約1L', '約3L'], answer: 2,
    explain: '飲料と調理をあわせて1日およそ3Lが目安です。' },
  { id: 'q2', q: '大地震の直後、マンションでトイレを流していい？', choices: ['すぐ流してOK', '排水管の点検までは流さない', '水を足せばOK'], answer: 1,
    explain: '配管が壊れていると階下へ漏れる恐れが。点検が済むまでは携帯トイレを使います。' },
  { id: 'q3', q: '「ローリングストック」とは？', choices: ['非常食を一度に大量購入', '普段の食品を使いながら買い足す', '冷凍庫で保存する'], answer: 1,
    explain: '日常的に食べて→補充を回すことで、いつも新しい備蓄を保てます。' },
  { id: 'q4', q: '携帯トイレ、大人1人1日あたりの目安回数は？', choices: ['1回', '5回', '20回'], answer: 1,
    explain: '1日およそ5回が目安。日数×人数分をそろえましょう。' },
  { id: 'q5', q: '在宅避難でまず目指したい備蓄期間は？', choices: ['1日', '3日〜1週間', '1年'], answer: 1,
    explain: '最低3日、できれば1週間分が目安です。' },
]
