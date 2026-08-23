import { useEffect, useState } from 'react'
import { MapPin, Navigation, Star, Building2, Home, Info, ExternalLink } from 'lucide-react'
import {
  SHELTER_LAYERS, fetchShelters, formatDistance, routeUrl, walkMinutes,
  type Shelter,
} from '../lib/shelters'
import { useLocalSet } from '../lib/localList'
import type { Base } from '../types'

interface SheltersProps {
  bases: Base[]
  setTab: (t: 'hazard') => void
}

export function Shelters({ bases, setTab }: SheltersProps) {
  const [activeBase, setActiveBase] = useState(bases[0]?.id || '')
  const [layer, setLayer] = useState(SHELTER_LAYERS[0].id)
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [starred, toggleStar] = useLocalSet('hidamari-starred-shelters')

  const b = bases.find(x => x.id === activeBase) || bases[0]

  useEffect(() => {
    if (!b?.lat || !b?.lon) {
      setShelters([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError('')
    fetchShelters(b.lat, b.lon, layer)
      .then(list => {
        if (cancelled) return
        setShelters(list)
        if (!list.length) setError('この地域のデータが見つかりませんでした。災害の種類を変えて試してください。')
      })
      .catch(() => !cancelled && setError('避難所データを取得できませんでした。通信状況を確認してください。'))
      .finally(() => !cancelled && setLoading(false))
    return () => { cancelled = true }
  }, [b?.id, b?.lat, b?.lon, layer])

  if (!b) return null

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">

      {/* 拠点選択 */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
        {bases.map(x => (
          <button
            key={x.id}
            onClick={() => setActiveBase(x.id)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border shrink-0 transition-colors flex items-center gap-1 ${
              activeBase === x.id
                ? 'bg-amber-400 border-amber-400 text-white font-semibold'
                : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
            }`}
          >
            {x.baseType === 'work' ? <Building2 size={10} /> : <Home size={10} />}
            {x.name}
          </button>
        ))}
      </div>

      {/* 場所未設定 */}
      {!b.lat || !b.lon ? (
        <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-8 text-center space-y-3">
          <MapPin size={26} className="mx-auto text-amber-300" />
          <p className="text-sm text-stone-500">{b.name}の場所がまだ設定されていません</p>
          <button
            onClick={() => setTab('hazard')}
            className="px-4 py-2 rounded-xl bg-amber-400 text-white text-sm font-bold hover:bg-amber-500 transition-colors"
          >
            ハザードで場所を設定する
          </button>
        </div>
      ) : (
        <>
          {/* 災害の種類 */}
          <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
            <h2 className="font-bold text-sm">どの災害から逃げるか</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              避難場所は災害の種類ごとに指定されています。地震で使える場所が、洪水では使えないこともあります。
            </p>
            <div className="flex flex-wrap gap-2">
              {SHELTER_LAYERS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setLayer(l.id)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                    layer === l.id
                      ? 'bg-amber-400 border-amber-400 text-white font-bold'
                      : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
                  }`}
                >
                  {l.short}
                </button>
              ))}
            </div>
          </section>

          {/* 一覧 */}
          {loading && (
            <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center text-sm text-stone-400">
              避難場所を探しています…
            </div>
          )}

          {error && !loading && (
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-xs text-amber-800 leading-relaxed">
              {error}
            </div>
          )}

          {!loading && shelters.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-baseline justify-between px-1">
                <h2 className="font-bold text-sm">{b.name}から近い順</h2>
                <span className="text-[11px] text-stone-400">{shelters.length}件</span>
              </div>
              {shelters.map(s => {
                const key = `${s.name}@${s.lat},${s.lon}`
                const isStarred = starred.has(key)
                return (
                  <div key={key} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm">{s.name}</h3>
                          {isStarred && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                              第一避難先
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">{s.address}</p>
                        <p className="text-xs text-amber-700 font-semibold mt-1.5 tabular-nums">
                          約{formatDistance(s.distance)}・徒歩{walkMinutes(s.distance)}分
                          <span className="text-stone-400 font-normal ml-1">（直線距離の目安）</span>
                        </p>
                        {s.disasters.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {s.disasters.map(d => (
                              <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 border border-orange-200 text-amber-700">
                                {d}
                              </span>
                            ))}
                          </div>
                        )}
                        {s.remarks && <p className="text-[11px] text-stone-400 mt-1.5 leading-relaxed">{s.remarks}</p>}
                      </div>
                      <button
                        onClick={() => toggleStar(key)}
                        aria-label="第一避難先にする"
                        className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                          isStarred ? 'text-amber-500 bg-amber-50' : 'text-stone-300 hover:text-amber-400 hover:bg-orange-50'
                        }`}
                      >
                        <Star size={17} fill={isStarred ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <a
                      href={routeUrl(s.lat, s.lon)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 w-full py-2 rounded-xl bg-orange-50 border border-orange-200 text-amber-700 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-100 transition-colors"
                    >
                      <Navigation size={12} /> 徒歩ルートを見る
                    </a>
                  </div>
                )
              })}
            </section>
          )}
        </>
      )}

      {/* 用語の違い */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-2.5">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Info size={15} className="text-amber-500" /> 「避難場所」と「避難所」は別のもの
        </h2>
        <p className="text-xs text-stone-600 leading-relaxed">
          <strong className="text-stone-800">指定緊急避難場所</strong>は、命の危険から緊急に逃げ込む場所です。公園や高台など、屋外のこともあります。ここに表示しているのはこちらです。
        </p>
        <p className="text-xs text-stone-600 leading-relaxed">
          <strong className="text-stone-800">指定避難所</strong>は、家に戻れない人が一定期間過ごす施設です。体育館などが多く、緊急避難場所と同じとは限りません。
        </p>
        <p className="text-xs text-stone-600 leading-relaxed">
          家が無事なら、慣れた自宅で過ごす<strong className="text-stone-800">在宅避難</strong>のほうが体力を消耗しません。このアプリの備蓄は、そのための準備です。
        </p>
      </section>

      <p className="text-[11px] text-stone-400 leading-relaxed">
        出典：国土地理院「指定緊急避難場所データ」。距離は直線距離のため、実際の道のりはこれより長くなります。
        開設状況は災害のたびに変わります。最終的な確認は
        <a href="https://www.gsi.go.jp/bousaichiri/hinanbasho.html" target="_blank" rel="noopener noreferrer" className="underline mx-1 inline-flex items-center gap-0.5">
          出典元<ExternalLink size={9} />
        </a>
        とお住まいの自治体の公式情報でお願いします。
      </p>
    </div>
  )
}
