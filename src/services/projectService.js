import { supabase } from './supabaseClient'

export async function fetchProjets() {
  const { data, error } = await supabase
    .from('projets')
    .select('*, projet_articles(id)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchProjetDetail(id) {
  const { data, error } = await supabase
    .from('projets')
    .select('*, projet_articles(*, articles(nom, unite, quantite, prix_unitaire))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createProjet(projet) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('projets')
    .insert({ ...projet, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProjet(id, updates) {
  const { data, error } = await supabase
    .from('projets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProjet(id) {
  const { error } = await supabase.from('projets').delete().eq('id', id)
  if (error) throw error
}

export async function addMateriau(materiau) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('projet_articles')
    .insert({ ...materiau, user_id: user.id })
    .select('*, articles(nom, unite, quantite, prix_unitaire)')
    .single()
  if (error) throw error
  return data
}

export async function updateMateriau(id, updates) {
  const { data, error } = await supabase
    .from('projet_articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMateriau(id) {
  const { error } = await supabase.from('projet_articles').delete().eq('id', id)
  if (error) throw error
}

// Déduire la quantité du stock pour un matériau
export async function deduireStock(materiau) {
  const { data: article, error: fetchErr } = await supabase
    .from('articles')
    .select('quantite')
    .eq('id', materiau.article_id)
    .single()
  if (fetchErr) throw fetchErr

  if (article.quantite < materiau.quantite) {
    throw new Error(`Stock insuffisant pour "${materiau.nom_article}" (${article.quantite} ${materiau.unite} disponible)`)
  }

  const { error: updateErr } = await supabase
    .from('articles')
    .update({ quantite: article.quantite - materiau.quantite })
    .eq('id', materiau.article_id)
  if (updateErr) throw updateErr

  const { data, error } = await supabase
    .from('projet_articles')
    .update({ deduit: true })
    .eq('id', materiau.id)
    .select()
    .single()
  if (error) throw error
  return data
}
