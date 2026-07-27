import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Plus, Check, X, Store, Bell, Trash2, Crown, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import {
  fetchMyWorkspaces, fetchAllWorkspaces, createWorkspace,
  fetchMyInvitations, respondToInvitation,
} from '../services/workspaceService'

export default function WorkspaceSelector() {
  const { user, isAdmin, signOut } = useAuth()
  const { selectWorkspace } = useWorkspace()
  const { showToast: addToast } = useToast()
  const navigate = useNavigate()

  const [workspaces, setWorkspaces] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function load() {
    try {
      const [ws, inv] = await Promise.all([
        isAdmin ? fetchAllWorkspaces() : fetchMyWorkspaces(),
        fetchMyInvitations(),
      ])
      setWorkspaces(ws)
      setInvitations(inv)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [isAdmin])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const ws = await createWorkspace(newName.trim())
      addToast(`Espace "${ws.name}" créé !`, 'success')
      setNewName('')
      setShowForm(false)
      await load()
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  async function handleRespond(invId, accept) {
    try {
      await respondToInvitation(invId, accept)
      addToast(accept ? 'Invitation acceptée !' : 'Invitation refusée.', accept ? 'success' : 'info')
      await load()
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  function enter(ws) {
    selectWorkspace(ws)
    navigate('/')
  }

  function getRoleLabel(ws) {
    if (isAdmin) return null
    const me = ws.workspace_members?.find(m => m.user_id === user?.id)
    return me?.role === 'owner' ? 'Propriétaire' : 'Membre'
  }

  if (loading) return (
    <div className="ws-loading">
      <div className="spinner" />
    </div>
  )

  return (
    <div className="ws-page">
      <div className="ws-container">
        <div className="ws-header">
          <div className="ws-logo">
            <Scissors size={32} />
            <h1>Couture Stock</h1>
          </div>
          <div className="ws-header-right">
            <span className="ws-user-email">{user?.email}</span>
            {isAdmin && (
              <span className="badge badge--admin"><ShieldCheck size={12} /> Admin</span>
            )}
            {isAdmin && (
              <button className="btn btn--secondary btn--sm" onClick={() => navigate('/admin/accounts')}>
                <ShieldCheck size={14} /> Tous les comptes
              </button>
            )}
            <button className="btn btn--ghost btn--sm" onClick={async () => { await signOut(); navigate('/login') }}>Déconnexion</button>
          </div>
        </div>

        {/* Invitations en attente */}
        {invitations.length > 0 && (
          <div className="ws-invitations">
            <h2><Bell size={18} /> Invitations en attente ({invitations.length})</h2>
            {invitations.map(inv => (
              <div key={inv.id} className="invitation-card">
                <div className="invitation-info">
                  <Store size={16} />
                  <div>
                    <strong>{inv.workspaces?.name ?? 'Espace inconnu'}</strong>
                    <span>Vous avez été invité à rejoindre cet espace</span>
                  </div>
                </div>
                <div className="invitation-actions">
                  <button className="btn btn--success btn--sm" onClick={() => handleRespond(inv.id, true)}>
                    <Check size={14} /> Accepter
                  </button>
                  <button className="btn btn--danger btn--sm" onClick={() => handleRespond(inv.id, false)}>
                    <X size={14} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Liste des espaces */}
        <div className="ws-section">
          <div className="ws-section-header">
            <h2>
              {isAdmin ? (
                <><ShieldCheck size={18} /> Tous les espaces</>
              ) : (
                <><Store size={18} /> Mes espaces de stock</>
              )}
            </h2>
            {!isAdmin && (
              <button className="btn btn--primary btn--sm" onClick={() => setShowForm(s => !s)}>
                <Plus size={14} /> Nouvel espace
              </button>
            )}
          </div>

          {showForm && (
            <form onSubmit={handleCreate} className="ws-create-form">
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Magasin Couture 1"
                autoFocus
                required
              />
              <button type="submit" className="btn btn--primary" disabled={creating}>
                {creating ? 'Création...' : 'Créer'}
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setShowForm(false)}>
                Annuler
              </button>
            </form>
          )}

          {workspaces.length === 0 ? (
            <div className="ws-empty">
              <Store size={40} />
              <p>Aucun espace de stock</p>
              <button className="btn btn--primary" onClick={() => setShowForm(true)}>
                <Plus size={16} /> Créer mon premier espace
              </button>
            </div>
          ) : (
            <div className="ws-grid">
              {workspaces.map(ws => {
                const roleLabel = getRoleLabel(ws)
                const memberCount = ws.workspace_members?.length ?? 0
                return (
                  <button key={ws.id} className="ws-card" onClick={() => enter(ws)}>
                    <div className="ws-card-icon">
                      <Store size={28} />
                    </div>
                    <div className="ws-card-body">
                      <div className="ws-card-name">{ws.name}</div>
                      <div className="ws-card-meta">
                        {roleLabel && (
                          <span className={`badge ${roleLabel === 'Propriétaire' ? 'badge--rose' : 'badge--bleu'}`}>
                            {roleLabel === 'Propriétaire' && <Crown size={10} />} {roleLabel}
                          </span>
                        )}
                        {isAdmin && ws.profiles && (
                          <span className="ws-owner-email">{ws.profiles.email}</span>
                        )}
                        <span className="ws-member-count">{memberCount} membre{memberCount > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
