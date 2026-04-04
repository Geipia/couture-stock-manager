import { useEffect, useState } from 'react'
import { Plus, Trash2, CheckCircle, Circle, FolderOpen, Edit2, ChevronDown, ChevronUp } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import { fetchProjets, fetchProjetDetail, createProjet, updateProjet, deleteProjet, addMateriau, updateMateriau, deleteMateriau, deduireStock } from '../services/projectService'
import { fetchArticles } from '../services/articleService'

const STATUT_LABEL = { en_cours: 'En cours', termine: 'Terminé', annule: 'Annulé' }
const STATUT_CLASS = { en_cours: 'badge--bleu', termine: 'badge--vert', annule: 'badge--grey' }
const CAT_CLASS = { tissu: 'badge--rose', fil: 'badge--bleu', accessoire: 'badge--vert' }

export default function Projects() {
  const { showToast } = useToast()
  const [projets, setProjets] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null) // project id
  const [detail, setDetail] = useState(null) // full project detail
  const [projetModal, setProjetModal] = useState(null) // null | 'create' | projet obj
  const [materiauModal, setMateriauModal] = useState(null) // project id
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [form, setForm] = useState({ nom: '', description: '', client: '', statut: 'en_cours' })
  const [matForm, setMatForm] = useState({ article_id: '', quantite: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [p, a] = await Promise.all([fetchProjets(), fetchArticles()])
      setProjets(p)
      setArticles(a)
    } catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  async function toggleExpand(id) {
    if (expanded === id) { setExpanded(null); setDetail(null); return }
    setExpanded(id)
    try {
      const d = await fetchProjetDetail(id)
      setDetail(d)
    } catch (e) { showToast(e.message, 'error') }
  }

  async function saveProjet(e) {
    e.preventDefault()
    setSaving(true)
    try {
      let saved
      if (projetModal === 'create') {
        saved = await createProjet(form)
        setProjets(prev => [{ ...saved, projet_articles: [] }, ...prev])
      } else {
        saved = await updateProjet(projetModal.id, form)
        setProjets(prev => prev.map(p => p.id === saved.id ? { ...p, ...saved } : p))
        if (detail?.id === saved.id) setDetail(d => ({ ...d, ...saved }))
      }
      setProjetModal(null)
      showToast(projetModal === 'create' ? 'Projet créé !' : 'Projet mis à jour !')
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleDeleteProjet(id) {
    try {
      await deleteProjet(id)
      setProjets(prev => prev.filter(p => p.id !== id))
      if (expanded === id) { setExpanded(null); setDetail(null) }
      setDeleteConfirm(null)
      showToast('Projet supprimé.')
    } catch (e) { showToast(e.message, 'error') }
  }

  async function saveMateriau(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const article = articles.find(a => a.id === matForm.article_id)
      const mat = await addMateriau({
        projet_id: materiauModal,
        article_id: matForm.article_id,
        nom_article: article?.nom ?? '',
        unite: article?.unite ?? 'pièce',
        quantite: Number(matForm.quantite),
        deduit: false,
      })
      setDetail(d => d ? { ...d, projet_articles: [...(d.projet_articles ?? []), mat] } : d)
      setMateriauModal(null)
      setMatForm({ article_id: '', quantite: '' })
      showToast('Matériau ajouté !')
    } catch (err) { showToast(err.message, 'error') }
    finally { setSaving(false) }
  }

  async function handleDeduire(mat) {
    try {
      const updated = await deduireStock(mat)
      setDetail(d => d ? {
        ...d,
        projet_articles: d.projet_articles.map(m => m.id === updated.id ? { ...m, ...updated } : m)
      } : d)
      showToast(`"${mat.nom_article}" déduit du stock.`)
      // Refresh articles list
      const refreshed = await fetchArticles()
      setArticles(refreshed)
    } catch (e) { showToast(e.message, 'error') }
  }

  async function handleDeleteMat(mat) {
    try {
      await deleteMateriau(mat.id)
      setDetail(d => d ? { ...d, projet_articles: d.projet_articles.filter(m => m.id !== mat.id) } : d)
      showToast('Matériau supprimé.')
    } catch (e) { showToast(e.message, 'error') }
  }

  function openCreateProjet() {
    setForm({ nom: '', description: '', client: '', statut: 'en_cours' })
    setProjetModal('create')
  }

  function openEditProjet(p) {
    setForm({ nom: p.nom, description: p.description ?? '', client: p.client ?? '', statut: p.statut })
    setProjetModal(p)
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projets</h1>
        <button className="btn btn--primary" onClick={openCreateProjet}>
          <Plus size={16} /> Nouveau projet
        </button>
      </div>

      {projets.length === 0 ? (
        <div className="empty-state">
          <FolderOpen size={48} />
          <p>Aucun projet pour l'instant</p>
          <button className="btn btn--primary" onClick={openCreateProjet}>Créer un projet</button>
        </div>
      ) : (
        <div className="project-list">
          {projets.map(p => {
            const isOpen = expanded === p.id
            const mats = detail?.id === p.id ? detail.projet_articles : null
            const nbMats = p.projet_articles?.length ?? 0

            return (
              <div key={p.id} className="project-card">
                <div className="project-card__header" onClick={() => toggleExpand(p.id)}>
                  <div className="project-card__info">
                    <span className="project-card__name">{p.nom}</span>
                    {p.client && <span className="project-card__client">{p.client}</span>}
                  </div>
                  <div className="project-card__meta">
                    <span className={`badge ${STATUT_CLASS[p.statut]}`}>{STATUT_LABEL[p.statut]}</span>
                    <span className="text-muted">{nbMats} matériau{nbMats !== 1 ? 'x' : ''}</span>
                    <button className="icon-btn" onClick={e => { e.stopPropagation(); openEditProjet(p) }}><Edit2 size={15} /></button>
                    <button className="icon-btn icon-btn--danger" onClick={e => { e.stopPropagation(); setDeleteConfirm(p) }}><Trash2 size={15} /></button>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="project-card__body">
                    {p.description && <p className="project-card__desc">{p.description}</p>}

                    <div className="project-mat__header">
                      <h3>Matériaux</h3>
                      <button className="btn btn--secondary btn--sm" onClick={() => { setMateriauModal(p.id); setMatForm({ article_id: '', quantite: '' }) }}>
                        <Plus size={14} /> Ajouter
                      </button>
                    </div>

                    {mats === null ? (
                      <div className="spinner spinner--sm" />
                    ) : mats.length === 0 ? (
                      <p className="text-muted">Aucun matériau. Ajoutez des articles à ce projet.</p>
                    ) : (
                      <table className="table">
                        <thead>
                          <tr><th>Article</th><th>Quantité</th><th>Déduit</th><th>Actions</th></tr>
                        </thead>
                        <tbody>
                          {mats.map(m => (
                            <tr key={m.id} className={m.deduit ? 'row--done' : ''}>
                              <td>
                                {m.nom_article}
                                {m.articles?.categorie && (
                                  <span className={`badge badge--sm ${CAT_CLASS[m.articles.categorie]}`} style={{ marginLeft: '0.5rem' }}>
                                    {m.articles.categorie}
                                  </span>
                                )}
                              </td>
                              <td>{m.quantite} {m.unite}</td>
                              <td>
                                {m.deduit
                                  ? <CheckCircle size={18} className="icon--vert" />
                                  : <Circle size={18} className="icon--muted" />}
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {!m.deduit && m.article_id && (
                                    <button className="btn btn--sm btn--primary" onClick={() => handleDeduire(m)}>
                                      Déduire du stock
                                    </button>
                                  )}
                                  {!m.deduit && (
                                    <button className="icon-btn icon-btn--danger" onClick={() => handleDeleteMat(m)}>
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Créer / modifier projet */}
      {projetModal !== null && (
        <Modal title={projetModal === 'create' ? 'Nouveau projet' : 'Modifier le projet'} onClose={() => setProjetModal(null)}>
          <form onSubmit={saveProjet} className="form-grid">
            <div className="form-group form-group--full">
              <label className="form-label">Nom du projet *</label>
              <input className="form-input" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex: Trousse basique" />
            </div>
            <div className="form-group">
              <label className="form-label">Client</label>
              <input className="form-input" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select className="form-select" value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Description</label>
              <textarea className="form-input form-textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-actions form-group--full">
              <button type="button" className="btn btn--ghost" onClick={() => setProjetModal(null)}>Annuler</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Ajouter matériau */}
      {materiauModal && (
        <Modal title="Ajouter un matériau" onClose={() => setMateriauModal(null)}>
          <form onSubmit={saveMateriau} className="form-grid">
            <div className="form-group form-group--full">
              <label className="form-label">Article *</label>
              <select className="form-select" required value={matForm.article_id} onChange={e => setMatForm(f => ({ ...f, article_id: e.target.value }))}>
                <option value="">— Choisir un article —</option>
                {articles.map(a => (
                  <option key={a.id} value={a.id}>{a.nom} ({a.quantite} {a.unite} dispo)</option>
                ))}
              </select>
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Quantité *</label>
              <input className="form-input" type="number" step="0.01" min="0.01" required value={matForm.quantite} onChange={e => setMatForm(f => ({ ...f, quantite: e.target.value }))} />
            </div>
            <div className="form-actions form-group--full">
              <button type="button" className="btn btn--ghost" onClick={() => setMateriauModal(null)}>Annuler</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>Ajouter</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation suppression projet */}
      {deleteConfirm && (
        <Modal title="Supprimer le projet" onClose={() => setDeleteConfirm(null)}>
          <p>Supprimer <strong>{deleteConfirm.nom}</strong> ? Cette action est irréversible.</p>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>Annuler</button>
            <button className="btn btn--danger" onClick={() => handleDeleteProjet(deleteConfirm.id)}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
