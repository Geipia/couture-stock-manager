import { supabase } from './supabaseClient'

export async function fetchStatsArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('id, nom, categorie, quantite, prix_unitaire')
    .order('nom')
  if (error) throw error
  return data ?? []
}

export async function fetchConsommationParProjet() {
  const { data, error } = await supabase
    .from('projet_articles')
    .select('quantite, nom_article, unite, deduit, projets(nom), articles(prix_unitaire, categorie)')
    .eq('deduit', true)
  if (error) throw error
  return data ?? []
}

export async function fetchTopArticles() {
  // Articles les plus consommés (via projet_articles déduits)
  const { data, error } = await supabase
    .from('projet_articles')
    .select('nom_article, quantite, unite, articles(prix_unitaire, categorie)')
    .eq('deduit', true)
  if (error) throw error

  // Agréger par nom_article
  const map = {}
  for (const row of (data ?? [])) {
    const key = row.nom_article
    if (!map[key]) map[key] = { nom: key, quantite: 0, valeur: 0, unite: row.unite }
    map[key].quantite += row.quantite
    map[key].valeur += row.quantite * (row.articles?.prix_unitaire ?? 0)
  }
  return Object.values(map).sort((a, b) => b.quantite - a.quantite).slice(0, 10)
}

export async function fetchParCategorie() {
  const { data, error } = await supabase
    .from('projet_articles')
    .select('quantite, articles(categorie)')
    .eq('deduit', true)
  if (error) throw error

  const map = { tissu: 0, fil: 0, accessoire: 0 }
  for (const row of (data ?? [])) {
    const cat = row.articles?.categorie
    if (cat && map[cat] !== undefined) map[cat] += row.quantite
  }
  return map
}

export async function fetchProjetsCoûteux() {
  const { data, error } = await supabase
    .from('projets')
    .select('id, nom, projet_articles(quantite, deduit, articles(prix_unitaire))')
  if (error) throw error

  return (data ?? [])
    .map(p => ({
      nom: p.nom,
      cout: (p.projet_articles ?? [])
        .filter(pa => pa.deduit)
        .reduce((sum, pa) => sum + pa.quantite * (pa.articles?.prix_unitaire ?? 0), 0)
    }))
    .filter(p => p.cout > 0)
    .sort((a, b) => b.cout - a.cout)
    .slice(0, 8)
}
