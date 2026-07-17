import type { Base, ReqKey } from '../types'

export const REQ: Record<ReqKey, {
  label: string
  unit: string
  perAdult: number
  perDog: number
  core: boolean
  q: string
}> = {
  water:   { label: '飲料水',       unit: 'L',    perAdult: 3,    perDog: 0.5, core: true,  q: '保存水 2L 長期保存 防災' },
  food:    { label: '主食',         unit: '食',   perAdult: 3,    perDog: 0,   core: true,  q: 'アルファ米 非常食 セット' },
  toilet:  { label: '携帯トイレ',   unit: '回分', perAdult: 5,    perDog: 0,   core: true,  q: '携帯トイレ 防災 50回' },
  gas:     { label: 'カセットボンベ', unit: '本',  perAdult: 0.45, perDog: 0,   core: false, q: 'カセットボンベ 12本' },
  dogfood: { label: '犬フード',     unit: '日分', perAdult: 0,    perDog: 1,   core: false, q: 'ドッグフード 長期保存' },
  sheets:  { label: 'ペットシーツ', unit: '枚',   perAdult: 0,    perDog: 3,   core: false, q: 'ペットシーツ レギュラー' },
}

export const REQ_KEYS = Object.keys(REQ) as ReqKey[]

export const SEED_BASES: Base[] = [
  { id: 'b1', name: '関西の自宅',  tag: '戸建て・犬1',      adults: 2, dogs: 1, days: 14 },
  { id: 'b2', name: '長女宅',      tag: '東京・2階',        adults: 1, dogs: 0, days: 7  },
  { id: 'b3', name: '次女宅',      tag: '東京・2階・犬1',   adults: 2, dogs: 1, days: 7  },
  { id: 'b4', name: '三女宅',      tag: '川崎・1階',        adults: 2, dogs: 0, days: 7  },
]

export const STORAGE_KEY = 'hidamari-bousai-v1'
