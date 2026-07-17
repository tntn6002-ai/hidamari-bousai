import { supabase } from './supabase'
import type { Base, Item, ReqKey } from '../types'

// ── データ変換（Supabase snake_case ↔ フロント camelCase）──

export function dbToBase(row: Record<string, unknown>): Base {
  return {
    id: row.id as string,
    name: row.label as string,
    tag: (row.tag as string) || '',
    adults: row.adults as number,
    dogs: row.dogs as number,
    days: row.target_days as number,
    interruptSwitch: (row.interrupt_switch as string) || '',
  }
}

function baseToDb(base: Partial<Base>, householdId?: string) {
  return {
    ...(householdId !== undefined && { household_id: householdId }),
    ...(base.name !== undefined && { label: base.name }),
    ...(base.tag !== undefined && { tag: base.tag }),
    ...(base.adults !== undefined && { adults: base.adults }),
    ...(base.dogs !== undefined && { dogs: base.dogs }),
    ...(base.days !== undefined && { target_days: base.days }),
    ...(base.interruptSwitch !== undefined && { interrupt_switch: base.interruptSwitch }),
  }
}

export function dbToItem(row: Record<string, unknown>): Item {
  return {
    id: row.id as string,
    baseId: row.base_id as string,
    name: row.name as string,
    reqKey: (row.req_key as ReqKey | 'other') || 'other',
    qty: Number(row.qty) || 0,
    unit: (row.unit as string) || '',
    expiry: (row.expiry as string) || '',
    place: (row.place as string) || '',
    url: (row.product_url as string) || '',
  }
}

function itemToDb(item: Omit<Item, 'id'>) {
  return {
    base_id: item.baseId,
    name: item.name,
    req_key: item.reqKey,
    qty: item.qty,
    unit: item.unit || '',
    expiry: item.expiry || null,
    place: item.place || '',
    product_url: item.url || '',
  }
}

// ── 拠点 ─────────────────────────────────────────────────────

export async function fetchBases(householdId: string): Promise<Base[]> {
  const { data, error } = await supabase
    .from('bases')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(dbToBase)
}

export async function insertBase(base: Omit<Base, 'id'>, householdId: string): Promise<Base> {
  const { data, error } = await supabase
    .from('bases')
    .insert(baseToDb(base, householdId))
    .select()
    .single()
  if (error || !data) throw error ?? new Error('拠点の作成に失敗しました')
  return dbToBase(data)
}

export async function patchBase(id: string, patch: Partial<Base>): Promise<void> {
  const { error } = await supabase.from('bases').update(baseToDb(patch)).eq('id', id)
  if (error) throw error
}

// ── 在庫 ─────────────────────────────────────────────────────

export async function fetchItems(baseIds: string[]): Promise<Item[]> {
  if (!baseIds.length) return []
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .in('base_id', baseIds)
    .order('created_at')
  if (error) throw error
  return (data ?? []).map(dbToItem)
}

export async function insertItem(item: Omit<Item, 'id'>): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert(itemToDb(item))
    .select()
    .single()
  if (error || !data) throw error ?? new Error('在庫の作成に失敗しました')
  return dbToItem(data)
}

export async function patchItem(id: string, patch: Partial<Omit<Item, 'id' | 'baseId'>>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.name !== undefined) dbPatch.name = patch.name
  if (patch.reqKey !== undefined) dbPatch.req_key = patch.reqKey
  if (patch.qty !== undefined) dbPatch.qty = patch.qty
  if (patch.unit !== undefined) dbPatch.unit = patch.unit
  if (patch.expiry !== undefined) dbPatch.expiry = patch.expiry || null
  if (patch.place !== undefined) dbPatch.place = patch.place
  if (patch.url !== undefined) dbPatch.product_url = patch.url
  const { error } = await supabase.from('items').update(dbPatch).eq('id', id)
  if (error) throw error
}

export async function removeItem(id: string): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', id)
  if (error) throw error
}

// ── 初期拠点を世帯作成時に投入 ─────────────────────────────

export async function insertSeedBases(householdId: string): Promise<Base[]> {
  const seeds = [
    { label: '関西の自宅',  tag: '戸建て・犬1',    adults: 2, dogs: 1, target_days: 14, kind: 'home', household_id: householdId },
    { label: '長女宅',      tag: '東京・2階',       adults: 1, dogs: 0, target_days: 7,  kind: 'home', household_id: householdId },
    { label: '次女宅',      tag: '東京・2階・犬1',  adults: 2, dogs: 1, target_days: 7,  kind: 'home', household_id: householdId },
    { label: '三女宅',      tag: '川崎・1階',       adults: 2, dogs: 0, target_days: 7,  kind: 'home', household_id: householdId },
  ]
  const { data, error } = await supabase.from('bases').insert(seeds).select()
  if (error) throw error
  return (data ?? []).map(dbToBase)
}
