import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

/** 開きっぱなしのときも、1時間ごとに新しい版が出ていないか見に行く */
const CHECK_INTERVAL_MS = 60 * 60 * 1000

interface UpdateBannerProps {
  onUpdate: () => void
  onDismiss: () => void
}

/** 表示だけを担当する。状態を持たないので単体で確認できる。 */
export function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:inset-x-auto lg:right-4 lg:bottom-4 lg:w-80 lg:p-0">
      <div className="mx-auto max-w-md bg-white rounded-2xl shadow-lg border border-amber-200 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <RefreshCw size={17} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">新しい版があります</p>
          <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
            更新すると最新の内容になります。入力したデータはそのまま残ります。
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={onUpdate}
              className="flex-1 py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors"
            >
              今すぐ更新
            </button>
            <button
              onClick={onDismiss}
              className="px-3 py-2 rounded-xl border border-orange-200 text-sm text-stone-500 font-bold hover:bg-orange-50 transition-colors"
            >
              あとで
            </button>
          </div>
        </div>
        <button
          onClick={onDismiss}
          aria-label="閉じる"
          className="p-1 text-stone-300 hover:text-stone-500 shrink-0"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

/** Service Worker を監視して、新しい版が待機状態になったらバナーを出す。 */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return
      setInterval(() => { registration.update().catch(() => {}) }, CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null

  return (
    <UpdateBanner
      onUpdate={() => updateServiceWorker(true)}
      onDismiss={() => setNeedRefresh(false)}
    />
  )
}
