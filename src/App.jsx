import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Stock from './pages/Stock'
import Projects from './pages/Projects'
import Stats from './pages/Stats'
import Login from './pages/Login'
import Navbar from './components/Navbar'

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App