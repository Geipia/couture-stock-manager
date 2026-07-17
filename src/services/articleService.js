import { supabase } from './supabaseClient'

export async function fetchArticles(workspaceId) {
  let query = supabase.from('articles').select('*').order('nom')
  if (workspaceId) query = query.eq('workspace_id', workspaceId)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createArticle(article, workspaceId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('articles')
    .insert({ ...article, user_id: user.id, workspace_id: workspaceId })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateArticle(id, updates) {
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteArticle(id) {
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw error
}

export async function fetchStockEntries(articleId) {
  const { data, error } = await supabase
    .from('stock_entries')
    .select('*')
    .eq('article_id', articleId)
    .order('date_achat', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function addStockEntry(entry) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: article, error: fetchErr } = await supabase
    .from('articles')
    .select('quantite')
    .eq('id', entry.article_id)
    .single()
  if (fetchErr) throw fetchErr

  const { data, error } = await supabase
    .from('stock_entries')
    .insert({ ...entry, user_id: user.id })
    .select()
    .single()
  if (error) throw error

  const { error: updateErr } = await supabase
    .from('articles')
    .update({ quantite: (article.quantite ?? 0) + entry.quantite })
    .eq('id', entry.article_id)
  if (updateErr) throw updateErr

  return data
}

export async function retirerStock({ article_id, quantite, motif, date_retrait }) {
  const { data: { user } } = await supabase.auth.getUser()

  const { data: article, error: fetchErr } = await supabase
    .from('articles')
    .select('quantite, nom')
    .eq('id', article_id)
    .single()
  if (fetchErr) throw fetchErr

  if (article.quantite < quantite) {
    throw new Error(`Stock insuffisant : ${article.quantite} disponible`)
  }

  const { data, error } = await supabase
    .from('stock_entries')
    .insert({
      article_id,
      user_id: user.id,
      quantite: -quantite,
      date_achat: date_retrait,
      notes: motif || 'Sortie manuelle',
    })
    .select()
    .single()
  if (error) throw error

  const { error: updateErr } = await supabase
    .from('articles')
    .update({ quantite: article.quantite - quantite })
    .eq('id', article_id)
  if (updateErr) throw updateErr

  return data
}

export async function uploadPhoto(userId, articleId, file) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${articleId}.${ext}`
  const { error } = await supabase.storage
    .from('article-photos')
    .upload(path, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('article-photos').getPublicUrl(path)
  return data.publicUrl
}
