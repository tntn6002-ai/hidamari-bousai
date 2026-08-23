import { useState } from 'react'
import { Plus, Trash2, Play, Lock, Globe, Pencil, Eye, EyeOff, X } from 'lucide-react'
import { useLinks } from '../contexts/LinksContext'
import { youtubeId, thumbnailUrl, type CuratedLink } from '../lib/links'

function Thumb({ url, size = 'md' }: { url: string; size?: 'md' | 'sm' }) {
  const vid = youtubeId(url)
  const cls = size === 'sm' ? 'w-20 h-12' : 'w-28 h-[70px]'
  if (!vid) {
    return (
      <span className={`${cls} rounded-lg bg-orange-50 flex items-center justify-center shrink-0`}>
        <Play size={16} className="text-amber-300" />
      </span>
    )
  }
  return <img src={thumbnailUrl(vid)} alt="" className={`${cls} object-cover rounded-lg shrink-0`} loading="lazy" />
}

interface FormValues { title: string; url: string; note: string }

function LinkForm({
  initial, submitLabel, onSubmit, onCancel,
}: {
  initial?: FormValues
  submitLabel: string
  onSubmit: (v: FormValues) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!url.trim()) return
    setBusy(true)
    setErr('')
    try {
      await onSubmit({ title: title.trim() || url.trim(), url: url.trim(), note: note.trim() })
    } catch (e) {
      setErr(e instanceof Error ? e.message : '保存に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full px-3 py-2 rounded-xl border border-orange-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300'

  return (
    <div className="space-y-3">
      <label className="block text-xs text-stone-500">
        URL
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={field} />
      </label>
      <label className="block text-xs text-stone-500">
        タイトル
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="例：家具の固定のしかた" className={field} />
      </label>
      <label className="block text-xs text-stone-500">
        メモ
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="例：3分。家族みんなで見る" className={field} />
      </label>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-orange-200 text-sm text-stone-500 font-bold">
          キャンセル
        </button>
        <button
          onClick={submit}
          disabled={!url.trim() || busy}
          className="flex-1 py-2.5 rounded-xl bg-amber-400 text-white text-sm font-bold disabled:bg-stone-200 disabled:text-stone-400 hover:bg-amber-500 transition-colors"
        >
          {busy ? '保存中…' : submitLabel}
        </button>
      </div>
    </div>
  )
}

function CuratedRow({ link }: { link: CuratedLink }) {
  const { isCurator, editCurated, deleteCurated } = useLinks()
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
        <h3 className="font-bold text-sm">おすすめを編集</h3>
        <LinkForm
          initial={{ title: link.title, url: link.url, note: link.note }}
          submitLabel="保存する"
          onCancel={() => setEditing(false)}
          onSubmit={async v => { await editCurated(link.id, v); setEditing(false) }}
        />
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden flex ${link.published ? 'border-orange-100' : 'border-dashed border-stone-300'}`}>
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-3 pr-0">
        <Thumb url={link.url} />
      </a>
      <div className="flex-1 min-w-0 p-3 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm hover:text-amber-600 transition-colors line-clamp-2">
            {link.title}
          </a>
          {link.note && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{link.note}</p>}
          {!link.published && (
            <span className="inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 font-bold">
              下書き（他の人には見えません）
            </span>
          )}
        </div>
        {isCurator && (
          <div className="flex flex-col gap-1 shrink-0">
            <button onClick={() => setEditing(true)} aria-label="編集" className="p-1.5 rounded-lg text-stone-300 hover:text-amber-500 hover:bg-orange-50 transition-colors">
              <Pencil size={14} />
            </button>
            <button
              onClick={() => editCurated(link.id, { published: !link.published })}
              aria-label={link.published ? '下書きに戻す' : '公開する'}
              className="p-1.5 rounded-lg text-stone-300 hover:text-amber-500 hover:bg-orange-50 transition-colors"
            >
              {link.published ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
            <button
              onClick={() => {
                if (window.confirm(`「${link.title}」を全員の画面から削除します。よろしいですか？`)) deleteCurated(link.id)
              }}
              aria-label="削除"
              className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Links() {
  const { curated, mine, isCurator, loading, error, addCurated, addMine, deleteMine } = useLinks()
  const [addingCurated, setAddingCurated] = useState(false)
  const [addingMine, setAddingMine] = useState(false)

  const visibleCurated = curated.filter(c => c.published || isCurator)

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-6">

      {error && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-xs text-amber-800 leading-relaxed">
          {error}。通信状況を確認してください。
        </div>
      )}

      {/* ── ベースデータ ───────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Globe size={15} className="text-amber-500 shrink-0" />
          <h2 className="font-bold text-sm flex-1">ひだまりのおすすめ</h2>
          {isCurator && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold shrink-0">
              編集できます
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 leading-relaxed px-1">
          {isCurator
            ? 'ここに入れたものは、このアプリを使っている全員の画面に出ます。個人が特定される情報は入れないでください。'
            : '運営が選んだ、見ておきたい動画とリンクです。更新されると自動で増えます。'}
        </p>

        {loading ? (
          <div className="bg-white rounded-2xl border border-orange-100 p-6 text-center text-sm text-stone-400">
            読み込み中…
          </div>
        ) : visibleCurated.length === 0 && !addingCurated ? (
          <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-6 text-center text-sm text-stone-400">
            まだおすすめはありません
          </div>
        ) : (
          <div className="space-y-2">
            {visibleCurated.map(c => <CuratedRow key={c.id} link={c} />)}
          </div>
        )}

        {isCurator && (addingCurated ? (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">おすすめに追加</h3>
              <button onClick={() => setAddingCurated(false)} className="p-1 text-stone-400"><X size={15} /></button>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              保存した時点で、全ユーザーの画面に出ます。
            </p>
            <LinkForm
              submitLabel="全員に公開する"
              onCancel={() => setAddingCurated(false)}
              onSubmit={async v => {
                await addCurated({ ...v, kind: youtubeId(v.url) ? 'video' : 'link', sortOrder: curated.length, published: true })
                setAddingCurated(false)
              }}
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingCurated(true)}
            className="w-full py-2.5 rounded-2xl border border-dashed border-amber-300 text-amber-600 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-amber-50 transition-colors"
          >
            <Plus size={15} /> おすすめを追加する（全員に公開）
          </button>
        ))}
      </section>

      {/* ── 個人のリンク ───────────────────────── */}
      <section className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <Lock size={15} className="text-stone-400 shrink-0" />
          <h2 className="font-bold text-sm flex-1">自分のメモ</h2>
        </div>
        <p className="text-xs text-stone-500 leading-relaxed px-1">
          ここに入れたものは<strong className="text-stone-700">あなたにしか見えません</strong>。家族にも運営にも共有されません。同じアカウントなら、スマホでもパソコンでも同じものが出ます。
        </p>

        {mine.length === 0 && !addingMine ? (
          <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-6 text-center text-sm text-stone-400">
            まだ登録はありません
          </div>
        ) : (
          <div className="space-y-2">
            {mine.map(l => (
              <div key={l.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden flex">
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="shrink-0 p-3 pr-0">
                  <Thumb url={l.url} />
                </a>
                <div className="flex-1 min-w-0 p-3 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-bold text-sm hover:text-amber-600 transition-colors line-clamp-2">
                      {l.title}
                    </a>
                    {l.note && <p className="text-xs text-stone-500 mt-1 leading-relaxed">{l.note}</p>}
                  </div>
                  <button
                    onClick={() => { if (window.confirm('このリンクを削除しますか？')) deleteMine(l.id) }}
                    aria-label="削除"
                    className="p-1.5 rounded-lg text-stone-300 hover:text-red-500 hover:bg-red-50 shrink-0 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {addingMine ? (
          <div className="bg-white rounded-2xl border border-orange-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">自分のメモに追加</h3>
              <button onClick={() => setAddingMine(false)} className="p-1 text-stone-400"><X size={15} /></button>
            </div>
            <LinkForm
              submitLabel="追加する"
              onCancel={() => setAddingMine(false)}
              onSubmit={async v => { await addMine(v); setAddingMine(false) }}
            />
          </div>
        ) : (
          <button
            onClick={() => setAddingMine(true)}
            className="w-full py-2.5 rounded-2xl border border-dashed border-stone-300 text-stone-500 text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-stone-50 transition-colors"
          >
            <Plus size={15} /> 自分用に追加する
          </button>
        )}
      </section>
    </div>
  )
}
