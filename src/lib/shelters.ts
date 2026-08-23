// 国土地理院「指定緊急避難場所」データの取得。
// レイヤ定義：https://maps.gsi.go.jp/layers_txt/layers5.txt
// タイルは maxNativeZoom = 10 の GeoJSON。CORS 許可あり。
// 出典表示と「最終確認は自治体の公式資料で」の注意は画面側で必ず出すこと。

export interface ShelterLayer {
  id: string
  label: string
  short: string
}

export const SHELTER_LAYERS: ShelterLayer[] = [
  { id: 'skhb04', label: '指定緊急避難場所（地震）', short: '地震' },
  { id: 'skhb01', label: '指定緊急避難場所（洪水）', short: '洪水' },
  { id: 'skhb02', label: '指定緊急避難場所（崖崩れ・土石流・地滑り）', short: '土砂' },
  { id: 'skhb05', label: '指定緊急避難場所（津波）', short: '津波' },
  { id: 'skhb03', label: '指定緊急避難場所（高潮）', short: '高潮' },
  { id: 'skhb07', label: '指定緊急避難場所（内水氾濫）', short: '内水氾濫' },
  { id: 'skhb06', label: '指定緊急避難場所（大規模な火事）', short: '火事' },
  { id: 'skhb08', label: '指定緊急避難場所（火山現象）', short: '火山' },
]

/** properties の disaster1〜8 が、どの災害に対応しているか */
export const DISASTER_FLAGS: { key: string; short: string }[] = [
  { key: 'disaster1', short: '洪水' },
  { key: 'disaster2', short: '土砂' },
  { key: 'disaster3', short: '高潮' },
  { key: 'disaster4', short: '地震' },
  { key: 'disaster5', short: '津波' },
  { key: 'disaster6', short: '火事' },
  { key: 'disaster7', short: '内水氾濫' },
  { key: 'disaster8', short: '火山' },
]

export interface Shelter {
  name: string
  address: string
  remarks: string | null
  lat: number
  lon: number
  /** 拠点からの直線距離（m） */
  distance: number
  /** 対応している災害の略称 */
  disasters: string[]
}

const NATIVE_ZOOM = 10

function tileXY(lat: number, lon: number, z: number) {
  const n = 2 ** z
  const latRad = (lat * Math.PI) / 180
  const x = ((lon + 180) / 360) * n
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  return { x, y }
}

/** 2点間の直線距離（m）。ヒュベニではなく十分な精度の球面近似で足りる。 */
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

/** 徒歩の目安（分）。80m/分＝不動産表記と同じ基準。 */
export const walkMinutes = (meters: number) => Math.max(1, Math.round(meters / 80))

export const formatDistance = (m: number) => (m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`)

/** Googleマップで徒歩経路を開くURL */
export const routeUrl = (lat: number, lon: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`

type Feature = {
  geometry: { coordinates: [number, number] }
  properties: Record<string, unknown>
}

const tileCache = new Map<string, Promise<Feature[]>>()

function loadTile(layerId: string, z: number, x: number, y: number): Promise<Feature[]> {
  const key = `${layerId}/${z}/${x}/${y}`
  const cached = tileCache.get(key)
  if (cached) return cached
  const p = fetch(`https://maps.gsi.go.jp/xyz/${layerId}/${z}/${x}/${y}.geojson`)
    .then(res => (res.ok ? res.json() : { features: [] }))
    .then(json => (json.features ?? []) as Feature[])
    .catch(() => [] as Feature[])
  tileCache.set(key, p)
  return p
}

/**
 * 拠点周辺の指定緊急避難場所を近い順に返す。
 * z=10 のタイルは1枚で数十kmをカバーするので、拠点がタイルの端に寄っているときだけ
 * 隣のタイルも読む（最大4枚）。
 */
export async function fetchShelters(
  lat: number,
  lon: number,
  layerId: string,
  limit = 12,
): Promise<Shelter[]> {
  const { x, y } = tileXY(lat, lon, NATIVE_ZOOM)
  const bx = Math.floor(x)
  const by = Math.floor(y)
  const fx = x - bx
  const fy = y - by

  const targets: [number, number][] = [[bx, by]]
  const nx = fx < 0.15 ? bx - 1 : fx > 0.85 ? bx + 1 : null
  const ny = fy < 0.15 ? by - 1 : fy > 0.85 ? by + 1 : null
  if (nx !== null) targets.push([nx, by])
  if (ny !== null) targets.push([bx, ny])
  if (nx !== null && ny !== null) targets.push([nx, ny])

  const tiles = await Promise.all(targets.map(([tx, ty]) => loadTile(layerId, NATIVE_ZOOM, tx, ty)))

  const seen = new Set<string>()
  const shelters: Shelter[] = []
  for (const features of tiles) {
    for (const f of features) {
      const [flon, flat] = f.geometry?.coordinates ?? []
      if (typeof flat !== 'number' || typeof flon !== 'number') continue
      const name = String(f.properties?.name ?? '')
      const dedupeKey = `${name}@${flat.toFixed(5)},${flon.toFixed(5)}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)
      shelters.push({
        name,
        address: String(f.properties?.address ?? ''),
        remarks: (f.properties?.remarks as string) ?? null,
        lat: flat,
        lon: flon,
        distance: distanceMeters(lat, lon, flat, flon),
        disasters: DISASTER_FLAGS.filter(d => f.properties?.[d.key] === 1).map(d => d.short),
      })
    }
  }

  return shelters.sort((a, b) => a.distance - b.distance).slice(0, limit)
}
