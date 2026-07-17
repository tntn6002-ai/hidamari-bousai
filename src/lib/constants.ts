import type { Base, ReqKey } from '../types'

// 東京都「日常備蓄推進リーフレット」令和7年10月版 4人家族3日分 + 内閣府ガイドライン準拠
export const REQ: Record<ReqKey, {
  label: string
  unit: string
  perAdult: number
  perDog: number
  core: boolean   // trueのみ「在宅避難◯日分」計算に使用
  group: 'water' | 'food' | 'side' | 'toilet' | 'energy' | 'pet'
  q: string
}> = {
  // ── 水 ──────────────────────────────────────────────────────
  water: {
    label: '飲料水',
    unit: 'L',
    perAdult: 3,
    perDog: 0.5,
    core: true,
    group: 'water',
    q: '保存水 2L 長期保存 防災',
  },

  // ── 主食（食数で管理）────────────────────────────────────────
  food: {
    label: '主食（ご飯・めん類）',
    unit: '食',
    perAdult: 3,
    perDog: 0,
    core: true,
    group: 'food',
    q: 'レトルトご飯 アルファ米 非常食',
  },

  // ── 副食・補助食品（東京都リーフレット準拠）──────────────────
  canned: {
    label: '缶詰（魚・肉・野菜）',
    unit: '缶',
    perAdult: 0.75,
    perDog: 0,
    core: false,
    group: 'side',
    q: 'さば缶 ツナ缶 防災 備蓄',
  },
  fruit_can: {
    label: '果物缶詰',
    unit: '缶',
    perAdult: 0.25,
    perDog: 0,
    core: false,
    group: 'side',
    q: '果物缶詰 みかん缶 桃缶',
  },
  retort: {
    label: 'レトルト食品',
    unit: '個',
    perAdult: 0.75,
    perDog: 0,
    core: false,
    group: 'side',
    q: 'レトルト食品 カレー シチュー 備蓄',
  },
  veg_juice: {
    label: '野菜ジュース',
    unit: '本',
    perAdult: 0.75,
    perDog: 0,
    core: false,
    group: 'side',
    q: '野菜ジュース 備蓄 長期保存',
  },
  snack: {
    label: 'チーズ・プロテインバー等',
    unit: '個',
    perAdult: 1,
    perDog: 0,
    core: false,
    group: 'side',
    q: 'プロテインバー チーズ 保存食',
  },
  supplement: {
    label: '栄養補助食品',
    unit: '個',
    perAdult: 0.75,
    perDog: 0,
    core: false,
    group: 'side',
    q: '栄養補助食品 カロリーメイト 備蓄',
  },
  health_drink: {
    label: '健康飲料粉末・飲み物',
    unit: '袋',
    perAdult: 0.75,
    perDog: 0,
    core: false,
    group: 'side',
    q: '健康飲料粉末 スポーツドリンク 粉末',
  },

  // ── トイレ ──────────────────────────────────────────────────
  toilet: {
    label: '携帯トイレ',
    unit: '回分',
    perAdult: 5,
    perDog: 0,
    core: true,
    group: 'toilet',
    q: '携帯トイレ 防災 50回',
  },

  // ── エネルギー ───────────────────────────────────────────────
  gas: {
    label: 'カセットボンベ',
    unit: '本',
    perAdult: 0.67,
    perDog: 0,
    core: false,
    group: 'energy',
    q: 'カセットボンベ 12本',
  },

  // ── ペット ───────────────────────────────────────────────────
  dogfood: {
    label: '犬フード',
    unit: '日分',
    perAdult: 0,
    perDog: 1,
    core: false,
    group: 'pet',
    q: 'ドッグフード 長期保存',
  },
  sheets: {
    label: 'ペットシーツ',
    unit: '枚',
    perAdult: 0,
    perDog: 3,
    core: false,
    group: 'pet',
    q: 'ペットシーツ レギュラー',
  },
}

export const REQ_KEYS = Object.keys(REQ) as ReqKey[]

export const REQ_GROUPS: { id: string; label: string }[] = [
  { id: 'water',  label: '水' },
  { id: 'food',   label: '主食' },
  { id: 'side',   label: '副食・補助食品' },
  { id: 'toilet', label: 'トイレ' },
  { id: 'energy', label: 'エネルギー' },
  { id: 'pet',    label: 'ペット' },
]

export const SEED_BASES: Base[] = [
  { id: 'b1', name: '関西の自宅',  tag: '戸建て・犬1',      adults: 2, dogs: 1, days: 14 },
  { id: 'b2', name: '長女宅',      tag: '東京・2階',        adults: 1, dogs: 0, days: 7  },
  { id: 'b3', name: '次女宅',      tag: '東京・2階・犬1',   adults: 2, dogs: 1, days: 7  },
  { id: 'b4', name: '三女宅',      tag: '川崎・1階',        adults: 2, dogs: 0, days: 7  },
]

export const STORAGE_KEY = 'hidamari-bousai-v1'
