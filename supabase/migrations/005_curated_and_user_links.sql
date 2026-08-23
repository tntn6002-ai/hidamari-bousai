-- ベースデータ（運営が管理する共通コンテンツ）と、ユーザー個人のリンクを分ける
-- 目的:
--  (1) 運営（編集者）が入れたおすすめ動画・リンクを、全世帯が読めるようにする。
--      編集者が更新すれば、他の家族のアプリにもそのまま反映される。
--  (2) 各ユーザーが自分で追加したリンクは、本人だけが読み書きできるようにする。
--      他のユーザー・他の世帯からは、行の存在ごと見えない。
-- 方針: curated_links は「読みは全員／書きは編集者だけ」、user_links は
--       「読み書きとも本人だけ」。編集者かどうかは curators テーブルで管理する。
-- 実行: Supabase ダッシュボード → SQL Editor に貼り付けて Run。

-- ── 1) 編集者 ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.curators (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note       text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curators ENABLE ROW LEVEL SECURITY;

-- 自分が編集者かどうかだけ確認できる（他人の行は見えない）
DROP POLICY IF EXISTS "select_own_curator" ON public.curators;
CREATE POLICY "select_own_curator" ON public.curators
  FOR SELECT
  USING (user_id = auth.uid());

-- 編集者の追加・削除は、このSQL Editorからのみ行う（クライアントには権限を与えない）

CREATE OR REPLACE FUNCTION public.is_curator()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.curators WHERE user_id = auth.uid());
$$;

-- ── 2) ベースデータ（全員が読む・編集者だけが書く）──────────
CREATE TABLE IF NOT EXISTS public.curated_links (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  kind        text        NOT NULL DEFAULT 'video' CHECK (kind IN ('video', 'link')),
  title       text        NOT NULL,
  url         text        NOT NULL DEFAULT '',
  note        text        NOT NULL DEFAULT '',
  sort_order  int         NOT NULL DEFAULT 0,
  published   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.curated_links ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'curated_links' LOOP
    EXECUTE format('DROP POLICY %I ON public.curated_links', p.policyname);
  END LOOP;
END $$;

-- 公開中のものは、ログイン済みユーザー全員が読める（未ログインには見せない）
CREATE POLICY "read_published_curated" ON public.curated_links
  FOR SELECT
  USING (published AND auth.uid() IS NOT NULL);

-- 編集者は下書きも含めて全操作できる
CREATE POLICY "curator_manage_curated" ON public.curated_links
  FOR ALL
  USING (public.is_curator())
  WITH CHECK (public.is_curator());

DROP TRIGGER IF EXISTS curated_links_updated_at ON public.curated_links;
CREATE TRIGGER curated_links_updated_at
  BEFORE UPDATE ON public.curated_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 3) 個人のリンク（本人だけ）────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_links (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        NOT NULL DEFAULT auth.uid()
                         REFERENCES auth.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  url        text        NOT NULL DEFAULT '',
  note       text        NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_links_user_id_idx ON public.user_links (user_id);

ALTER TABLE public.user_links ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'user_links' LOOP
    EXECUTE format('DROP POLICY %I ON public.user_links', p.policyname);
  END LOOP;
END $$;

-- 本人の行だけ。他人からは存在も見えない（編集者であっても読めない）
CREATE POLICY "own_user_links" ON public.user_links
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP TRIGGER IF EXISTS user_links_updated_at ON public.user_links;
CREATE TRIGGER user_links_updated_at
  BEFORE UPDATE ON public.user_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ── 4) 編集者の登録 ──────────────────────────────────────────
-- このファイルにはメールアドレスを書かない（個人情報をリポジトリに残さないため）。
-- 上のSQLを実行したあと、次の1行の 'ここに自分のメールアドレス' を実際の
-- アドレスに置き換えて、SQL Editor で別途実行する。
--
--   INSERT INTO public.curators (user_id, note)
--   SELECT id, '運営' FROM auth.users WHERE email = 'ここに自分のメールアドレス'
--   ON CONFLICT (user_id) DO NOTHING;
--
-- 登録できたか確認する:
--   SELECT count(*) FROM public.curators;   -- 1 が返れば成功
