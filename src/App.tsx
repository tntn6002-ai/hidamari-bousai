import { useState, useEffect } from 'react'
import { Sun } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { ItemForm } from './components/ItemForm'
import { Home } from './pages/Home'
import { Inventory } from './pages/Inventory'
import { Plan } from './pages/Plan'
import { Alerts } from './pages/Alerts'
import { Hazard } from './pages/Hazard'
import { SignIn } from './pages/auth/SignIn'
import { Onboarding } from './pages/auth/Onboarding'
import { REQ, REQ_KEYS } from './lib/constants'
import { daysUntil, requiredQty, stockOf } from './lib/calculations'
import {
  fetchBases, fetchItems,
  patchBase, insertBase, insertItem, patchItem, removeItem,
} from './lib/db'
import type { Base, Item, ItemDraft, TabId, ReqKey } from './types'

function Loading({ label = '読み込み中…' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Sun size={40} className="text-amber-400" style={{ animation: 'spin 3s linear infinite' }} />
        <p className="text-sm text-stone-500">{label}</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function AppInner() {
  const { loading: authLoading, user, household } = useAuth()

  const [bases, setBases] = useState<Base[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [dbLoading, setDbLoading] = useState(true)
  const [saveState, setSaveState] = useState('')
  const [tab, setTab] = useState<TabId>('home')
  const [invBase, setInvBase] = useState('all')
  const [planBase, setPlanBase] = useState('')
  const [draft, setDraft] = useState<ItemDraft | null>(null)

  // Supabaseからデータ読み込み
  useEffect(() => {
    if (!household) return
    setDbLoading(true)
    fetchBases(household.id)
      .then(async loadedBases => {
        setBases(loadedBases)
        if (loadedBases[0]) setPlanBase(loadedBases[0].id)
        const loadedItems = await fetchItems(loadedBases.map(b => b.id))
        setItems(loadedItems)
      })
      .catch(console.error)
      .finally(() => setDbLoading(false))
  }, [household?.id])

  // アラートカウント
  const expiryAlertCount = items.filter(it => {
    const d = daysUntil(it.expiry)
    return d !== null && d <= 30
  }).length
  const shortageCount = bases.reduce((acc, b) =>
    acc + REQ_KEYS.filter(k => {
      const need = requiredQty(b, k as ReqKey)
      return need > 0 && stockOf(items, b.id, k as ReqKey) < need
    }).length, 0)
  const alertCount = expiryAlertCount + shortageCount

  // saveState表示ヘルパー
  const withSave = async (fn: () => Promise<void>) => {
    setSaveState('saving')
    try {
      await fn()
      setSaveState('saved')
      setTimeout(() => setSaveState(''), 1500)
    } catch {
      setSaveState('error')
    }
  }

  // 拠点追加
  const onAddBase = async (name: string, baseType: 'home' | 'work', adults: number, days: number) => {
    if (!household) return
    const newBase: Omit<Base, 'id'> = { name, tag: '', adults, dogs: 0, days, baseType }
    await withSave(async () => {
      const created = await insertBase(newBase, household.id)
      setBases(prev => [...prev, created])
      setPlanBase(created.id)
    })
  }

  // 拠点更新
  const onUpdateBase = (id: string, patch: Partial<Base>) => {
    setBases(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))
    withSave(() => patchBase(id, patch))
  }

  // 在庫：数量変更
  const onChangeQty = (id: string, delta: number) => {
    const item = items.find(it => it.id === id)
    if (!item) return
    const newQty = Math.max(0, item.qty + delta)
    setItems(prev => prev.map(it => it.id === id ? { ...it, qty: newQty } : it))
    withSave(() => patchItem(id, { qty: newQty }))
  }

  // 在庫：削除
  const onDeleteItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id))
    removeItem(id).catch(console.error)
  }

  // 在庫フォームを開く
  const openAdd = (preset: Partial<ItemDraft> = {}) => {
    setDraft({
      id: null,
      baseId: preset.baseId ?? bases[0]?.id ?? '',
      name: preset.name ?? '',
      reqKey: preset.reqKey ?? 'water',
      qty: preset.qty ?? '',
      unit: '',
      expiry: '',
      place: '',
      url: '',
    })
  }
  const openEdit = (item: Item) => setDraft({ ...item })

  // 在庫フォーム保存
  const saveDraft = async () => {
    if (!draft || !draft.name.trim()) return
    const base: Omit<Item, 'id'> = {
      baseId: draft.baseId,
      name: draft.name.trim(),
      reqKey: draft.reqKey,
      qty: Number(draft.qty) || 0,
      unit: draft.reqKey !== 'other' ? REQ[draft.reqKey as ReqKey]?.unit || '' : draft.unit,
      expiry: draft.expiry,
      place: draft.place,
      url: draft.url,
    }
    setDraft(null)
    await withSave(async () => {
      if (draft.id) {
        await patchItem(draft.id, base)
        setItems(prev => prev.map(it => it.id === draft.id ? { ...it, ...base } : it))
      } else {
        const created = await insertItem(base)
        setItems(prev => [...prev, created])
      }
    })
  }

  const onReset = async () => {
    if (!window.confirm('すべての在庫データを削除します。よろしいですか？')) return
    await Promise.all(items.map(it => removeItem(it.id)))
    setItems([])
  }

  // ── 表示分岐 ─────────────────────────────────────────────
  if (authLoading) return <Loading />
  if (!user) return <SignIn />
  if (!household) return <Onboarding />
  if (dbLoading) return <Loading label="備えを読み込んでいます…" />

  return (
    <Layout tab={tab} setTab={setTab} alertCount={alertCount} saveState={saveState}>
      {tab === 'home' && <Home bases={bases} items={items} setTab={setTab} />}
      {tab === 'inv' && (
        <Inventory
          bases={bases} items={items}
          invBase={invBase} setInvBase={setInvBase}
          onChangeQty={onChangeQty} onDeleteItem={onDeleteItem}
          openAdd={openAdd} openEdit={openEdit}
        />
      )}
      {tab === 'plan' && (
        <Plan
          bases={bases} items={items}
          planBase={planBase || bases[0]?.id || ''} setPlanBase={setPlanBase}
          onUpdateBase={onUpdateBase} onAddBase={onAddBase} openAdd={openAdd}
        />
      )}
      {tab === 'alert' && (
        <Alerts bases={bases} items={items} openAdd={openAdd} onReset={onReset} />
      )}
      {tab === 'hazard' && (
        <Hazard bases={bases} onUpdateBase={onUpdateBase} />
      )}
      {draft && (
        <ItemForm draft={draft} setDraft={setDraft} bases={bases} onSave={saveDraft} />
      )}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
