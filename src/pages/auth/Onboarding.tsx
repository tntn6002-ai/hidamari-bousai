import { useState } from 'react'
import { Sun, Home, Users, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

type Mode = 'choose' | 'create' | 'join'

function getInviteFromUrl(): string {
  const params = new URLSearchParams(window.location.search)
  return params.get('invite') ?? ''
}

export function Onboarding() {
  const { user, createHousehold, joinHousehold, signOut } = useAuth()
  const inviteFromUrl = getInviteFromUrl()
  const [mode, setMode] = useState<Mode>(inviteFromUrl ? 'join' : 'choose')
  const [displayName, setDisplayName] = useState('')
  const [householdName, setHouseholdName] = useState('')
  const [inviteToken, setInviteToken] = useState(inviteFromUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!householdName.trim() || !displayName.trim()) return
    setLoading(true)
    setError('')
    try {
      await createHousehold(householdName.trim(), displayName.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : '作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteToken.trim() || !displayName.trim()) return
    setLoading(true)
    setError('')
    try {
      await joinHousehold(inviteToken.trim(), displayName.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : '参加に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center mx-auto mb-4 shadow-md">
            <Sun size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-stone-800">ようこそ</h1>
          <p className="text-xs text-stone-500 mt-1">{user?.email}</p>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm text-stone-600 text-center mb-5">
              はじめに「世帯」を設定してください。
            </p>
            <button
              onClick={() => setMode('create')}
              className="w-full bg-white rounded-2xl border border-orange-100 p-5 flex items-center gap-4 hover:border-amber-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <Home size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-sm">新しい世帯を作る</p>
                <p className="text-xs text-stone-400 mt-0.5">最初の1人として世帯を作成し、家族を招待できます</p>
              </div>
            </button>

            <button
              onClick={() => setMode('join')}
              className="w-full bg-white rounded-2xl border border-orange-100 p-5 flex items-center gap-4 hover:border-amber-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Users size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-sm">招待から参加する</p>
                <p className="text-xs text-stone-400 mt-0.5">家族から受け取った招待コードで既存の世帯に参加します</p>
              </div>
            </button>

            <button
              onClick={signOut}
              className="w-full py-2 text-xs text-stone-400 flex items-center justify-center gap-1 hover:text-stone-600 mt-2"
            >
              <LogOut size={12} /> サインアウト
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6">
            <button onClick={() => { setMode('choose'); setError('') }} className="text-xs text-stone-400 mb-4 hover:text-stone-600">← 戻る</button>
            <h2 className="font-bold text-base mb-4">新しい世帯を作る</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <label className="text-xs text-stone-500">
                世帯の名前（例：田中家）
                <input
                  value={householdName}
                  onChange={e => setHouseholdName(e.target.value)}
                  placeholder="田中家"
                  required
                  autoFocus
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </label>
              <label className="text-xs text-stone-500">
                あなたの表示名（例：お母さん）
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="お母さん"
                  required
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !householdName.trim() || !displayName.trim()}
                className="w-full py-3 rounded-2xl bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 transition-colors disabled:bg-stone-200 disabled:text-stone-400"
              >
                {loading ? '作成中…' : '世帯を作成する'}
              </button>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6">
            <button onClick={() => { setMode('choose'); setError('') }} className="text-xs text-stone-400 mb-4 hover:text-stone-600">← 戻る</button>
            <h2 className="font-bold text-base mb-4">招待から参加する</h2>
            <form onSubmit={handleJoin} className="space-y-3">
              <label className="text-xs text-stone-500">
                招待コード（家族から受け取ったコード）
                <input
                  value={inviteToken}
                  onChange={e => setInviteToken(e.target.value)}
                  placeholder="招待コードを入力"
                  required
                  autoFocus
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 font-mono"
                />
              </label>
              <label className="text-xs text-stone-500">
                あなたの表示名（例：長女）
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="長女"
                  required
                  className="mt-1 w-full px-4 py-3 rounded-2xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </label>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !inviteToken.trim() || !displayName.trim()}
                className="w-full py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors disabled:bg-stone-200 disabled:text-stone-400"
              >
                {loading ? '参加中…' : '世帯に参加する'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  )
}
