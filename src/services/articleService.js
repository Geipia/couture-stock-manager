import { supabase } from './supabaseClient'

export async function fetchArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('nom')
  if (error) throw error
  return data ?? []
}

export async function createArticle(article) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('articles')
    .insert({ ...article, user_id: user.id })
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

  // Fetch current quantity
  const { data: article, error: fetchErr } = await supabase
    .from('articles')
    .select('quantite')
    .eq('id', entry.article_id)
    .single()
  if (fetchErr) throw fetchErr

  // Insert entry
  const { data, error } = await supabase
    .from('stock_entries')
    .insert({ ...entry, user_id: user.id })
    .select()
    .single()
  if (error) throw error

  // Update article quantity
  const { error: updateErr } = await supabase
    .from('articles')
    .update({ quantite: (article.quantite ?? 0) + entry.quantite })
    .eq('id', entry.article_id)
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
