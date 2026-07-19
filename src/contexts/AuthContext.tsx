import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { insertSeedBases } from '../lib/db'

export interface Member {
  id: string
  household_id: string
  user_id: string
  display_name: string
  role: 'owner' | 'member'
}

export interface Household {
  id: string
  name: string
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  member: Member | null
  household: Household | null
  loading: boolean
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  createHousehold: (householdName: string, displayName: string) => Promise<void>
  joinHousehold: (token: string, displayName: string) => Promise<void>
  refreshMember: () => Promise<void>
  generateInvite: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchMember = async (userId: string) => {
    const { data } = await supabase
      .from('members')
      .select('*, households(*)')
      .eq('user_id', userId)
      .maybeSingle()

    if (data) {
      const { households, ...memberData } = data as Member & { households: Household }
      setMember(memberData)
      setHousehold(households ?? null)
    } else {
      setMember(null)
      setHousehold(null)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchMember(session.user.id).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchMember(session.user.id)
      } else {
        setMember(null)
        setHousehold(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string) => {
    // ログイン後は現在のURL（?invite=... を含む）へ戻す。
    // これで招待リンク経由でも招待トークンが失われず、
    // 認証後にコードを手入力しなくても参加フローへ進める。
    const redirectTo = window.location.origin + window.location.pathname + window.location.search
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const createHousehold = async (householdName: string, displayName: string) => {
    if (!user) throw new Error('Not authenticated')

    // UUIDをクライアント側で生成してINSERT後のSELECTを回避（RLS循環依存の解消）
    const householdId = crypto.randomUUID()

    const { error: hErr } = await supabase
      .from('households')
      .insert({ id: householdId, name: householdName })
    if (hErr) throw hErr

    const { error: mErr } = await supabase
      .from('members')
      .insert({ household_id: householdId, user_id: user.id, display_name: displayName, role: 'owner' })
    if (mErr) throw mErr

    // メンバー作成後はRLSが通るので改めてSELECT
    const { data: hData } = await supabase.from('households').select('*').eq('id', householdId).single()
    const { data: mData } = await supabase.from('members').select('*').eq('user_id', user.id).single()
    if (!hData || !mData) throw new Error('データの取得に失敗しました')

    // 初期拠点を投入（エラーは無視して続行）
    await insertSeedBases(householdId).catch(() => {})

    setHousehold(hData)
    setMember(mData)
  }

  const joinHousehold = async (token: string, displayName: string) => {
    if (!user) throw new Error('Not authenticated')

    const { data: invite, error: iErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token.trim())
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()
    if (iErr || !invite) throw new Error('招待リンクが無効か期限切れです')

    // INSERT時に .select() を連結すると RETURNING の RLS 評価で my_household_id() が
    // まだ自分のメンバー行を見られず 0 行になり失敗する（createHousehold と同じ循環依存）。
    // 行を作ってから改めて SELECT する。
    const { error: mErr } = await supabase
      .from('members')
      .insert({ household_id: invite.household_id, user_id: user.id, display_name: displayName, role: 'member' })
    if (mErr) throw mErr

    await supabase.from('invitations').update({ used_at: new Date().toISOString() }).eq('id', invite.id)

    // メンバー作成後はRLSが通るので改めてSELECT
    const { data: mData } = await supabase.from('members').select('*').eq('user_id', user.id).single()
    const { data: hData } = await supabase.from('households').select('*').eq('id', invite.household_id).single()
    if (!mData || !hData) throw new Error('参加に失敗しました')
    setHousehold(hData)
    setMember(mData)
  }

  const refreshMember = async () => {
    if (user) await fetchMember(user.id)
  }

  const generateInvite = async (): Promise<string> => {
    if (!household) throw new Error('No household')
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { error } = await supabase
      .from('invitations')
      .insert({ household_id: household.id, token, expires_at: expiresAt })
    if (error) throw error
    return token
  }

  return (
    <AuthContext.Provider value={{ user, session, member, household, loading, signIn, signOut, createHousehold, joinHousehold, refreshMember, generateInvite }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
