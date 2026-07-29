-- 招待リンクの安全強化
-- 目的: 他世帯のユーザーが invitations テーブルから有効な招待トークン一覧を
--       読み取れる状態（001 の「トークンで招待を参照（未認証可）」）を解消する。
-- 方針: 招待の検証・参加・使用済み化をサーバー側関数 redeem_invite に集約し、
--       クライアントからの invitations 直読み（公開SELECT）を廃止する。
-- 実行: Supabase ダッシュボード → SQL Editor に貼り付けて Run。

-- 1) 招待を安全に引き換える関数（SECURITY DEFINER で RLS を跨いで検証・登録）
CREATE OR REPLACE FUNCTION public.redeem_invite(invite_token text, display_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.invitations%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO inv FROM public.invitations
   WHERE token = invite_token
     AND used_at IS NULL
     AND expires_at > now()
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_or_expired';
  END IF;

  -- すでにどこかの世帯に参加済みなら、その世帯を返して二重登録を防ぐ
  IF EXISTS (SELECT 1 FROM public.members WHERE user_id = uid) THEN
    RETURN (SELECT household_id FROM public.members WHERE user_id = uid LIMIT 1);
  END IF;

  INSERT INTO public.members (household_id, user_id, display_name, role)
  VALUES (inv.household_id, uid, display_name, 'member');

  UPDATE public.invitations SET used_at = now() WHERE id = inv.id;

  RETURN inv.household_id;
END;
$$;

-- 2) invitations のポリシーを作り直す（一般公開SELECTを撤去）
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname = 'public' AND tablename = 'invitations' LOOP
    EXECUTE format('DROP POLICY %I ON public.invitations', p.policyname);
  END LOOP;
END $$;

-- オーナーだけが自世帯の招待を作成・閲覧できる（参加は redeem_invite 関数経由）
CREATE POLICY "owner_manage_invites" ON public.invitations
  FOR ALL
  USING (household_id = my_household_id()
         AND EXISTS (SELECT 1 FROM public.members
                     WHERE user_id = auth.uid() AND role = 'owner'))
  WITH CHECK (household_id = my_household_id()
         AND EXISTS (SELECT 1 FROM public.members
                     WHERE user_id = auth.uid() AND role = 'owner'));
