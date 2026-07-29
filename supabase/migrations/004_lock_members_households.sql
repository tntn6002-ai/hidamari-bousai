-- members / households の権限を厳格化する（Fable 5 セキュリティレビュー対応）
-- 目的:
--  (1) メンバーが自分の role を 'owner' に書き換える権限昇格を防ぐ。
--  (2) クライアントからの members への直接INSERT（招待なしで他世帯に
--      入り込める余地）を廃し、世帯作成はサーバー側関数に一本化する。
-- 方針: members/households の書き込みはすべて SECURITY DEFINER 関数
--       （create_household / redeem_invite）経由にし、クライアントは閲覧のみ。
-- 実行: Supabase ダッシュボード → SQL Editor に貼り付けて Run。

-- 1) 世帯作成＋オーナー登録を原子的に行う関数
CREATE OR REPLACE FUNCTION public.create_household(household_name text, display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM members WHERE user_id = uid) THEN
    RAISE EXCEPTION 'already_in_household';
  END IF;
  INSERT INTO households (name) VALUES (household_name) RETURNING id INTO new_id;
  INSERT INTO members (household_id, user_id, display_name, role)
  VALUES (new_id, uid, display_name, 'owner');
  RETURN new_id;
END;
$$;

-- 2) members: 閲覧は自世帯のみ。書き込みは関数経由のみ（直接INSERT/UPDATE禁止）
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'members' LOOP
    EXECUTE format('DROP POLICY %I ON public.members', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_own_household_members" ON public.members
  FOR SELECT
  USING (household_id = my_household_id());

-- 3) households: 閲覧は自世帯のみ。作成は create_household 関数経由のみ
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'households' LOOP
    EXECUTE format('DROP POLICY %I ON public.households', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "select_own_household" ON public.households
  FOR SELECT
  USING (id = my_household_id());
