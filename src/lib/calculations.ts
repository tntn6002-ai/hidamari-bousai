import { REQ, REQ_KEYS } from './constants'
import type { Base, Item, ReqKey } from '../types'

export const uid = () => Math.random().toString(36).slice(2, 9)

export const todayStr = () => new Date().toISOString().slice(0, 10)

export const daysUntil = (dateStr: string): number | null => {
  if (!dateStr) return null
  const d = new Date(dateStr + 'T00:00:00')
  return Math.floor((d.getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
}

export const amazonSearch = (q: string) =>
  `https://www.amazon.co.jp/s?k=${encodeURIComponent(q)}`

export const dailyNeed = (base: Base, key: ReqKey): number => {
  const r = REQ[key]
  return base.adults * r.perAdult + base.dogs * r.perDog
}

export const requiredQty = (base: Base, key: ReqKey): number => {
  return Math.ceil(dailyNeed(base, key) * base.days)
}

export const stockOf = (items: Item[], baseId: string, key: ReqKey | 'other'): number =>
  items
    .filter(it => it.baseId === baseId && it.reqKey === key)
    .reduce((s, it) => s + (Number(it.qty) || 0), 0)

export const supplyDays = (items: Item[], base: Base, key: ReqKey): number | null => {
  const per = dailyNeed(base, key)
  if (per <= 0) return null
  return stockOf(items, base.id, key) / per
}

export const baseSummary = (items: Item[], base: Base) => {
  const coreKeys = REQ_KEYS.filter(k => REQ[k].core && dailyNeed(base, k) > 0)
  const dayVals = coreKeys.map(k => supplyDays(items, base, k) ?? 0)
  const minDays = dayVals.length ? Math.min(...dayVals) : 0
  return { minDays, pct: base.days > 0 ? minDays / base.days : 0 }
}
