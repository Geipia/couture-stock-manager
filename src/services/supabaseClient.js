import { createClient } from '@supabase/supabase-js'

// Récupère les variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérifie que les variables sont définies
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Les variables d\'environnement Supabase ne sont pas définies.')
  throw new Error('Les variables d\'environnement Supabase ne sont pas définies.')
}

// Initialise et exporte le client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
