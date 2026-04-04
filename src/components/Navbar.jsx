import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Package, FolderOpen, BarChart2, LogOut, Scissors, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',        icon: Home,       label: 'Tableau de bord' },
  { to: '/stock',   icon: Package,    label: 'Stock'           },
  { to: '/projets', icon: FolderOpen, label: 'Projets'         },
  { to: '/stats',   icon: BarChart2,  label: 'Statistiques'    },
]

export default function Navbar({ alertCount = 0 }) {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="navbar">
        <div className="navbar__brand">
          <Scissors size={22} />
          <span>Couture Stock</span>
        </div>

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

        <button className="navbar__logout" onClick={signOut}>
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>

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
          <button className="mobile-link" onClick={signOut}>
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      )}
    </>
  )
}
