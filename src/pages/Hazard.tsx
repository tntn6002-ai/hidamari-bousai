import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Search, MapPin, ExternalLink, Building2, Home } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import type { Base } from '../types'

// Leaflet のデフォルトアイコン修正
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface HazardProps {
  bases: Base[]
  onUpdateBase: (id: string, patch: Partial<Base>) => void
}

const HAZARD_LAYERS = [
  { id: 'flood', label: '洪水浸水', color: 'blue', ls: 'surf_fl1', disp: '1' },
  { id: 'landslide', label: '土砂災害', color: 'orange', ls: 'surf_ls_0', disp: '1' },
  { id: 'tsunami', label: '津波', color: 'purple', ls: 'surf_t0', disp: '1' },
  { id: 'liquefaction', label: '液状化', color: 'yellow', ls: 'surf_lq1', disp: '1' },
]

function disaportalUrl(lat: number, lon: number, ls: string) {
  return `https://disaportal.gsi.go.jp/maps/?ll=${lat},${lon}&z=14&base=pale&ls=${ls}&disp=1`
}

async function geocode(query: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(query)}`
  const res = await fetch(url)
  const json = await res.json()
  if (!json.length) return null
  const [lon, lat] = json[0].geometry.coordinates
  return { lat, lon }
}

function BaseMap({ base }: { base: Base }) {
  if (!base.lat || !base.lon) return null
  return (
    <MapContainer
      center={[base.lat, base.lon]}
      zoom={14}
      className="h-48 w-full rounded-xl z-0"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>'
        url="https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"
      />
      <Marker position={[base.lat, base.lon]}>
        <Popup>{base.name}</Popup>
      </Marker>
    </MapContainer>
  )
}

export function Hazard({ bases, onUpdateBase }: HazardProps) {
  const [activeBase, setActiveBase] = useState(bases[0]?.id || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const b = bases.find(x => x.id === activeBase) || bases[0]
  if (!b) return null

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    const result = await geocode(searchQuery.trim())
    setSearching(false)
    if (!result) {
      setSearchError('場所が見つかりませんでした。別の名称で試してください。')
      return
    }
    onUpdateBase(b.id, { lat: result.lat, lon: result.lon })
    setSearchQuery('')
  }

  return (
    <div className="px-4 lg:px-8 py-5 max-w-3xl mx-auto space-y-4">

      {/* Base selector */}
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

      {/* Location setting */}
      <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm flex items-center gap-1.5">
            <MapPin size={14} className="text-amber-500" />
            {b.name}の場所
          </h2>
          {b.lat && b.lon && (
            <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              設定済み
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="地名・駅名・住所（例：大阪府八尾市）"
            className="flex-1 px-3 py-2 rounded-xl border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-3 py-2 rounded-xl bg-amber-400 text-white font-bold text-sm hover:bg-amber-500 disabled:bg-stone-200 disabled:text-stone-400 transition-colors flex items-center gap-1"
          >
            <Search size={14} />
            {searching ? '検索中' : '設定'}
          </button>
        </div>
        {searchError && <p className="text-xs text-red-500">{searchError}</p>}
        <p className="text-[11px] text-stone-400">正確な住所でなくて大丈夫です。駅名や地区名でも設定できます。</p>

        {/* Floor setting */}
        <div className="flex items-center gap-3 pt-1 border-t border-orange-50">
          <span className="text-xs text-stone-500 whitespace-nowrap">居住・利用階</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(f => (
              <button
                key={f}
                onClick={() => onUpdateBase(b.id, { floor: f })}
                className={`w-9 h-9 rounded-xl text-sm font-bold border transition-colors ${
                  b.floor === f
                    ? 'bg-amber-400 border-amber-400 text-white'
                    : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
                }`}
              >
                {f}F
              </button>
            ))}
            <button
              onClick={() => onUpdateBase(b.id, { floor: 6 })}
              className={`px-2 h-9 rounded-xl text-sm font-bold border transition-colors ${
                b.floor && b.floor >= 6
                  ? 'bg-amber-400 border-amber-400 text-white'
                  : 'bg-white border-orange-200 text-stone-500 hover:border-amber-300'
              }`}
            >
              6F+
            </button>
          </div>

          {/* base type */}
          <div className="ml-auto flex gap-1.5">
            <button
              onClick={() => onUpdateBase(b.id, { baseType: 'home' })}
              className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                b.baseType !== 'work' ? 'bg-amber-400 border-amber-400 text-white' : 'bg-white border-orange-200 text-stone-500'
              }`}
            >
              <Home size={11} /> 住居
            </button>
            <button
              onClick={() => onUpdateBase(b.id, { baseType: 'work' })}
              className={`px-2 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1 ${
                b.baseType === 'work' ? 'bg-amber-400 border-amber-400 text-white' : 'bg-white border-orange-200 text-stone-500'
              }`}
            >
              <Building2 size={11} /> 職場
            </button>
          </div>
        </div>
      </section>

      {/* Map */}
      {b.lat && b.lon ? (
        <>
          <section className="bg-white rounded-2xl shadow-sm border border-orange-100 overflow-hidden">
            <BaseMap base={b} />
            <div className="p-3">
              <p className="text-[11px] text-stone-400">国土地理院 淡色地図</p>
            </div>
          </section>

          {/* Hazard links */}
          <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
            <h2 className="font-bold text-sm">ハザードマップで確認</h2>
            <p className="text-xs text-stone-500">
              各ボタンで国土交通省のハザードマップポータルが開きます。{b.name}周辺のリスクを確認してください。
            </p>
            <div className="grid grid-cols-2 gap-2">
              {HAZARD_LAYERS.map(layer => (
                <a
                  key={layer.id}
                  href={disaportalUrl(b.lat!, b.lon!, layer.ls)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-sm font-semibold text-amber-700 hover:bg-orange-100 transition-colors"
                >
                  <ExternalLink size={13} />
                  {layer.label}
                </a>
              ))}
            </div>

            {/* Floor warning */}
            {b.floor && b.floor <= 2 && (
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 border border-amber-200">
                <strong>{b.floor}階</strong>に設定されています。洪水・津波浸水想定区域に該当する場合は垂直避難（上階への移動）または早期避難を検討してください。
              </div>
            )}
          </section>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-8 text-center text-sm text-stone-400">
          上の検索欄で場所を設定すると地図とハザード情報が表示されます
        </div>
      )}
    </div>
  )
}
