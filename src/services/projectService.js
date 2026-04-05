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

// Ajoute un matériau et déduit automatiquement du stock
export async function addMateriau(materiau) {
  const { data: { user } } = await supabase.auth.getUser()

  // Vérifier et déduire le stock immédiatement
  if (materiau.article_id) {
    const { data: article, error: fetchErr } = await supabase
      .from('articles')
      .select('quantite, nom')
      .eq('id', materiau.article_id)
      .single()
    if (fetchErr) throw fetchErr

    if (article.quantite < materiau.quantite) {
      throw new Error(
        `Stock insuffisant pour "${article.nom}" : ${article.quantite} ${materiau.unite} disponible`
      )
    }

    const { error: updateErr } = await supabase
      .from('articles')
      .update({ quantite: article.quantite - materiau.quantite })
      .eq('id', materiau.article_id)
    if (updateErr) throw updateErr
  }

  const { data, error } = await supabase
    .from('projet_articles')
    .insert({ ...materiau, user_id: user.id, deduit: true })
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

// Supprime un matériau et remet la quantité en stock
export async function deleteMateriau(id) {
  const { data: mat, error: fetchErr } = await supabase
    .from('projet_articles')
    .select('article_id, quantite, deduit')
    .eq('id', id)
    .single()
  if (fetchErr) throw fetchErr

  // Restituer le stock si la déduction a été faite
  if (mat.deduit && mat.article_id) {
    const { data: article } = await supabase
      .from('articles')
      .select('quantite')
      .eq('id', mat.article_id)
      .single()

    if (article) {
      await supabase
        .from('articles')
        .update({ quantite: article.quantite + mat.quantite })
        .eq('id', mat.article_id)
    }
  }

  const { error } = await supabase.from('projet_articles').delete().eq('id', id)
  if (error) throw error
}
