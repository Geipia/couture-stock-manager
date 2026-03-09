import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav>
      <ul>
        <li><Link to="/">Accueil</Link></li>
        <li><Link to="/stock">Stock</Link></li>
        <li><Link to="/projects">Projets</Link></li>
        <li><Link to="/stats">Statistiques</Link></li>
        <li><Link to="/login">Connexion</Link></li>
      </ul>
    </nav>
  )
}