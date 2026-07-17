import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../services/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

  async function loadProfile(userId) {
    if (!userId) { setIsAdmin(false); return }
    try {
      const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
      setIsAdmin(data?.is_admin ?? false)
    } catch {
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Filet de sécurité : si getSession ne répond pas, on débloque quand même
    const safety = setTimeout(() => setLoading(false), 6000)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        return loadProfile(session?.user?.id)
      })
      .catch(() => {})
      .finally(() => { clearTimeout(safety); setLoading(false) })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true)
        setUser(session?.user ?? null)
      } else {
        setUser(session?.user ?? null)
        await loadProfile(session?.user?.id)
        if (event === 'USER_UPDATED') setIsRecovery(false)
      }
    })

    return () => { clearTimeout(safety); subscription.unsubscribe() }
  }, [])

  async function signOut() {
    await supabase?.auth.signOut()
    setIsAdmin(false)
  }

  function clearRecovery() { setIsRecovery(false) }

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signOut, isRecovery, clearRecovery }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
