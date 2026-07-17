import { useState, useEffect, useRef } from "react";
import { Sun, Home, Package, ClipboardList, Bell, Plus, Minus, Trash2, ExternalLink, Pencil, X, Check, RotateCcw } from "lucide-react";

// ============================================================
// ひだまり防災ボード — フェーズ1（試作）
// 備蓄プランナー / 在庫管理 / 見える化 / アラート→Amazon
// 実住所・実勤務先はコードに含めない方針（初期値は匿名ラベル）
// ============================================================

const STORAGE_KEY = "hidamari-bousai-v1";

// 必要量の計算根拠（会話で確定した係数）
// 大人: 水3L/日・3食/日・トイレ5回/日・ボンベ約0.45本/日(2人で週6本)
// 犬: 水0.5L/日・フード1日分/日・シーツ3枚/日（目安）
const REQ = {
  water:   { label: "飲料水",       unit: "L",    perAdult: 3,    perDog: 0.5, core: true,  q: "保存水 2L 長期保存 防災" },
  food:    { label: "主食",         unit: "食",   perAdult: 3,    perDog: 0,   core: true,  q: "アルファ米 非常食 セット" },
  toilet:  { label: "携帯トイレ",   unit: "回分", perAdult: 5,    perDog: 0,   core: true,  q: "携帯トイレ 防災 50回" },
  gas:     { label: "カセットボンベ", unit: "本",  perAdult: 0.45, perDog: 0,   core: false, q: "カセットボンベ 12本" },
  dogfood: { label: "犬フード",     unit: "日分", perAdult: 0,    perDog: 1,   core: false, q: "ドッグフード 長期保存" },
  sheets:  { label: "ペットシーツ", unit: "枚",   perAdult: 0,    perDog: 3,   core: false, q: "ペットシーツ レギュラー" },
};
const REQ_KEYS = Object.keys(REQ);

const SEED_BASES = [
  { id: "b1", name: "関西の自宅", tag: "戸建て・犬1", adults: 2, dogs: 1, days: 14 },
  { id: "b2", name: "長女宅",     tag: "東京・2階",   adults: 1, dogs: 0, days: 7 },
  { id: "b3", name: "次女宅",     tag: "東京・2階・犬1", adults: 2, dogs: 1, days: 7 },
  { id: "b4", name: "三女宅",     tag: "川崎・1階",   adults: 2, dogs: 0, days: 7 },
];

const uid = () => Math.random().toString(36).slice(2, 9);
const todayStr = () => new Date().toISOString().slice(0, 10);
const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  return Math.floor((d - new Date(new Date().toDateString())) / 86400000);
};
const amazonSearch = (q) => `https://www.amazon.co.jp/s?k=${encodeURIComponent(q)}`;

const requiredQty = (base, key) => {
  const r = REQ[key];
  const perDay = base.adults * r.perAdult + base.dogs * r.perDog;
  return Math.ceil(perDay * base.days);
};
const dailyNeed = (base, key) => {
  const r = REQ[key];
  return base.adults * r.perAdult + base.dogs * r.perDog;
};

// ---------- 充足リング ----------
function Ring({ pct, size = 92, stroke = 9, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, pct));
  const color = p >= 1 ? "#059669" : p >= 0.5 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1ede4" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p)}
          style={{ transition: "stroke-dashoffset 600ms ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

function MiniBar({ label, have, need, unit }) {
  const p = need > 0 ? Math.min(1, have / need) : 1;
  const color = p >= 1 ? "bg-emerald-500" : p >= 0.5 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-stone-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-stone-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${p * 100}%`, transition: "width 500ms ease" }} />
      </div>
      <span className="w-20 text-right text-stone-600 tabular-nums shrink-0">{have}/{need}{unit}</span>
    </div>
  );
}

// ---------- メイン ----------
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [noStorage, setNoStorage] = useState(false);
  const [saveState, setSaveState] = useState("");
  const [bases, setBases] = useState(SEED_BASES);
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState("home");
  const [invBase, setInvBase] = useState("all");
  const [planBase, setPlanBase] = useState("b1");
  const [draft, setDraft] = useState(null); // 追加/編集フォーム
  const firstSave = useRef(true);

  // 読み込み
  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !window.storage) { setNoStorage(true); setLoaded(true); return; }
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r && r.value) {
          const d = JSON.parse(r.value);
          if (d.bases) setBases(d.bases);
          if (d.items) setItems(d.items);
        }
      } catch (e) { /* 初回はキーが無いのが正常 */ }
      setLoaded(true);
    })();
  }, []);

  // 保存
  useEffect(() => {
    if (!loaded || noStorage) return;
    if (firstSave.current) { firstSave.current = false; return; }
    (async () => {
      try {
        setSaveState("saving");
        await window.storage.set(STORAGE_KEY, JSON.stringify({ bases, items }));
        setSaveState("saved");
        setTimeout(() => setSaveState(""), 1500);
      } catch (e) { setSaveState("error"); }
    })();
  }, [bases, items, loaded, noStorage]);

  // ---------- 計算 ----------
  const stockOf = (baseId, key) =>
    items.filter((it) => it.baseId === baseId && it.reqKey === key)
      .reduce((s, it) => s + (Number(it.qty) || 0), 0);

  const supplyDays = (base, key) => {
    const per = dailyNeed(base, key);
    if (per <= 0) return null;
    return stockOf(base.id, key) / per;
  };

  const baseSummary = (base) => {
    const coreKeys = REQ_KEYS.filter((k) => REQ[k].core && dailyNeed(base, k) > 0);
    const dayVals = coreKeys.map((k) => supplyDays(base, k));
    const minDays = dayVals.length ? Math.min(...dayVals) : 0;
    return { minDays, pct: base.days > 0 ? minDays / base.days : 0 };
  };

  const expiryAlerts = items
    .map((it) => ({ it, d: daysUntil(it.expiry) }))
    .filter((x) => x.d !== null && x.d <= 30)
    .sort((a, b) => a.d - b.d);

  const shortageAlerts = [];
  bases.forEach((b) => {
    REQ_KEYS.forEach((k) => {
      const need = requiredQty(b, k);
      if (need <= 0) return;
      const have = stockOf(b.id, k);
      if (have < need) shortageAlerts.push({ base: b, key: k, have, need });
    });
  });
  const alertCount = expiryAlerts.length + shortageAlerts.length;

  // ---------- 操作 ----------
  const changeQty = (id, delta) =>
    setItems((prev) => prev.map((it) => it.id === id ? { ...it, qty: Math.max(0, (Number(it.qty) || 0) + delta) } : it));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const openAdd = (preset = {}) =>
    setDraft({ id: null, baseId: preset.baseId || bases[0].id, name: preset.name || "",
      reqKey: preset.reqKey || "water", qty: preset.qty ?? "", unit: preset.unit || "",
      expiry: "", place: "", url: "" });
  const openEdit = (it) => setDraft({ ...it });

  const saveDraft = () => {
    if (!draft.name.trim()) return;
    const rec = { ...draft, qty: Number(draft.qty) || 0 };
    if (draft.id) setItems((p) => p.map((it) => (it.id === draft.id ? rec : it)));
    else setItems((p) => [...p, { ...rec, id: uid() }]);
    setDraft(null);
  };

  const updateBase = (id, patch) => setBases((p) => p.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const resetAll = async () => {
    if (!window.confirm("すべてのデータを初期状態に戻します。よろしいですか？")) return;
    setBases(SEED_BASES); setItems([]);
    try { if (window.storage) await window.storage.delete(STORAGE_KEY); } catch (e) {}
  };

  const baseName = (id) => bases.find((b) => b.id === id)?.name || "?";

  if (!loaded) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-amber-600">
          <Sun size={40} className="animate-spin" style={{ animationDuration: "3s" }} />
          <p className="text-sm text-stone-500">備えを読み込んでいます…</p>
        </div>
      </div>
    );
  }

  // ---------- 画面 ----------
  return (
    <div className="min-h-screen bg-orange-50 text-stone-800 font-sans">
      <div className="max-w-md mx-auto pb-28">

        {/* ヘッダー */}
        <header className="px-5 pt-6 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-sm">
              <Sun size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight">ひだまり防災ボード</h1>
              <p className="text-xs text-stone-400">フェーズ1 試作 ・ 在宅避難のための見える化</p>
            </div>
          </div>
          <span className="text-xs text-stone-400 tabular-nums">
            {saveState === "saving" ? "保存中…" : saveState === "saved" ? "保存済み ✓" : saveState === "error" ? "保存エラー" : ""}
          </span>
        </header>

        {noStorage && (
          <div className="mx-5 mb-3 px-4 py-3 rounded-xl bg-amber-100 text-amber-800 text-xs">
            この環境ではデータ保存機能が使えないため、画面を閉じると入力内容は消えます。
          </div>
        )}

        {/* ===== ホーム ===== */}
        {tab === "home" && (
          <main className="px-5 space-y-4">
            <p className="text-sm text-stone-500">
              合言葉は<span className="font-semibold text-stone-700">「いま何日ぶん備えられているか」</span>。リングが目標日数に届けば、その家は在宅避難の準備完了です。
            </p>
            {bases.map((b) => {
              const s = baseSummary(b);
              const baseAlerts =
                shortageAlerts.filter((a) => a.base.id === b.id).length +
                expiryAlerts.filter((a) => a.it.baseId === b.id).length;
              return (
                <section key={b.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 flex gap-4 items-center">
                  <Ring pct={s.pct}>
                    <span className="text-xl font-bold tabular-nums leading-none">
                      {s.minDays >= 99 ? "99+" : Math.floor(s.minDays * 10) / 10}
                    </span>
                    <span className="text-[10px] text-stone-400">日分</span>
                  </Ring>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <h2 className="font-bold">{b.name}</h2>
                      <span className="text-[11px] text-stone-400">{b.tag}</span>
                    </div>
                    <p className="text-[11px] text-stone-400 mb-2">
                      目標 {b.days}日 ・ 大人{b.adults}{b.dogs > 0 ? ` ・ 犬${b.dogs}` : ""}
                      {baseAlerts > 0 && <span className="ml-2 text-red-500 font-semibold">要対応 {baseAlerts}件</span>}
                    </p>
                    <div className="space-y-1.5">
                      {REQ_KEYS.filter((k) => REQ[k].core && dailyNeed(b, k) > 0).map((k) => (
                        <MiniBar key={k} label={REQ[k].label} have={stockOf(b.id, k)} need={requiredQty(b, k)} unit={REQ[k].unit} />
                      ))}
                    </div>
                  </div>
                </section>
              );
            })}
            <p className="text-[11px] text-stone-400 leading-relaxed pt-1">
              計算根拠：大人1人1日＝水3L・3食・トイレ5回、カセットボンベ約6本/週(2人)、犬1匹1日＝水0.5L・フード1日分・シーツ3枚（目安）。リングは水・主食・トイレのうち最少の日数。
            </p>
          </main>
        )}

        {/* ===== 在庫 ===== */}
        {tab === "inv" && (
          <main className="px-5 space-y-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[{ id: "all", name: "すべて" }, ...bases].map((b) => (
                <button key={b.id} onClick={() => setInvBase(b.id)}
                  className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${invBase === b.id ? "bg-amber-400 border-amber-400 text-white font-semibold" : "bg-white border-orange-200 text-stone-500"}`}>
                  {b.name}
                </button>
              ))}
            </div>

            {items.filter((it) => invBase === "all" || it.baseId === invBase).length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-6 text-center text-sm text-stone-400">
                まだ在庫がありません。<br />下の「＋ 在庫を追加」か、計画タブの不足行から追加できます。
              </div>
            )}

            {items.filter((it) => invBase === "all" || it.baseId === invBase).map((it) => {
              const d = daysUntil(it.expiry);
              const expChip = d === null ? null : d < 0
                ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-semibold">期限切れ</span>
                : d <= 30
                ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">あと{d}日</span>
                : <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">{it.expiry}</span>;
              const unit = it.reqKey === "other" ? it.unit : REQ[it.reqKey]?.unit;
              return (
                <div key={it.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{it.name}</span>
                        {expChip}
                      </div>
                      <p className="text-[11px] text-stone-400 truncate">
                        {baseName(it.baseId)}{it.place ? ` ・ ${it.place}` : ""}{it.reqKey !== "other" ? ` ・ ${REQ[it.reqKey].label}に算入` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => changeQty(it.id, -1)} className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center active:bg-orange-100"><Minus size={14} /></button>
                      <span className="w-14 text-center text-sm font-bold tabular-nums">{it.qty}<span className="text-[10px] font-normal text-stone-400">{unit}</span></span>
                      <button onClick={() => changeQty(it.id, 1)} className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center active:bg-orange-100"><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-2 text-stone-400">
                    {(it.url || it.reqKey !== "other") && (
                      <a href={it.url || amazonSearch(REQ[it.reqKey]?.q || it.name)} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] flex items-center gap-1 text-amber-600 font-semibold">
                        <ExternalLink size={12} /> Amazonで開く
                      </a>
                    )}
                    <button onClick={() => openEdit(it)} className="text-[11px] flex items-center gap-1"><Pencil size={12} />編集</button>
                    <button onClick={() => removeItem(it.id)} className="text-[11px] flex items-center gap-1"><Trash2 size={12} />削除</button>
                  </div>
                </div>
              );
            })}

            <button onClick={() => openAdd({ baseId: invBase === "all" ? bases[0].id : invBase })}
              className="w-full py-3 rounded-2xl bg-amber-400 text-white font-bold text-sm shadow-sm active:bg-amber-500 flex items-center justify-center gap-1">
              <Plus size={16} /> 在庫を追加
            </button>
          </main>
        )}

        {/* ===== 計画 ===== */}
        {tab === "plan" && (() => {
          const b = bases.find((x) => x.id === planBase) || bases[0];
          return (
            <main className="px-5 space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {bases.map((x) => (
                  <button key={x.id} onClick={() => setPlanBase(x.id)}
                    className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border ${planBase === x.id ? "bg-amber-400 border-amber-400 text-white font-semibold" : "bg-white border-orange-200 text-stone-500"}`}>
                    {x.name}
                  </button>
                ))}
              </div>

              <section className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 space-y-3">
                <h2 className="font-bold text-sm">{b.name} の世帯設定</h2>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">大人</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateBase(b.id, { adults: Math.max(1, b.adults - 1) })} className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center"><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold tabular-nums">{b.adults}</span>
                    <button onClick={() => updateBase(b.id, { adults: b.adults + 1 })} className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-stone-500">犬</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateBase(b.id, { dogs: Math.max(0, b.dogs - 1) })} className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center"><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold tabular-nums">{b.dogs}</span>
                    <button onClick={() => updateBase(b.id, { dogs: b.dogs + 1 })} className="w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                </div>
                <div>
                  <p className="text-stone-500 text-sm mb-2">備蓄目標</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 14, 30].map((d) => (
                      <button key={d} onClick={() => updateBase(b.id, { days: d })}
                        className={`py-2 rounded-xl text-sm font-bold border ${b.days === d ? "bg-amber-400 border-amber-400 text-white" : "bg-white border-orange-200 text-stone-500"}`}>
                        {d === 7 ? "1週間" : d === 14 ? "2週間" : "1ヶ月"}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="bg-white rounded-2xl shadow-sm border border-orange-100 divide-y divide-orange-50">
                {REQ_KEYS.filter((k) => dailyNeed(b, k) > 0).map((k) => {
                  const need = requiredQty(b, k);
                  const have = stockOf(b.id, k);
                  const lack = Math.max(0, need - have);
                  return (
                    <div key={k} className="p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-semibold">{REQ[k].label}</span>
                        <span className="text-xs text-stone-500 tabular-nums">必要 {need}{REQ[k].unit} / 在庫 {have}{REQ[k].unit}</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-100 overflow-hidden mb-2">
                        <div className={`h-full rounded-full ${lack === 0 ? "bg-emerald-500" : have / need >= 0.5 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${Math.min(100, (have / need) * 100)}%` }} />
                      </div>
                      {lack > 0 ? (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-red-500 font-semibold">あと {lack}{REQ[k].unit} 不足</span>
                          <div className="flex gap-2">
                            <a href={amazonSearch(REQ[k].q)} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-amber-700 font-semibold flex items-center gap-1">
                              <ExternalLink size={11} /> Amazon
                            </a>
                            <button onClick={() => openAdd({ baseId: b.id, reqKey: k, name: REQ[k].label, qty: lack })}
                              className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-400 text-white font-semibold flex items-center gap-1">
                              <Plus size={11} /> 在庫に登録
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1"><Check size={12} /> 充足しています</span>
                      )}
                    </div>
                  );
                })}
              </section>
            </main>
          );
        })()}

        {/* ===== アラート ===== */}
        {tab === "alert" && (
          <main className="px-5 space-y-4">
            {alertCount === 0 && (
              <div className="bg-white rounded-2xl border border-orange-100 p-8 text-center">
                <Sun size={32} className="mx-auto text-amber-400 mb-2" />
                <p className="text-sm font-semibold">今日の備えは晴れです</p>
                <p className="text-xs text-stone-400 mt-1">期限間近・不足はありません。</p>
              </div>
            )}

            {expiryAlerts.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-bold text-stone-500 px-1">そろそろ食べごろ（期限30日以内）</h2>
                {expiryAlerts.map(({ it, d }) => (
                  <div key={it.id} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{it.name}</p>
                      <p className="text-[11px] text-stone-400">{baseName(it.baseId)} ・ {d < 0 ? <span className="text-red-500 font-semibold">期限切れ（{-d}日前）</span> : `あと${d}日（${it.expiry}）`}</p>
                    </div>
                    <a href={it.url || amazonSearch(it.reqKey !== "other" ? REQ[it.reqKey].q : it.name)} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-[11px] px-3 py-2 rounded-xl bg-amber-400 text-white font-bold flex items-center gap-1">
                      <ExternalLink size={12} /> 買い足す
                    </a>
                  </div>
                ))}
                <p className="text-[11px] text-stone-400 px-1">食べたら在庫タブで「−」を。ローリングストックの回し時です。</p>
              </section>
            )}

            {shortageAlerts.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-bold text-stone-500 px-1">目標に足りていないもの</h2>
                {shortageAlerts.map((a, i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-orange-100 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{a.base.name}：{REQ[a.key].label}</p>
                      <p className="text-[11px] text-stone-400 tabular-nums">あと {a.need - a.have}{REQ[a.key].unit}（{a.have}/{a.need}）</p>
                    </div>
                    <a href={amazonSearch(REQ[a.key].q)} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 text-[11px] px-3 py-2 rounded-xl bg-amber-400 text-white font-bold flex items-center gap-1">
                      <ExternalLink size={12} /> Amazon
                    </a>
                  </div>
                ))}
              </section>
            )}

            <button onClick={resetAll} className="w-full py-2 text-[11px] text-stone-400 flex items-center justify-center gap-1">
              <RotateCcw size={11} /> データを初期化する
            </button>
          </main>
        )}

        {/* ===== 追加/編集フォーム ===== */}
        {draft && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-20 flex items-end justify-center" onClick={() => setDraft(null)}>
            <div className="bg-white w-full max-w-md rounded-t-3xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h2 className="font-bold">{draft.id ? "在庫を編集" : "在庫を追加"}</h2>
                <button onClick={() => setDraft(null)} className="text-stone-400"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs text-stone-500 col-span-2">品名
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="例：保存水2L×6本" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm text-stone-800" />
                </label>
                <label className="text-xs text-stone-500">拠点
                  <select value={draft.baseId} onChange={(e) => setDraft({ ...draft, baseId: e.target.value })}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm bg-white">
                    {bases.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </label>
                <label className="text-xs text-stone-500">数える種類
                  <select value={draft.reqKey} onChange={(e) => setDraft({ ...draft, reqKey: e.target.value })}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm bg-white">
                    {REQ_KEYS.map((k) => <option key={k} value={k}>{REQ[k].label}（{REQ[k].unit}）</option>)}
                    <option value="other">その他（計算対象外）</option>
                  </select>
                </label>
                <label className="text-xs text-stone-500">数量{draft.reqKey !== "other" ? `（${REQ[draft.reqKey].unit}）` : ""}
                  <input type="number" inputMode="decimal" value={draft.qty} onChange={(e) => setDraft({ ...draft, qty: e.target.value })}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm" />
                </label>
                <label className="text-xs text-stone-500">賞味・使用期限
                  <input type="date" value={draft.expiry} onChange={(e) => setDraft({ ...draft, expiry: e.target.value })}
                    min={todayStr()} className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm bg-white" />
                </label>
                <label className="text-xs text-stone-500">保管場所
                  <input value={draft.place} onChange={(e) => setDraft({ ...draft, place: e.target.value })}
                    placeholder="例：押入れ上段" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm" />
                </label>
                <label className="text-xs text-stone-500">商品ページURL（次回そこへ直行）
                  <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                    placeholder="https://www.amazon.co.jp/…" className="mt-1 w-full px-3 py-2.5 rounded-xl border border-orange-200 text-sm" />
                </label>
              </div>
              <button onClick={saveDraft} disabled={!draft.name.trim()}
                className="w-full py-3 rounded-2xl bg-amber-400 disabled:bg-stone-200 text-white font-bold text-sm">
                保存する
              </button>
            </div>
          </div>
        )}

        {/* ===== 下部タブ ===== */}
        <nav className="fixed bottom-0 left-0 right-0 z-10">
          <div className="max-w-md mx-auto bg-white border-t border-orange-100 grid grid-cols-4">
            {[
              { id: "home", label: "ホーム", icon: Home },
              { id: "inv", label: "在庫", icon: Package },
              { id: "plan", label: "計画", icon: ClipboardList },
              { id: "alert", label: "アラート", icon: Bell, badge: alertCount },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`relative py-2.5 flex flex-col items-center gap-0.5 text-[10px] ${tab === t.id ? "text-amber-600 font-bold" : "text-stone-400"}`}>
                <t.icon size={20} strokeWidth={tab === t.id ? 2.4 : 1.8} />
                {t.label}
                {t.badge > 0 && (
                  <span className="absolute top-1 right-1/2 translate-x-4 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {t.badge > 99 ? "99+" : t.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
