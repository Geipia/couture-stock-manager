import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Stock from './pages/Stock'
import Projets from './pages/Projects'
import Stats from './pages/Stats'
import Login from './pages/Login'

function AppLayout() {
  const location = useLocation()
  const { isRecovery } = useAuth()
  const isLogin = location.pathname === '/login'

  // Si l'utilisateur arrive via un lien de reset de mot de passe, on le redirige vers /login
  if (isRecovery && !isLogin) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      {!isLogin && <Navbar />}
      <main className={isLogin ? '' : 'main-content'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/projets" element={<ProtectedRoute><Projets /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <AppLayout />
          </ToastProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}
