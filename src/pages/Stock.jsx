import { useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, PlusCircle, MinusCircle, History, Package } from 'lucide-react'
import Modal from '../components/Modal'
import { useToast } from '../context/ToastContext'
import {
  fetchArticles, createArticle, updateArticle, deleteArticle,
  fetchStockEntries, addStockEntry, retirerStock, uploadPhoto
} from '../services/articleService'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'

const CATEGORIES = [
  { value: 'tissu',      label: 'Tissu'       },
  { value: 'fil',        label: 'Fil'         },
  { value: 'accessoire', label: 'Accessoire'  },
]
const UNITES = ['mètre', 'centimètre', 'pièce', 'bobine', 'rouleau']
const CAT_CLASS = { tissu: 'badge--rose', fil: 'badge--bleu', accessoire: 'badge--vert' }

const EMPTY_ARTICLE = {
  nom: '', categorie: 'tissu', quantite: 0, unite: 'mètre',
  prix_unitaire: '', fournisseur: '', notes: '', seuil_alerte: '',
}

export default function Stock() {
  const { user } = useAuth()
  const { workspace } = useWorkspace()
  const { showToast } = useToast()
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('tous')

  // Modals
  const [articleModal, setArticleModal] = useState(null) // null | 'create' | article obj
  const [detailModal, setDetailModal] = useState(null)
  const [entreeModal, setEntreeModal] = useState(null)
  const [sortieModal, setSortieModal] = useState(null)
  const [historyModal, setHistoryModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // Forms
  const [form, setForm] = useState(EMPTY_ARTICLE)
  const [photoFile, setPhotoFile] = useState(null)
  const [entreeForm, setEntreeForm] = useState({ quantite: '', prix_unitaire: '', date_achat: new Date().toISOString().slice(0, 10), fournisseur: '', notes: '' })
  const [sortieForm, setSortieForm] = useState({ quantite: '', motif: '', date_retrait: new Date().toISOString().slice(0, 10) })
  const [entries, setEntries] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [workspace?.id])

  async function load() {
    setLoading(true)
    try { setArticles(await fetchArticles(workspace?.id)) } catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }

  const filtered = articles
    .filter(a => filtre === 'tous' || a.categorie === filtre)
    .filter(a => a.nom.toLowerCase().includes(search.toLowerCase()))

  function openCreate() { setForm(EMPTY_ARTICLE); setPhotoFile(null); setArticleModal('create') }
  function openEdit(a) { setForm({ ...a }); setPhotoFile(null); setArticleModal(a) }

  async function openHistory(a) {
    setHistoryModal(a)
    try { setEntries(await fetchStockEntries(a.id)) } catch (e) { showToast(e.message, 'error') }
  }

  function openEntree(a) {
    setEntreeModal(a)
    setEntreeForm({ quantite: '', prix_unitaire: a.prix_unitaire ?? '', date_achat: new Date().toISOString().slice(0, 10), fournisseur: '', notes: '' })
  }

  function openSortie(a) {
    setSortieModal(a)
    setSortieForm({ quantite: '', motif: '', date_retrait: new Date().toISOString().slice(0, 10) })
  }

  async function saveArticle(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        nom: form.nom, categorie: form.categorie,
        quantite: Number(form.quantite) || 0,
        unite: form.unite,
        prix_unitaire: form.prix_unitaire !== '' ? Number(form.prix_unitaire) : null,
        fournisseur: form.fournisseur || null,
        notes: form.notes || null,
        seuil_alerte: form.seuil_alerte !== '' ? Number(form.seuil_alerte) : null,
      }

      let saved
      if (articleModal === 'create') {
        saved = await createArticle(payload, workspace?.id)
      } else {
        saved = await updateArticle(articleModal.id, payload)
      }

      if (photoFile && saved) {
        const url = await uploadPhoto(user.id, saved.id, photoFile)
        await updateArticle(saved.id, { photo_url: url })
        saved.photo_url = url
      }

      setArticles(prev => articleModal === 'create'
        ? [...prev, saved]
        : prev.map(a => a.id === saved.id ? saved : a)
      )
      setArticleModal(null)
      showToast(articleModal === 'create' ? 'Article créé !' : 'Article mis à jour !')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteArticle(id)
      setArticles(prev => prev.filter(a => a.id !== id))
      setDeleteConfirm(null)
      showToast('Article supprimé.')
    } catch (e) { showToast(e.message, 'error') }
  }

  async function saveEntree(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await addStockEntry({
        article_id: entreeModal.id,
        quantite: Number(entreeForm.quantite),
        prix_unitaire: entreeForm.prix_unitaire !== '' ? Number(entreeForm.prix_unitaire) : null,
        date_achat: entreeForm.date_achat,
        fournisseur: entreeForm.fournisseur || null,
        notes: entreeForm.notes || null,
      })
      await load()
      setEntreeModal(null)
      showToast('Stock mis à jour !')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function saveSortie(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await retirerStock({
        article_id: sortieModal.id,
        quantite: Number(sortieForm.quantite),
        motif: sortieForm.motif || null,
        date_retrait: sortieForm.date_retrait,
      })
      await load()
      setSortieModal(null)
      showToast('Stock retiré !')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stock</h1>
        <button className="btn btn--primary" onClick={openCreate}>
          <Plus size={16} /> Ajouter un article
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            className="form-input"
            placeholder="Rechercher…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {['tous', 'tissu', 'fil', 'accessoire'].map(f => (
            <button
              key={f}
              className={filtre === f ? 'filter-pill filter-pill--active' : 'filter-pill'}
              onClick={() => setFiltre(f)}
            >
              {f === 'tous' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <Package size={48} />
          <p>Aucun article trouvé</p>
          <button className="btn btn--primary" onClick={openCreate}>Ajouter un article</button>
        </div>
      ) : (
        <div className="article-grid">
          {filtered.map(a => {
            const isAlert = a.seuil_alerte > 0 && a.quantite <= a.seuil_alerte
            return (
              <div key={a.id} className={`article-card ${isAlert ? 'article-card--alert' : ''}`}>
                {a.photo_url && (
                  <img
                    src={a.photo_url}
                    alt={a.nom}
                    className="article-card__photo"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                )}
                <div className="article-card__header">
                  <span className={`badge ${CAT_CLASS[a.categorie]}`}>
                    {CATEGORIES.find(c => c.value === a.categorie)?.label}
                  </span>
                  {isAlert && <span className="badge badge--danger">Stock bas</span>}
                </div>
                <div className="article-card__name">{a.nom}</div>
                <div className="article-card__qty">
                  <strong>{a.quantite}</strong> {a.unite}
                  {a.seuil_alerte > 0 && <span className="article-card__seuil"> / {a.seuil_alerte}</span>}
                </div>
                {a.prix_unitaire && <div className="article-card__price">{a.prix_unitaire} € / {a.unite}</div>}
                {a.fournisseur && <div className="article-card__supplier">{a.fournisseur}</div>}
                <div className="article-card__actions">
                  <button className="icon-btn" title="Réapprovisionner" onClick={() => openEntree(a)}>
                    <PlusCircle size={16} />
                  </button>
                  <button className="icon-btn icon-btn--warning" title="Retirer du stock" onClick={() => openSortie(a)}>
                    <MinusCircle size={16} />
                  </button>
                  <button className="icon-btn" title="Historique" onClick={() => openHistory(a)}>
                    <History size={16} />
                  </button>
                  <button className="icon-btn" title="Modifier" onClick={() => openEdit(a)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn icon-btn--danger" title="Supprimer" onClick={() => setDeleteConfirm(a)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Créer / Modifier article */}
      {articleModal !== null && (
        <Modal
          title={articleModal === 'create' ? 'Nouvel article' : 'Modifier l\'article'}
          onClose={() => setArticleModal(null)}
          size="lg"
        >
          <form onSubmit={saveArticle} className="form-grid">
            <div className="form-group form-group--full">
              <label className="form-label">Nom *</label>
              <input className="form-input" required value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Catégorie *</label>
              <select className="form-select" value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unité *</label>
              <select className="form-select" value={form.unite} onChange={e => setForm(f => ({ ...f, unite: e.target.value }))}>
                {UNITES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quantité initiale</label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.quantite} onChange={e => setForm(f => ({ ...f, quantite: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Prix unitaire (€)</label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.prix_unitaire} onChange={e => setForm(f => ({ ...f, prix_unitaire: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Seuil d'alerte</label>
              <input className="form-input" type="number" step="0.01" min="0" placeholder="ex: 2" value={form.seuil_alerte} onChange={e => setForm(f => ({ ...f, seuil_alerte: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Fournisseur</label>
              <input className="form-input" value={form.fournisseur} onChange={e => setForm(f => ({ ...f, fournisseur: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Photo</label>
              <input className="form-input" type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Notes (composition, couleur, référence…)</label>
              <textarea className="form-input form-textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="form-actions form-group--full">
              <button type="button" className="btn btn--ghost" onClick={() => setArticleModal(null)}>Annuler</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Ajout stock */}
      {entreeModal && (
        <Modal title={`Réapprovisionner — ${entreeModal.nom}`} onClose={() => setEntreeModal(null)}>
          <form onSubmit={saveEntree} className="form-grid">
            <div className="form-group">
              <label className="form-label">Quantité ajoutée *</label>
              <input className="form-input" type="number" step="0.01" min="0.01" required value={entreeForm.quantite} onChange={e => setEntreeForm(f => ({ ...f, quantite: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Prix unitaire (€)</label>
              <input className="form-input" type="number" step="0.01" min="0" value={entreeForm.prix_unitaire} onChange={e => setEntreeForm(f => ({ ...f, prix_unitaire: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date d'achat</label>
              <input className="form-input" type="date" value={entreeForm.date_achat} onChange={e => setEntreeForm(f => ({ ...f, date_achat: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Fournisseur</label>
              <input className="form-input" value={entreeForm.fournisseur} onChange={e => setEntreeForm(f => ({ ...f, fournisseur: e.target.value }))} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Notes</label>
              <textarea className="form-input form-textarea" rows={2} value={entreeForm.notes} onChange={e => setEntreeForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="form-actions form-group--full">
              <button type="button" className="btn btn--ghost" onClick={() => setEntreeModal(null)}>Annuler</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Ajouter au stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Sortie stock */}
      {sortieModal && (
        <Modal title={`Retirer du stock — ${sortieModal.nom}`} onClose={() => setSortieModal(null)}>
          <form onSubmit={saveSortie} className="form-grid">
            <div className="form-group">
              <label className="form-label">Quantité retirée * (dispo : {sortieModal.quantite} {sortieModal.unite})</label>
              <input className="form-input" type="number" step="0.01" min="0.01" max={sortieModal.quantite} required value={sortieForm.quantite} onChange={e => setSortieForm(f => ({ ...f, quantite: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date de retrait</label>
              <input className="form-input" type="date" value={sortieForm.date_retrait} onChange={e => setSortieForm(f => ({ ...f, date_retrait: e.target.value }))} />
            </div>
            <div className="form-group form-group--full">
              <label className="form-label">Motif</label>
              <input className="form-input" placeholder="ex: perte, don, utilisation…" value={sortieForm.motif} onChange={e => setSortieForm(f => ({ ...f, motif: e.target.value }))} />
            </div>
            <div className="form-actions form-group--full">
              <button type="button" className="btn btn--ghost" onClick={() => setSortieModal(null)}>Annuler</button>
              <button type="submit" className="btn btn--danger" disabled={saving}>
                {saving ? 'Enregistrement…' : 'Retirer du stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Historique */}
      {historyModal && (
        <Modal title={`Historique — ${historyModal.nom}`} onClose={() => setHistoryModal(null)} size="lg">
          {entries.length === 0 ? (
            <p className="text-muted">Aucun achat enregistré.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th><th>Quantité</th><th>Prix / u.</th><th>Fournisseur</th><th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id}>
                    <td>{e.date_achat}</td>
                    <td>{e.quantite} {historyModal.unite}</td>
                    <td>{e.prix_unitaire ? `${e.prix_unitaire} €` : '—'}</td>
                    <td>{e.fournisseur || '—'}</td>
                    <td>{e.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Modal>
      )}

      {/* Confirmation suppression */}
      {deleteConfirm && (
        <Modal title="Supprimer l'article" onClose={() => setDeleteConfirm(null)}>
          <p>Supprimer <strong>{deleteConfirm.nom}</strong> ? Cette action est irréversible.</p>
          <div className="form-actions" style={{ marginTop: '1.5rem' }}>
            <button className="btn btn--ghost" onClick={() => setDeleteConfirm(null)}>Annuler</button>
            <button className="btn btn--danger" onClick={() => handleDelete(deleteConfirm.id)}>Supprimer</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
