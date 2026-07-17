import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, UserPlus, Trash2, LogOut, Crown, Mail, ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { useToast } from '../context/ToastContext'
import {
  fetchWorkspaceMembers, fetchPendingInvitations,
  inviteByEmail, removeMember, cancelInvitation,
  updateWorkspace, deleteWorkspace,
} from '../services/workspaceService'

export default function Settings() {
  const { user, isAdmin } = useAuth()
  const { workspace, selectWorkspace, clearWorkspace } = useWorkspace()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [editName, setEditName] = useState(workspace?.name ?? '')
  const [savingName, setSavingName] = useState(false)

  const isOwner = isAdmin || workspace?.owner_id === user?.id

  async function load() {
    if (!workspace) return
    try {
      const [m, inv] = await Promise.all([
        fetchWorkspaceMembers(workspace.id),
        fetchPendingInvitations(workspace.id),
      ])
      setMembers(m)
      setInvitations(inv)
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [workspace?.id])

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      await inviteByEmail(workspace.id, inviteEmail.trim())
      addToast(`Invitation envoyée à ${inviteEmail.trim()}`, 'success')
      setInviteEmail('')
      await load()
    } catch (err) {
      addToast(err.message.includes('duplicate') ? 'Cet utilisateur a déjà été invité.' : err.message, 'error')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveMember(memberId, memberUserId) {
    if (!confirm('Retirer ce membre de l\'espace ?')) return
    try {
      await removeMember(workspace.id, memberUserId)
      setMembers(prev => prev.filter(m => m.id !== memberId))
      addToast('Membre retiré.', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  async function handleCancelInvitation(invId) {
    try {
      await cancelInvitation(invId)
      setInvitations(prev => prev.filter(i => i.id !== invId))
      addToast('Invitation annulée.', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  async function handleSaveName(e) {
    e.preventDefault()
    if (!editName.trim() || editName === workspace.name) return
    setSavingName(true)
    try {
      const updated = await updateWorkspace(workspace.id, editName.trim())
      selectWorkspace({ ...workspace, name: updated.name })
      addToast('Nom mis à jour.', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    } finally {
      setSavingName(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Supprimer définitivement l'espace "${workspace.name}" et toutes ses données ?`)) return
    try {
      await deleteWorkspace(workspace.id)
      clearWorkspace()
      navigate('/workspaces')
      addToast('Espace supprimé.', 'success')
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  function handleLeave() {
    clearWorkspace()
    navigate('/workspaces')
  }

  if (!workspace) {
    navigate('/workspaces')
    return null
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Retour
        </button>
        <h1><SettingsIcon size={20} /> Paramètres — {workspace.name}</h1>
      </div>

      {/* Nom de l'espace */}
      {isOwner && (
        <div className="settings-card">
          <h2>Nom de l'espace</h2>
          <form onSubmit={handleSaveName} className="settings-form-row">
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              placeholder="Nom de l'espace"
              required
            />
            <button type="submit" className="btn btn--primary" disabled={savingName || editName === workspace.name}>
              {savingName ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        </div>
      )}

      {/* Membres */}
      <div className="settings-card">
        <h2>Membres ({members.length})</h2>
        {loading ? (
          <div className="spinner" style={{ margin: '1rem auto' }} />
        ) : (
          <div className="members-list">
            {members.map(m => {
              const isMe = m.user_id === user?.id
              const isMemberOwner = m.role === 'owner'
              return (
                <div key={m.id} className="member-row">
                  <div className="member-info">
                    <div className="member-avatar">
                      {(m.profiles?.email?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div>
                      <div className="member-email">{m.profiles?.email ?? '—'}</div>
                      {m.profiles?.display_name && (
                        <div className="member-name">{m.profiles.display_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="member-role-wrap">
                    <span className={`badge ${isMemberOwner ? 'badge--rose' : 'badge--bleu'}`}>
                      {isMemberOwner && <Crown size={10} />} {isMemberOwner ? 'Propriétaire' : 'Membre'}
                    </span>
                    {isOwner && !isMemberOwner && (
                      <button
                        className="icon-btn icon-btn--danger"
                        onClick={() => handleRemoveMember(m.id, m.user_id)}
                        title="Retirer"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Inviter */}
      {isOwner && (
        <div className="settings-card">
          <h2><UserPlus size={18} /> Inviter un membre</h2>
          <form onSubmit={handleInvite} className="settings-form-row">
            <div className="input-icon-wrap">
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="email@exemple.com"
                required
              />
            </div>
            <button type="submit" className="btn btn--primary" disabled={inviting}>
              {inviting ? 'Envoi...' : 'Inviter'}
            </button>
          </form>

          {invitations.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '.5rem', fontSize: '.85rem', color: 'var(--text-muted, #8B84A7)' }}>
                Invitations en attente
              </h3>
              {invitations.map(inv => (
                <div key={inv.id} className="pending-invite-row">
                  <span><Mail size={13} /> {inv.invited_email}</span>
                  <button className="icon-btn icon-btn--danger" onClick={() => handleCancelInvitation(inv.id)} title="Annuler">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions danger */}
      <div className="settings-card settings-card--danger">
        <h2>Zone dangereuse</h2>
        <div className="danger-actions">
          {!isOwner && (
            <button className="btn btn--danger" onClick={handleLeave}>
              <LogOut size={16} /> Quitter cet espace
            </button>
          )}
          {isOwner && (
            <button className="btn btn--danger" onClick={handleDelete}>
              <Trash2 size={16} /> Supprimer l'espace et toutes les données
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
