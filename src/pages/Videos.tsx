import { useState } from 'react'
import { Plus, Trash2, Play, Smartphone } from 'lucide-react'
import { useLocalList, youtubeId, thumbnailUrl, VIDEO_KEY, type VideoLink } from '../lib/localList'

export function Videos() {
  const [links, setLinks] = useLocalList<VideoLink>(VIDEO_KEY)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')

  const add = () => {
    if (!url.trim()) return
    const link: VideoLink = {
      id: Math.random().toString(36).slice(2, 9),
      title: title.trim() || url.trim(),
      url: url.trim(),
      note: note.trim(),
    }
    setLinks([...links, link])
    setTitle(''); setUrl(''); setNote(''); setAdding(false)
  }

  const remove = (id: string) => {
    if (!window.confirm('このリンクを削除しますか？')) return
    setLinks(links.filter(l => l.id !== id))
  }

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">

      <p className="text-sm text-stone-500 leading-relaxed">
        家族に見てほしい防災動画をためていく場所です。見つけたときに1本ずつ足していけば大丈夫です。
      </p>

      {links.length === 0 && !adding && (
        <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-8 text-center space-y-3">
          <Play size={26} className="mx-auto text-amber-300" />
          <p className="text-sm text-stone-400">まだ登録された動画はありません</p>
        </div>
      )}

      <div className="space-y-2">
        {links.map(l => {
          const vid = youtubeId(l.url)
          return (
            <div key={l.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden flex">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0">
                {vid ? (
                  <img src={thumbnailUrl(vid)} alt="" className="w-28 h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-28 h-full min-h-[70px] bg-orange-50 flex items-center justify-center">
                    <Play size={18} className="text-amber-300" />
                  </div>
                )}
              </a>
              <div className="flex-1 min-w-0 p-3 flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-sm hover:text-amber-600 transition-colors line-clamp-2"
                  >
                    {l.title}
                  </a>
                  {l.note && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{l.note}</p>}
                </div>
                <button
                  onClick={() => remove(l.id)}
                  aria-label="削除"
                  className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {adding ? (
        <section className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
          <h3 className="font-bold text-sm">動画を追加</h3>
          <label className="block text-xs text-stone-500">
            URL
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <label className="block text-xs text-stone-500">
            タイトル（空欄ならURLをそのまま表示します）
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例：家具の固定のしかた"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <label className="block text-xs text-stone-500">
            メモ
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="例：3分。家族みんなで見る"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => { setAdding(false); setTitle(''); setUrl(''); setNote('') }}
              className="flex-1 py-2.5 rounded-xl border border-orange-200 text-sm text-stone-500 font-bold"
            >
              キャンセル
            </button>
            <button
              onClick={add}
              disabled={!url.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-400 text-white text-sm font-bold disabled:bg-stone-200 disabled:text-stone-400 hover:bg-amber-500 transition-colors"
            >
              追加する
            </button>
          </div>
        </section>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-amber-300 text-amber-600 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-amber-50 transition-colors"
        >
          <Plus size={15} /> 動画を追加する
        </button>
      )}

      <p className="text-[11px] text-stone-400 leading-relaxed flex items-start gap-1.5">
        <Smartphone size={13} className="shrink-0 mt-0.5" />
        <span>
          動画リンクはこの端末の中だけに保存されます。別のスマホやパソコンには出てきません。家族全員で共有したい場合は言ってください、共有できるように作り替えます。
        </span>
      </p>
    </div>
  )
}
