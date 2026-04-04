import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, FolderOpen, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react'
import { fetchArticles } from '../services/articleService'
import { fetchProjets } from '../services/projectService'

const CATEGORIE_LABEL = { tissu: 'Tissu', fil: 'Fil', accessoire: 'Accessoire' }
const CATEGORIE_CLASS = { tissu: 'badge--rose', fil: 'badge--bleu', accessoire: 'badge--vert' }

export default function Home() {
  const [articles, setArticles] = useState([])
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchArticles(), fetchProjets()])
      .then(([a, p]) => { setArticles(a); setProjets(p) })
      .finally(() => setLoading(false))
  }, [])

  const alertes = articles.filter(a => a.seuil_alerte > 0 && a.quantite <= a.seuil_alerte)
  const projetsActifs = projets.filter(p => p.statut === 'en_cours')
  const valeurStock = articles.reduce((s, a) => s + (a.quantite ?? 0) * (a.prix_unitaire ?? 0), 0)

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Tableau de bord</h1>
      </div>

      {alertes.length > 0 && (
        <div className="alert alert--warning alert--banner">
          <AlertTriangle size={18} />
          <span><strong>{alertes.length} article{alertes.length > 1 ? 's' : ''}</strong> en stock bas</span>
          <Link to="/stock" className="alert__link">Voir le stock <ChevronRight size={14} /></Link>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--rose">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-card__value">{articles.length}</div>
            <div className="stat-card__label">Articles en stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--bleu">
            <FolderOpen size={24} />
          </div>
          <div>
            <div className="stat-card__value">{projetsActifs.length}</div>
            <div className="stat-card__label">Projets en cours</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-card__icon ${alertes.length > 0 ? 'stat-card__icon--warning' : 'stat-card__icon--vert'}`}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-card__value">{alertes.length}</div>
            <div className="stat-card__label">Alertes stock bas</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--lavande">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="stat-card__value">{valeurStock.toFixed(2)} €</div>
            <div className="stat-card__label">Valeur du stock</div>
          </div>
        </div>
      </div>

      {alertes.length > 0 && (
        <section className="section">
          <h2 className="section__title">
            <AlertTriangle size={18} /> Articles en stock bas
          </h2>
          <div className="article-grid">
            {alertes.map(a => (
              <div key={a.id} className="article-card article-card--alert">
                <div className="article-card__header">
                  <span className={`badge ${CATEGORIE_CLASS[a.categorie]}`}>
                    {CATEGORIE_LABEL[a.categorie]}
                  </span>
                  <span className="badge badge--danger">Stock bas</span>
                </div>
                <div className="article-card__name">{a.nom}</div>
                <div className="article-card__qty">
                  {a.quantite} {a.unite} restants
                  <span className="article-card__seuil"> / seuil : {a.seuil_alerte}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section__title">Raccourcis</h2>
        <div className="shortcut-grid">
          <Link to="/stock" className="shortcut-card">
            <Package size={28} />
            <span>Gérer le stock</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/projets" className="shortcut-card">
            <FolderOpen size={28} />
            <span>Mes projets</span>
            <ChevronRight size={16} />
          </Link>
          <Link to="/stats" className="shortcut-card">
            <TrendingUp size={28} />
            <span>Statistiques</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}
