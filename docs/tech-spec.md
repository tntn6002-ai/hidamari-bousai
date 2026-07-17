# 技術仕様書 — ひだまり防災ボード

版 1.0（2026-07-17）。外部データ・APIは2026年7月時点の調査に基づく。
**実装時に各APIの最新の利用規約・仕様を必ず再確認すること。**

## 1. 推奨スタック（変更可。ただし下記要件を満たすこと）

- フロント：React＋Vite（または Next.js）による PWA。Service Worker（vite-plugin-pwa 等）。
- 地図：Leaflet または MapLibre GL（XYZタイル重ね合わせ）。
- バックエンド／DB／認証：Supabase（無料枠・Row Level Security 必須）。
- ホスティング：Vercel／Netlify／Cloudflare Pages 等の無料枠。
- プッシュ：Web Push（VAPID）。iOS 16.4以降はホーム画面追加したPWAのみ受信可。
- 選定基準：無料〜低コスト／RLSで世帯間の公開範囲を制御できる／オフライン対応が素直に書ける。

## 2. データモデル（初版・実装時に調整可）

```
households(id, name)
members(id, household_id, display_name, role)
bases(id, household_id, kind[home|work], anon_code, label,
      lat, lng, address,            -- 住所系はDBのみ。コード・ログに出さない
      building jsonb,               -- {structure, floor, era3, autolock}
      target_days int, resources jsonb[], interrupt_switch text,
      commute jsonb,                -- {station, lines[], access, minutes}
      notes text)
items(id, base_id, name, req_key, qty numeric, unit, expiry date,
      place, product_url, jan)
devices(id, base_id, type[fuelcell|pv|vehicle|battery], label,
      specs jsonb, next_check_at date)
badges(id, base_id, title, hint, status[unknown|done])
routes(id, base_id, tier[normal|partial|walk], description, lines text[])
safety_events(id, started_by, trigger[quake|manual|drill],
      threshold, created_at)
safety_responses(event_id, member_id,
      status[safe|stay|heading], pet_done bool, created_at)
push_subscriptions(member_id, endpoint, keys jsonb)
```

- RLS方針：メンバーは自世帯のデータをフル、他世帯は `bases.share_level`（在庫詳細／充足率のみ／非公開）に従って閲覧のみ。
- 職場拠点（kind=work）は本人のみ編集可。

## 3. 計算係数（参考実装 `reference/hidamari-bousai-phase1.jsx` と一致させる）

| 項目 | 大人1人/日 | 犬1匹/日 | 単位 |
|---|---|---|---|
| 飲料水 | 3 | 0.5 | L |
| 主食 | 3 | — | 食 |
| 携帯トイレ | 5 | — | 回分 |
| カセットボンベ | 0.45 | — | 本 |
| 犬フード | — | 1 | 日分 |
| ペットシーツ | — | 3 | 枚 |

ダッシュボードの「在宅避難◯日分」＝ 水・主食・トイレの（在庫÷日需要）の最小値。目標日数で正規化してリング表示。

## 4. 外部データ・API一覧（調査済み）

| 用途 | ソース | 形式 | 認証 | 注意事項 |
|---|---|---|---|---|
| ハザードタイル（洪水・津波・土砂・高潮等） | 重ねるハザードマップ配信（disaportal.gsi.go.jp のオープンデータ配信ページ） | XYZタイル（地理院タイル仕様） | 不要 | 出典「ハザードマップポータルサイト」の明記が条件。商用非商用問わず利用可 |
| 震度確率（30年・震度6弱以上等） | J-SHIS 地震ハザード情報提供API（防災科研） | REST／GeoJSON・XML | 不要 | 250mメッシュ。version=Y2024 等を指定 |
| 指定緊急避難場所 | 国土地理院 指定緊急避難場所CSV | CSV | 不要 | 災害種別フラグ＋緯度経度つき。全国一括あり。定期的に再取込 |
| 商品情報（JAN→商品名） | Yahoo!ショッピング商品検索v3 | JSON | アプリID | JANコード検索可。目安1クエリ/秒の利用制限 |
| 地震情報・津波予報 | P2P地震情報 JSON API v2／WebSocket | JSON/WS | 不要（規約要確認） | 家族利用前提。緊急地震速報（警報）含む。コミュニティ配信である旨をUIに表示 |
| 鉄道運行情報 | 公共交通オープンデータセンター（ODPT） | API | 開発者登録 | 都営地下鉄・東京メトロ等。対象路線のみ表示 |
| ジオコーディング | 国土地理院 住所検索API（候補） | JSON | 不要 | 実装時に規約・精度を確認。代替：手動で地図ピン指定 |
| 備蓄品目・係数の参考 | 東京備蓄ナビ（東京都・MITライセンスOSS） | ソース/CSV | — | 品目リストの下敷きに利用可 |
| 購入導線 | Amazon 検索URL `https://www.amazon.co.jp/s?k=...` | URL | 不要 | リンクを開くのみ。注文APIは使わない |

## 5. オフライン設計

- プリキャッシュ：アプリシェル、家族連絡カード、集合場所、持ち出しリスト、最終取得の在庫スナップショット。
- 送信キュー：安否応答・在庫変更は IndexedDB に積み、オンライン復帰時に自動送信（重複防止のイベントID付与）。
- ハザードタイルは閲覧済み範囲をキャッシュ（容量上限つき・LRU）。
- 外部API障害時は「最後に取得した値＋取得日時」を表示する（沈黙より古さの明示）。

## 6. 通知設計

- 種別：expiry（30日前・期限切れ）／shortage（目標不足）／quake（しきい値超え、F8）／checkup（電源定期充電・燃料半分・訓練日 9/1・3/11）。
- サーバーからWeb Push。未達時はアプリ内アラート一覧を正とする。
- 深夜帯は非常時（quake・安否）以外を抑制。

## 7. 既知の制約（回避策を探さず、この前提で設計する）

- 賞味期限はJANデータベースから取得できない → 手入力（任意で日付部分の写真OCR補助）。
- ネットスーパー・ECの一般消費者向け注文APIは公開されていない → リンク生成のみ。
- 気象庁の緊急地震速報の直接受信は個人開発では非現実的 → P2P地震情報で代替。
- iOSのWeb通知はホーム画面追加PWAに限られる → オンボーディングで案内。
- Web Pushで通知音のカスタムは不可 → 仕様外（確定）。

## 8. 環境変数（.env）

`SUPABASE_URL` / `SUPABASE_ANON_KEY` / `YAHOO_APP_ID` / `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` など。
クライアントに出してよいのは公開前提の値（anonキー・VAPID公開鍵）のみ。秘密鍵はサーバー側に限定。
