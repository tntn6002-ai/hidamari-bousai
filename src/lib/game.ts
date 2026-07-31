import type { Base, Item, ReqKey } from '../types'
import { baseSummary, daysUntil, requiredQty, stockOf } from './calculations'

// ── 集計ヘルパー ─────────────────────────────────────────────
export function readyBaseCount(bases: Base[], items: Item[]): number {
  return bases.filter(b => baseSummary(items, b).pct >= 1).length
}
export function expiredCount(items: Item[]): number {
  return items.filter(it => { const d = daysUntil(it.expiry); return d !== null && d < 0 }).length
}
export function expiringSoonCount(items: Item[]): number {
  return items.filter(it => { const d = daysUntil(it.expiry); return d !== null && d >= 0 && d <= 30 }).length
}
export function withExpiryCount(items: Item[]): number {
  return items.filter(it => daysUntil(it.expiry) !== null).length
}

// ── 備えレベル ───────────────────────────────────────────────
const LEVEL_TITLES = ['はじめて', 'みならい', 'そなえびと', '防災ジュニア', '防災マイスター', '防災の達人', 'ひだまり博士']
const PER_LEVEL = 20

export function computeLevel(
  bases: Base[],
  items: Item[],
  g: { quizScore: number; streakCount: number; earned: string[] },
) {
  const ready = readyBaseCount(bases, items)
  // 備蓄（家族の成果）＋ 自分の行動（クイズ正解・連続チェックイン・バッジ）でポイントが増える
  const points =
    items.length * 2 + ready * 12 + withExpiryCount(items) +
    g.quizScore * 3 + g.streakCount * 2 + g.earned.length * 2
  const level = Math.floor(points / PER_LEVEL) + 1
  const into = points % PER_LEVEL
  const pct = Math.round((into / PER_LEVEL) * 100)
  const title = LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]
  return { level, title, pct, toNext: PER_LEVEL - into, points }
}

// ── バッジ（実績）─────────────────────────────────────────────
export interface Badge { id: string; emoji: string; label: string; desc: string; earned: boolean }

export function computeBadges(
  bases: Base[],
  items: Item[],
  g: { quizScore: number; quizDoneCount: number; streakCount: number },
): Badge[] {
  const ready = readyBaseCount(bases, items)
  const waterOk = bases.some(b => requiredQty(b, 'water') > 0 && stockOf(items, b.id, 'water') >= requiredQty(b, 'water'))
  return [
    { id: 'first',    emoji: '🌱', label: 'はじめの一歩', desc: '備蓄を1つ登録した',          earned: items.length >= 1 },
    { id: 'ten',      emoji: '📦', label: 'ストック名人', desc: '備蓄を10品そろえた',          earned: items.length >= 10 },
    { id: 'ready1',   emoji: '✅', label: '準備完了',     desc: 'どこかの家が目標達成',        earned: ready >= 1 },
    { id: 'allready', emoji: '🏅', label: '家族まるごと', desc: 'すべての家が目標達成',        earned: bases.length > 0 && ready === bases.length },
    { id: 'water',    emoji: '💧', label: '水マスター',   desc: 'どこかの家で水が目標達成',    earned: waterOk },
    { id: 'noexp',    emoji: '⏰', label: '期限バッチリ', desc: '期限切れがゼロ（期限入力あり）', earned: withExpiryCount(items) > 0 && expiredCount(items) === 0 },
    { id: 'expset',   emoji: '📅', label: '記録じょうず', desc: '賞味期限を5品に登録',          earned: withExpiryCount(items) >= 5 },
    // ── 自分の手で取れるバッジ ──
    { id: 'quiz1',    emoji: '🧠', label: 'クイズ初挑戦', desc: 'クイズに1問正解した',          earned: g.quizScore >= 1 },
    { id: 'quizall',  emoji: '🎓', label: 'クイズ制覇',   desc: '全問クイズに回答した',          earned: g.quizDoneCount >= QUIZZES.length },
    { id: 'streak3',  emoji: '🔥', label: '3日つづけた',  desc: '3日連続でチェックイン',        earned: g.streakCount >= 3 },
    { id: 'streak7',  emoji: '⚡', label: '1週間つづけた', desc: '7日連続でチェックイン',        earned: g.streakCount >= 7 },
  ]
}

// ── 今週のミッション（データから自動判定）──────────────────────
export interface Mission { id: string; label: string; done: boolean; hint: string }

export function weeklyMissions(bases: Base[], items: Item[]): Mission[] {
  const soon = expiringSoonCount(items)
  const under = bases.filter(b => baseSummary(items, b).pct < 1).length
  return [
    { id: 'add5', label: '備蓄を5品まで増やそう',       done: items.length >= 5, hint: `いま ${items.length}/5` },
    { id: 'exp',  label: '期限が近い備蓄を入れ替えよう', done: soon === 0,        hint: soon > 0 ? `対象 ${soon}件` : 'クリア！' },
    { id: 'fill', label: '足りない家に備蓄を足そう',     done: under === 0,       hint: under > 0 ? `あと ${under}軒` : 'クリア！' },
  ]
}

// ── 担当（役割）の選択肢 ─────────────────────────────────────
export const ROLES = ['水チェック係', '食料担当', 'トイレ担当', 'ペット担当', '情報係']

// 担当 → その人が受け持つ備蓄カテゴリ（情報係はアイテム紐づけなし＝クイズ担当）
export function roleTargetKey(role: string | null): ReqKey | null {
  switch (role) {
    case '水チェック係': return 'water'
    case '食料担当':     return 'food'
    case 'トイレ担当':   return 'toilet'
    case 'ペット担当':   return 'dogfood'
    default:             return null
  }
}

// ── 防災ミニクイズ ───────────────────────────────────────────
export interface Quiz { id: string; q: string; choices: string[]; answer: number; explain: string }

export const QUIZZES: Quiz[] = [
  // ── 水・食料 ──
  { id: 'q1', q: '大人1人が1日に必要な飲料水の目安は？', choices: ['約0.5L', '約1L', '約3L'], answer: 2,
    explain: '飲料と調理をあわせて1日およそ3Lが目安です。' },
  { id: 'q3', q: '「ローリングストック」とは？', choices: ['非常食を一度に大量購入', '普段の食品を使いながら買い足す', '冷凍庫で保存する'], answer: 1,
    explain: '日常的に食べて→補充を回すことで、いつも新しい備蓄を保てます。' },
  { id: 'q5', q: '在宅避難でまず目指したい備蓄期間は？', choices: ['1日', '3日〜1週間', '1年'], answer: 1,
    explain: '最低3日、できれば1週間分が目安です。' },
  { id: 'q24', q: '備蓄の期限管理でおすすめの習慣は？', choices: ['買ったら忘れる', 'ときどき期限を見て古い物から使う', '全部同じ日にまとめ買い'], answer: 1,
    explain: '古い物から消費→補充（ローリングストック）で、期限切れを防げます。' },

  // ── トイレ関連（断水時にいちばん困る）──
  { id: 'q2', q: '大地震の直後、マンションでトイレを流していい？', choices: ['すぐ流してOK', '排水管の点検までは流さない', '水を足せばOK'], answer: 1,
    explain: '配管が壊れていると階下へ漏れる恐れが。点検が済むまでは携帯トイレを使います。' },
  { id: 'q8', q: 'なぜ携帯（簡易）トイレが必要なの？', choices: ['おしゃれだから', '断水や配管の破損で水洗トイレが使えなくなるから', 'ゴミを減らすため'], answer: 1,
    explain: '地震では断水・停電・配管損傷で水洗トイレが使えなくなります。命と衛生に直結する必需品です。' },
  { id: 'q4', q: '携帯トイレ、大人1人1日あたりの目安回数は？', choices: ['1回', '5回', '20回'], answer: 1,
    explain: '1日およそ5回が目安。日数×人数分をそろえましょう。' },
  { id: 'q6', q: '携帯トイレ、大人1人の“1週間分”の目安は？', choices: ['約7回分', '約35回分', '約100回分'], answer: 1,
    explain: '1日5回×7日＝約35回分。1人でもけっこうな数が必要です。' },
  { id: 'q7', q: '4人家族が3日分そなえる携帯トイレは、およそ何回分？', choices: ['約20回分', '約60回分', '約150回分'], answer: 1,
    explain: '5回×4人×3日＝約60回分。人数と日数でかけ算しましょう。' },
  { id: 'q9', q: '使用済みの携帯トイレはどう保管する？', choices: ['そのまま部屋に置く', '防臭袋やフタ付き容器に入れる', 'トイレに流す'], answer: 1,
    explain: 'においと衛生対策に、防臭袋やフタ付きの容器（ゴミ回収まで保管）が安心です。' },
  { id: 'q10', q: '携帯トイレのほかに、トイレまわりであると助かるのは？', choices: ['トイレットペーパー・ウェットティッシュ・ゴミ袋', 'テレビ', '観葉植物'], answer: 0,
    explain: '紙・手指の清潔用品・ゴミ袋をセットで。目隠し用のポンチョもあると◎。' },

  // ── 食品以外の必須アイテム ──
  { id: 'q11', q: '停電時、情報を集めるのに役立つのは？', choices: ['電池式・手回しラジオ', '固定電話', '有線テレビ'], answer: 0,
    explain: '停電・通信混雑でもラジオは強い。電池や手回しで電源いらずのものを。' },
  { id: 'q12', q: 'スマホの電源確保のために備えたいのは？', choices: ['延長コード', 'モバイルバッテリー', 'イヤホン'], answer: 1,
    explain: '充電済みのモバイルバッテリーを。連絡・情報の生命線になります。' },
  { id: 'q13', q: '停電時の明かりとして安全なのは？', choices: ['ろうそく', '懐中電灯やランタン＋予備電池', 'ライターの火'], answer: 1,
    explain: 'ろうそくやライターは火災の危険。電池式の明かり＋予備電池が安全です。' },
  { id: 'q14', q: '断水時、食器を汚さず使う工夫は？', choices: ['皿にラップやポリ袋をかぶせる', 'がまんする', 'お皿を割る'], answer: 0,
    explain: '皿にラップ／ポリ袋をかぶせれば洗わずに使えて、貴重な水を節約できます。' },
  { id: 'q15', q: '断水時の手指の清潔に役立つのは？', choices: ['ウェットティッシュやアルコール', '香水', '制汗スプレー'], answer: 0,
    explain: 'ウェットティッシュ・アルコールで手指を清潔に。感染症予防にも重要です。' },
  { id: 'q16', q: '持病の薬がある場合に備えたい量は？', choices: ['1日分', '1週間分ほど（お薬手帳のコピーも）', '備えなくてよい'], answer: 1,
    explain: '常備薬は最低1週間分。お薬手帳のコピーや写真も一緒に用意を。' },
  { id: 'q17', q: '停電でATMやカードが使えないときのために？', choices: ['現金（小銭も）', '商品券だけ', '何もいらない'], answer: 0,
    explain: '停電時は電子決済もATMも止まりがち。小銭を含む現金があると安心です。' },
  { id: 'q18', q: 'カセットボンベ、大人2人で1週間の目安は？', choices: ['約2本', '約6本', '約20本'], answer: 1,
    explain: '2人で1週間およそ6本が目安。調理や湯わかしに使います。' },
  { id: 'q19', q: 'カセットコンロ＆ボンベが役立つ場面は？', choices: ['停電・ガス停止時の調理や湯わかし', 'そうじ', '充電'], answer: 0,
    explain: 'ライフラインが止まっても温かい食事・白湯が作れます。' },

  // ── 行動・家の備え ──
  { id: 'q20', q: '地震で家具が倒れるのを防ぐには？', choices: ['固定金具などで転倒防止', '上に重い物を置く', '何もしない'], answer: 0,
    explain: '家具の固定はケガ・避難路確保の基本。寝る場所の周りは特に。' },
  { id: 'q21', q: '避難で家を離れるとき、火災を防ぐには？', choices: ['ブレーカーを落とす', '窓を全部開ける', '電気をつけたまま'], answer: 0,
    explain: '通電火災（停電復旧時の発火）を防ぐため、ブレーカーを落としてから避難を。' },
  { id: 'q22', q: '家族と前もって決めておくと安心なのは？', choices: ['集合場所や連絡方法', '好きな食べ物', 'ゲームの順番'], answer: 0,
    explain: 'はぐれても合流できるよう、集合場所・連絡手段を家族で共有しておきましょう。' },
  { id: 'q23', q: '犬がいる家庭で備えたいのは？', choices: ['フード・水・ペットシーツ', 'おもちゃだけ', '特にない'], answer: 0,
    explain: 'ペットの分の水・フード・トイレ用品も忘れずに。人と一緒に備えましょう。' },

  // ── 地震直後の行動 ──
  { id: 'q30', q: '地震の揺れを感じたら、まず身を守る行動は？', choices: ['すぐ外に走る', '低くなり頭を守って動かない', 'エレベーターで避難'], answer: 1,
    explain: 'まず低く・頭を守り・動かない（シェイクアウト）。落下物やガラスから身を守ります。' },
  { id: 'q31', q: '揺れが収まった直後、火を使っていたら？', choices: ['すぐ外へ逃げる', '放置する', '無理のない範囲で火を消し、元栓を締める'], answer: 2,
    explain: '慌てず、安全なときに火の始末を。無理はしない（やけど・転倒に注意）。' },
  { id: 'q32', q: '大地震のあと、エレベーターは？', choices: ['急いで乗る', '使わない（閉じ込めの危険）', '問題ない'], answer: 1,
    explain: '停電や余震で閉じ込められる恐れ。階段を使いましょう。乗車中に地震なら全階押して降りる。' },
  { id: 'q33', q: '津波の危険があるときは？', choices: ['海の様子を見に行く', 'できるだけ高い所へすぐ避難', '家にとどまる'], answer: 1,
    explain: '津波は非常に速い。警報が出たら「より高く・より遠く」へ、すぐ避難を。' },
  { id: 'q47', q: '停電が復旧するときに気をつけるのは？', choices: ['特にない', '通電火災（電気製品からの出火）に注意', '音に注意'], answer: 1,
    explain: '避難時はブレーカーを落とし、復旧後は電気製品や配線の異常を確認してから使いましょう。' },
  { id: 'q48', q: '地震でガスが止まったあと、自分でできることが多いのは？', choices: ['元栓を壊す', 'ガスメーターの復帰ボタンで戻せることが多い', '何もできない'], answer: 1,
    explain: 'マイコンメーターは安全のため自動で遮断。ガス臭がなければ復帰ボタン操作で戻せることが多いです。' },

  // ── 連絡・情報 ──
  { id: 'q34', q: '家族と連絡が取りにくいときに使えるのは？', choices: ['何度も電話をかけ続ける', '災害用伝言ダイヤル171やSNS', 'あきらめる'], answer: 1,
    explain: '通話は混み合いがち。171やSNS・メッセージアプリが役立ちます。集合場所も決めておくと安心。' },
  { id: 'q44', q: 'ハザードマップで確認しておきたいのは？', choices: ['近所のお店', '自宅の洪水・土砂・津波の危険と避難場所', '景色'], answer: 1,
    explain: '自宅の災害リスクと、いざというときの避難先・経路を家族で共有しておきましょう。' },
  { id: 'q43', q: 'がれきの下などから救助を呼ぶのに役立つ小さな道具は？', choices: ['ハンカチ', 'ホイッスル（笛）', '鏡'], answer: 1,
    explain: '声より少ない力で遠くまで届きます。持ち出し袋や玄関に一つ備えると安心。' },

  // ── 電源・明かり・寒暑 ──
  { id: 'q35', q: '懐中電灯を使うために忘れず備えたいのは？', choices: ['三脚', '予備の電池', 'スマホスタンド'], answer: 1,
    explain: '本体だけでは使えない場面も。予備電池をセットで用意しましょう。' },
  { id: 'q36', q: 'モバイルバッテリーの選び方・備え方は？', choices: ['色で選ぶ', '軽さだけで選ぶ', '容量が大きめで、ふだんから満充電にしておく'], answer: 2,
    explain: 'いざというとき空では意味がありません。容量大きめ＋満充電キープが基本です。' },
  { id: 'q37', q: '寒い季節の停電・避難で体温を守るのに役立つのは？', choices: ['扇風機', '毛布・使い捨てカイロ・保温アルミシート', '氷'], answer: 1,
    explain: '低体温症を防ぐ保温グッズを。アルミシートは軽くて暖かく持ち出し袋にも◎。' },
  { id: 'q38', q: '夏の避難・停電で特に注意したいのは？', choices: ['霜焼け', '風邪だけ', '熱中症（水分・塩分・涼しさの確保）'], answer: 2,
    explain: '停電でエアコンが使えないことも。水分・塩分と、風通し・日陰で熱中症対策を。' },

  // ── 応急手当・家の安全 ──
  { id: 'q39', q: 'けがの応急手当に備えたいのは？', choices: ['化粧品', '救急セット（絆創膏・消毒・包帯など）', '香水'], answer: 1,
    explain: '常備薬とあわせて救急セットを。使い方も家族で確認しておくと安心です。' },
  { id: 'q40', q: '窓ガラスの飛散でけがをしないために？', choices: ['裸足で歩く', '飛散防止フィルム＋スリッパを備える', '気にしない'], answer: 1,
    explain: '割れたガラスは大けがのもと。フィルムと、足を守るスリッパ・靴を用意しましょう。' },
  { id: 'q41', q: '寝室の地震対策として良いのは？', choices: ['本棚をベッドの横に置く', '倒れる家具を置かず、枕元にライトやスリッパ', '何もしない'], answer: 1,
    explain: '就寝中は無防備。倒れて出口をふさぐ家具を避け、すぐ動ける準備を枕元に。' },
  { id: 'q42', q: '玄関やベッドの近くに置いておくと安全なのは？', choices: ['花', '新聞', '靴やスリッパ（ガラス対策）'], answer: 2,
    explain: '停電＋ガラス散乱の中でも足を守れます。避難のときすぐ履けて安心。' },

  // ── 持ち出し袋・在宅備蓄 ──
  { id: 'q45', q: '非常用の持ち出し袋の置き場所は？', choices: ['押し入れの奥', 'すぐ持ち出せる玄関などに', 'どこでもよい'], answer: 1,
    explain: '緊急時にすぐ持って出られる場所へ。中身は年1〜2回、期限や季節に合わせて見直しを。' },
  { id: 'q46', q: '在宅備蓄と「持ち出し袋」の違いは？', choices: ['同じもの', '備蓄は家で過ごす分、持ち出し袋は避難時にすぐ持つ分', '持ち出し袋だけでよい'], answer: 1,
    explain: '在宅避難用の備蓄と、避難所へ行くときの最小限セット。両方あると安心です。' },

  // ── 食・赤ちゃん・衛生 ──
  { id: 'q25', q: '断水に備えた水の使い分けで良いのは？', choices: ['全部保存水', '飲用は保存水、生活用水は風呂の水などをためる', '全部水道水'], answer: 1,
    explain: '飲用は清潔な保存水、トイレ・洗い物などの生活用水は風呂の残り湯などで代替できます。' },
  { id: 'q26', q: 'アルファ米の準備で正しいのは？', choices: ['炊飯器が必要', '冷凍する', '水またはお湯を注いで戻せる'], answer: 2,
    explain: '水でも戻せる（時間は長め）ので、停電・断水時の主食に便利です。' },
  { id: 'q29', q: '停電したとき、冷蔵庫の食品は？', choices: ['何度も開けて確認', '開け閉めを減らし、早めに使い切る', '常温で放置でOK'], answer: 1,
    explain: '開閉を減らすと保冷が長持ち。傷みやすい物から早めに消費しましょう。' },
  { id: 'q27', q: '赤ちゃんがいる家庭で追加で備えたいのは？', choices: ['液体ミルク・紙おむつ・おしりふき', 'おもちゃだけ', '特にない'], answer: 0,
    explain: '液体ミルクは調乳不要で災害時に便利。おむつ・おしりふきも多めに。' },
  { id: 'q28', q: '食物アレルギーのある家族のために？', choices: ['みんなと同じでOK', 'アレルギー対応の非常食を用意', '食べない'], answer: 1,
    explain: '非常時は代替品が手に入りにくいもの。対応食を個別に備えておきましょう。' },
  { id: 'q49', q: '断水中の歯みがきはどうする？', choices: ['しない', '大量の水でうがい', '少量の水やウェットティッシュ・液体歯みがきで対応'], answer: 2,
    explain: '口の中の衛生は体調維持に大切。少ない水で工夫して続けましょう。' },
  { id: 'q50', q: '生理用品やおむつなどの衛生用品は？', choices: ['非常時に買えばよい', 'ふだんから少し多めに備えておく', '不要'], answer: 1,
    explain: '災害時は入手しにくくなります。日常のストックを少し多めに保つと安心です。' },
]
