import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Package, FolderOpen, BarChart2, LogOut, Scissors, Menu, X, Store, Settings, Bell, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useWorkspace } from '../context/WorkspaceContext'
import { fetchMyInvitations } from '../services/workspaceService'

const navItems = [
  { to: '/',        icon: Home,       label: 'Tableau de bord' },
  { to: '/stock',   icon: Package,    label: 'Stock'           },
  { to: '/projets', icon: FolderOpen, label: 'Projets'         },
  { to: '/stats',   icon: BarChart2,  label: 'Statistiques'    },
]

export default function Navbar({ alertCount = 0 }) {
  const { user, isAdmin, signOut } = useAuth()
  const { workspace, clearWorkspace } = useWorkspace()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [inviteCount, setInviteCount] = useState(0)

  useEffect(() => {
    if (!user) return
    fetchMyInvitations()
      .then(inv => setInviteCount(inv.length))
      .catch(() => {})
  }, [user?.id])

  function handleChangeWorkspace() {
    clearWorkspace()
    navigate('/workspaces')
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      <nav className="navbar">
        <div className="navbar__brand">
          <Scissors size={22} />
          <span>Couture Stock</span>
        </div>

        {/* Workspace actif */}
        {workspace && (
          <button className="navbar__workspace" onClick={handleChangeWorkspace} title="Changer d'espace">
            <Store size={14} />
            <span>{workspace.name}</span>
          </button>
        )}

        <ul className="navbar__links">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}
              >
                <Icon size={18} />
                <span>{label}</span>
                {to === '/' && alertCount > 0 && (
                  <span className="badge badge--danger">{alertCount}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="navbar__bottom">
          {/* Notifications invitations */}
          <NavLink to="/workspaces" className="nav-link nav-link--icon" title="Mes espaces">
            <Bell size={18} />
            <span>Espaces</span>
            {inviteCount > 0 && <span className="badge badge--danger">{inviteCount}</span>}
          </NavLink>

          {/* Paramètres espace */}
          {workspace && (
            <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link nav-link--active' : 'nav-link'}>
              <Settings size={18} />
              <span>Paramètres</span>
            </NavLink>
          )}

          {isAdmin && (
            <div className="nav-link nav-link--admin">
              <ShieldCheck size={16} />
              <span>Admin</span>
            </div>
          )}

          <button className="navbar__logout" onClick={handleSignOut}>
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>

        <button className="navbar__hamburger" onClick={() => setOpen(o => !o)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => isActive ? 'mobile-link mobile-link--active' : 'mobile-link'}
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
          {workspace && (
            <NavLink to="/settings" onClick={() => setOpen(false)} className="mobile-link">
              <Settings size={20} /><span>Paramètres</span>
            </NavLink>
          )}
          <button className="mobile-link" onClick={handleChangeWorkspace}>
            <Store size={20} /><span>Changer d'espace</span>
          </button>
          <button className="mobile-link" onClick={handleSignOut}>
            <LogOut size={20} /><span>Déconnexion</span>
          </button>
        </div>
      )}
    </>
  )
}
