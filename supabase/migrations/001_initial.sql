-- ひだまり防災ボード Phase 1 スキーマ
-- Supabase SQL Editorに貼り付けて実行する

-- ── 世帯 ──────────────────────────────────────
CREATE TABLE households (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- ── メンバー ──────────────────────────────────
CREATE TABLE members (
  id           uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid  NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      uuid  REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text  NOT NULL,
  role         text  NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at   timestamptz DEFAULT now()
);

-- ── 拠点 ──────────────────────────────────────
CREATE TABLE bases (
  id               uuid  DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id     uuid  NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  kind             text  NOT NULL DEFAULT 'home' CHECK (kind IN ('home', 'work')),
  anon_code        text,
  label            text  NOT NULL,
  tag              text  DEFAULT '',
  adults           int   NOT NULL DEFAULT 1,
  dogs             int   NOT NULL DEFAULT 0,
  target_days      int   NOT NULL DEFAULT 7,
  interrupt_switch text  DEFAULT '',
  share_level      text  NOT NULL DEFAULT 'summary'
                         CHECK (share_level IN ('detail', 'summary', 'private')),
  notes            text  DEFAULT '',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- ── 在庫品目 ──────────────────────────────────
CREATE TABLE items (
  id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  base_id     uuid    NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  name        text    NOT NULL,
  req_key     text    NOT NULL DEFAULT 'other',
  qty         numeric NOT NULL DEFAULT 0,
  unit        text    NOT NULL DEFAULT '',
  expiry      date,
  place       text    NOT NULL DEFAULT '',
  product_url text    NOT NULL DEFAULT '',
  jan         text    NOT NULL DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ── updated_at 自動更新 ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER bases_updated_at
  BEFORE UPDATE ON bases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── RLS 有効化 ────────────────────────────────
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE items      ENABLE ROW LEVEL SECURITY;

-- ── ヘルパー関数（自世帯IDを返す）─────────────
CREATE OR REPLACE FUNCTION my_household_id()
RETURNS uuid AS $$
  SELECT household_id
  FROM members
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── RLS ポリシー: households ──────────────────
CREATE POLICY "自世帯のみ参照"
  ON households FOR SELECT
  USING (id = my_household_id());

-- ── RLS ポリシー: members ─────────────────────
CREATE POLICY "自世帯のメンバーを参照"
  ON members FOR SELECT
  USING (household_id = my_household_id());

CREATE POLICY "自分のメンバーレコードを更新"
  ON members FOR UPDATE
  USING (user_id = auth.uid());

-- ── RLS ポリシー: bases ───────────────────────
-- 自世帯の拠点は全操作可
CREATE POLICY "自世帯の拠点を全操作"
  ON bases FOR ALL
  USING (household_id = my_household_id());

-- 他世帯の拠点はshare_levelに応じて参照のみ
CREATE POLICY "他世帯の拠点をsummary以上で参照"
  ON bases FOR SELECT
  USING (
    share_level IN ('detail', 'summary')
    AND EXISTS (
      SELECT 1 FROM members m
      WHERE m.user_id = auth.uid()
    )
  );

-- ── RLS ポリシー: items ───────────────────────
-- 自世帯の在庫は全操作可
CREATE POLICY "自世帯の在庫を全操作"
  ON items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM bases b
      WHERE b.id = items.base_id
        AND b.household_id = my_household_id()
    )
  );

-- 他世帯の在庫はbase.share_level='detail'の場合のみ参照可
CREATE POLICY "detail共有の他世帯在庫を参照"
  ON items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bases b
      WHERE b.id = items.base_id
        AND b.share_level = 'detail'
        AND EXISTS (SELECT 1 FROM members m WHERE m.user_id = auth.uid())
    )
  );

-- ── 招待トークンテーブル（世帯招待用）────────
CREATE TABLE invitations (
  id           uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid    NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  token        text    NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  invited_by   uuid    REFERENCES auth.users(id),
  used_at      timestamptz,
  expires_at   timestamptz DEFAULT now() + interval '7 days',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自世帯のオーナーが招待を作成・参照"
  ON invitations FOR ALL
  USING (
    household_id = my_household_id()
    AND EXISTS (
      SELECT 1 FROM members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 招待トークン検証は公開（認証不要）
CREATE POLICY "トークンで招待を参照（未認証可）"
  ON invitations FOR SELECT
  USING (used_at IS NULL AND expires_at > now());
