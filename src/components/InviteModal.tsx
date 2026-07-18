import { useState } from 'react'
import { X, Copy, Check, Users, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface InviteModalProps {
  onClose: () => void
}

const APP_URL = 'https://hidamari-bousai.netlify.app'

export function InviteModal({ onClose }: InviteModalProps) {
  const { generateInvite } = useAuth()
  const [familyLink, setFamilyLink] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copiedFamily, setCopiedFamily] = useState(false)
  const [copiedFriend, setCopiedFriend] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    setGenerating(true)
    setError('')
    try {
      const token = await generateInvite()
      setFamilyLink(`${APP_URL}?invite=${token}`)
    } catch {
      setError('招待リンクの生成に失敗しました')
    } finally {
      setGenerating(false)
    }
  }

  const copy = async (text: string, type: 'family' | 'friend') => {
    await navigator.clipboard.writeText(text)
    if (type === 'family') {
      setCopiedFamily(true)
      setTimeout(() => setCopiedFamily(false), 2000)
    } else {
      setCopiedFriend(true)
      setTimeout(() => setCopiedFriend(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-30 flex items-end lg:items-center justify-center p-0 lg:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-t-3xl lg:rounded-3xl p-5 space-y-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">招待する</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1"><X size={18} /></button>
        </div>

        {/* 家族招待 */}
        <section className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-emerald-600" />
            <h3 className="font-bold text-sm text-emerald-800">家族を招待（データを共有）</h3>
          </div>
          <p className="text-xs text-emerald-700">同じ世帯として参加します。在庫・計画データをすべて共有できます。リンクは7日間有効です。</p>

          {!familyLink ? (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 transition-colors"
            >
              {generating ? '生成中…' : '招待リンクを生成する'}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="bg-white rounded-xl border border-emerald-200 px-3 py-2 text-xs text-stone-600 break-all font-mono">
                {familyLink}
              </div>
              <button
                onClick={() => copy(familyLink, 'family')}
                className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-sm hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                {copiedFamily ? <><Check size={14} /> コピーしました</> : <><Copy size={14} /> リンクをコピー</>}
              </button>
              <button
                onClick={handleGenerate}
                className="w-full py-2 text-xs text-emerald-600 hover:text-emerald-700"
              >
                別のリンクを生成する
              </button>
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
        </section>

        {/* 友人招待 */}
        <section className="bg-amber-50 rounded-2xl border border-amber-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus size={16} className="text-amber-600" />
            <h3 className="font-bold text-sm text-amber-800">友人に共有（各自で世帯を作る）</h3>
          </div>
          <p className="text-xs text-amber-700">友人は自分の世帯を作って使います。データは完全に独立します。アプリのURLをそのまま共有するだけでOKです。</p>

          <div className="bg-white rounded-xl border border-amber-200 px-3 py-2 text-xs text-stone-600 font-mono break-all">
            {APP_URL}
          </div>
          <button
            onClick={() => copy(APP_URL, 'friend')}
            className="w-full py-2.5 rounded-xl bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"
          >
            {copiedFriend ? <><Check size={14} /> コピーしました</> : <><Copy size={14} /> URLをコピー</>}
          </button>
        </section>
      </div>
    </div>
  )
}
