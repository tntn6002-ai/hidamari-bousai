-- 世帯間の分離を厳格化する
-- 目的: 別世帯（別の家族・友人）から拠点(bases)・在庫(items)が一切見えないようにする。
-- 背景: 001 の「他世帯の拠点をsummary以上で参照」「detail共有の他世帯在庫を参照」ポリシーは、
--       ログイン済みユーザーなら他世帯の拠点を読めてしまう。アプリは自世帯のみ取得するが、
--       RLS レベルでも自世帯限定に統一する。
-- 実行: Supabase ダッシュボード → SQL Editor に貼り付けて Run。

-- RLS が有効であることを保証（無効だと全開放になるため）
ALTER TABLE public.bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- bases / items の既存ポリシーをすべて削除してから作り直す（名前の差異に依存しない）
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'bases' LOOP
    EXECUTE format('DROP POLICY %I ON public.bases', p.policyname);
  END LOOP;
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'items' LOOP
    EXECUTE format('DROP POLICY %I ON public.items', p.policyname);
  END LOOP;
END $$;

-- 自分の世帯の拠点だけ、全操作可
CREATE POLICY "own_household_bases" ON public.bases
  FOR ALL
  USING (household_id = my_household_id())
  WITH CHECK (household_id = my_household_id());

-- 自分の世帯の拠点に属する在庫だけ、全操作可
CREATE POLICY "own_household_items" ON public.items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.bases b
                 WHERE b.id = items.base_id AND b.household_id = my_household_id()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bases b
                 WHERE b.id = items.base_id AND b.household_id = my_household_id()));
