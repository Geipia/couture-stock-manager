import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LogIn, Store, ArrowLeft, Crown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import { fetchAllUsersWithWorkspaces } from '../services/workspaceService'

export default function AdminAccounts() {
  const { isAdmin } = useAuth()
  const { selectWorkspace } = useWorkspace()
  const { showToast: addToast } = useToast()
  const navigate = useNavigate()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return }
    fetchAllUsersWithWorkspaces()
      .then(setUsers)
      .catch(err => addToast(err.message, 'error'))
      .finally(() => setLoading(false))
  }, [isAdmin])

  function enterWorkspace(ws) {
    selectWorkspace(ws)
    navigate('/')
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/workspaces')}>
          <ArrowLeft size={16} /> Retour
        </button>
        <h1><ShieldCheck size={20} /> Tous les comptes</h1>
      </div>

      <div className="accounts-list">
        {users.map(u => (
          <div key={u.id} className="account-row">
            <div className="account-row__info">
              <div className="account-avatar">{(u.email?.[0] ?? '?').toUpperCase()}</div>
              <div>
                <div className="account-email">
                  {u.email}
                  {u.is_admin && (
                    <span className="badge badge--admin"><Crown size={10} /> Admin</span>
                  )}
                </div>
                {u.display_name && <div className="account-name">{u.display_name}</div>}
                <div className="account-meta">
                  <Store size={12} /> {u.workspaces.length} espace{u.workspaces.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div className="account-row__workspaces">
              {u.workspaces.length === 0 ? (
                <span className="account-empty">Aucun espace</span>
              ) : (
                u.workspaces.map(ws => (
                  <button key={ws.id} className="btn btn--primary btn--sm" onClick={() => enterWorkspace(ws)}>
                    <LogIn size={14} /> Se connecter — {ws.name}
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
