import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variables d\'environnement Supabase manquantes. Vérifiez vos secrets GitHub.')
}

// Lock "no-op" : on court-circuite l'API Web Locks de supabase-js.
// Par défaut, gotrue-js verrouille le token d'auth via navigator.locks ;
// des appels concurrents (getSession + getUser + onAuthStateChange) peuvent
// bloquer ce verrou indéfiniment ("Lock was stolen...") et figer toutes les
// requêtes. Pour une app mono-onglet, on exécute simplement la fonction sans verrou.
const noOpLock = async (_name, _acquireTimeout, fn) => await fn()

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storageKey: 'couture-stock-auth',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        lock: noOpLock,
      },
    })
  : null
