import { useState } from 'react'
import { Sun, Mail } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function SignIn() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await signIn(email.trim())
      setSent(true)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`送信に失敗しました: ${msg}`)
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
          <h1 className="text-2xl font-bold text-stone-800">ひだまり防災ボード</h1>
          <p className="text-sm text-stone-500 mt-1">家族の在宅避難を支える防災アプリ</p>
        </div>

        {!sent ? (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6">
            <h2 className="font-bold text-base mb-1">サインイン</h2>
            <p className="text-xs text-stone-500 mb-5 leading-relaxed">
              メールアドレスを入力すると、ログインリンクを送ります。パスワードは不要です。
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="メールアドレス"
                required
                autoFocus
                inputMode="email"
                className="w-full px-4 py-3 rounded-2xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="w-full py-3 rounded-2xl bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 active:bg-amber-500 transition-colors disabled:bg-stone-200 disabled:text-stone-400 flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                {loading ? '送信中…' : 'ログインリンクを送る'}
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 text-center">
            <div className="text-5xl mb-4">📬</div>
            <h2 className="font-bold text-base mb-2">メールを確認してください</h2>
            <p className="text-sm text-stone-500 leading-relaxed">
              <span className="font-semibold text-stone-700">{email}</span><br />
              にログインリンクを送りました。<br />
              メールを開いてリンクをタップしてください。
            </p>
            <p className="text-xs text-stone-400 mt-4">
              ※届かない場合は迷惑メールフォルダも確認してください
            </p>
            <button
              onClick={() => { setSent(false); setError('') }}
              className="mt-4 text-xs text-amber-600 hover:text-amber-700 underline"
            >
              メールアドレスを変更する
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
