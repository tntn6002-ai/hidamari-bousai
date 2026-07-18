export type ReqKey =
  | 'water'
  | 'food'
  | 'canned'
  | 'fruit_can'
  | 'retort'
  | 'veg_juice'
  | 'snack'
  | 'supplement'
  | 'health_drink'
  | 'toilet'
  | 'gas'
  | 'dogfood'
  | 'sheets'

export interface Base {
  id: string
  name: string
  tag: string
  adults: number
  dogs: number
  days: number
  interruptSwitch?: string
  lat?: number | null
  lon?: number | null
  floor?: number | null
  baseType?: 'home' | 'work' | null
  station?: string | null
  commuteNormal?: string | null
  commuteAlt?: string | null
  commuteWalk?: string | null
  stayPolicy?: string | null
}

export interface Item {
  id: string
  baseId: string
  name: string
  reqKey: ReqKey | 'other'
  qty: number
  unit: string
  expiry: string
  place: string
  url: string
}

export interface ItemDraft {
  id: string | null
  baseId: string
  name: string
  reqKey: ReqKey | 'other'
  qty: number | string
  unit: string
  expiry: string
  place: string
  url: string
}

export type TabId = 'home' | 'inv' | 'plan' | 'alert' | 'hazard'
