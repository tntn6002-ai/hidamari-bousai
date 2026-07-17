import type { Base, Item } from '../types'
import { STORAGE_KEY } from './constants'

interface AppData {
  bases: Base[]
  items: Item[]
}

export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppData
  } catch {
    return null
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY)
}
