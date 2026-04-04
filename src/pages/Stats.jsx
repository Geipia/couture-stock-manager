import { useEffect, useState } from 'react'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import { TrendingUp, Package, Euro, FolderOpen } from 'lucide-react'
import { fetchStatsArticles, fetchTopArticles, fetchParCategorie, fetchProjetsCoûteux } from '../services/statsService'
import { fetchProjets } from '../services/projectService'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend)

const PASTEL = ['#F9A8C9', '#89C4F4', '#95E1A3', '#C3B1E1', '#FFCBA4', '#F9C784', '#A8D8E2', '#E1B1C3']

export default function Stats() {
  const [loading, setLoading] = useState(true)
  const [articles, setArticles] = useState([])
  const [topArticles, setTopArticles] = useState([])
  const [parCategorie, setParCategorie] = useState({})
  const [projetsCoûteux, setProjetsCoûteux] = useState([])
  const [projets, setProjets] = useState([])

  useEffect(() => {
    Promise.all([
      fetchStatsArticles(),
      fetchTopArticles(),
      fetchParCategorie(),
      fetchProjetsCoûteux(),
      fetchProjets(),
    ]).then(([a, top, cat, cher, p]) => {
      setArticles(a)
      setTopArticles(top)
      setParCategorie(cat)
      setProjetsCoûteux(cher)
      setProjets(p)
    }).finally(() => setLoading(false))
  }, [])

  const valeurStock = articles.reduce((s, a) => s + (a.quantite ?? 0) * (a.prix_unitaire ?? 0), 0)
  const projetsTermines = projets.filter(p => p.statut === 'termine').length

  const chartOpts = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <h1>Statistiques</h1>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--rose"><Package size={24} /></div>
          <div>
            <div className="stat-card__value">{articles.length}</div>
            <div className="stat-card__label">Articles référencés</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--lavande"><Euro size={24} /></div>
          <div>
            <div className="stat-card__value">{valeurStock.toFixed(2)} €</div>
            <div className="stat-card__label">Valeur du stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--vert"><FolderOpen size={24} /></div>
          <div>
            <div className="stat-card__value">{projetsTermines}</div>
            <div className="stat-card__label">Projets terminés</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--bleu"><TrendingUp size={24} /></div>
          <div>
            <div className="stat-card__value">{projets.length}</div>
            <div className="stat-card__label">Projets total</div>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {topArticles.length > 0 && (
          <div className="chart-card">
            <h2 className="chart-card__title">Articles les plus consommés (quantité)</h2>
            <Bar
              options={chartOpts}
              data={{
                labels: topArticles.map(a => a.nom),
                datasets: [{
                  label: 'Quantité utilisée',
                  data: topArticles.map(a => a.quantite),
                  backgroundColor: PASTEL,
                  borderRadius: 6,
                }]
              }}
            />
          </div>
        )}

        {topArticles.some(a => a.valeur > 0) && (
          <div className="chart-card">
            <h2 className="chart-card__title">Articles les plus consommés (valeur €)</h2>
            <Bar
              options={chartOpts}
              data={{
                labels: topArticles.filter(a => a.valeur > 0).map(a => a.nom),
                datasets: [{
                  label: 'Valeur consommée (€)',
                  data: topArticles.filter(a => a.valeur > 0).map(a => a.valeur),
                  backgroundColor: PASTEL,
                  borderRadius: 6,
                }]
              }}
            />
          </div>
        )}

        {(parCategorie.tissu + parCategorie.fil + parCategorie.accessoire) > 0 && (
          <div className="chart-card chart-card--sm">
            <h2 className="chart-card__title">Consommation par catégorie</h2>
            <Doughnut
              data={{
                labels: ['Tissu', 'Fil', 'Accessoire'],
                datasets: [{
                  data: [parCategorie.tissu, parCategorie.fil, parCategorie.accessoire],
                  backgroundColor: ['#F9A8C9', '#89C4F4', '#95E1A3'],
                  borderWidth: 0,
                }]
              }}
              options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }}
            />
          </div>
        )}

        {projetsCoûteux.length > 0 && (
          <div className="chart-card">
            <h2 className="chart-card__title">Projets les plus coûteux (€)</h2>
            <Bar
              options={{ ...chartOpts, indexAxis: 'y' }}
              data={{
                labels: projetsCoûteux.map(p => p.nom),
                datasets: [{
                  label: 'Coût (€)',
                  data: projetsCoûteux.map(p => p.cout),
                  backgroundColor: PASTEL,
                  borderRadius: 6,
                }]
              }}
            />
          </div>
        )}
      </div>

      {topArticles.length === 0 && projetsCoûteux.length === 0 && (
        <div className="empty-state">
          <TrendingUp size={48} />
          <p>Pas encore de données de consommation.</p>
          <p className="text-muted">Créez des projets et déduisez du stock pour voir des statistiques.</p>
        </div>
      )}
    </div>
  )
}
