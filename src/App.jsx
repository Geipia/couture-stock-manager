import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import { useAuth } from './context/AuthContext'
import { useWorkspace } from './context/WorkspaceContext'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Stock from './pages/Stock'
import Projets from './pages/Projects'
import Stats from './pages/Stats'
import Login from './pages/Login'
import WorkspaceSelector from './pages/WorkspaceSelector'
import Settings from './pages/Settings'

function WorkspaceGuard({ children }) {
  const { workspace } = useWorkspace()
  if (!workspace) return <Navigate to="/workspaces" replace />
  return children
}

function AppLayout() {
  const location = useLocation()
  const { isRecovery } = useAuth()
  const { workspace } = useWorkspace()

  const isLogin = location.pathname === '/login'
  const isWorkspaceSelector = location.pathname === '/workspaces'

  if (isRecovery && !isLogin) return <Navigate to="/login" replace />

  const showNav = !isLogin && !isWorkspaceSelector

  return (
    <>
      {showNav && <Navbar />}
      <main className={showNav ? 'main-content' : ''}>
        <Routes>
          <Route path="/login"      element={<Login />} />
          <Route path="/workspaces" element={<ProtectedRoute><WorkspaceSelector /></ProtectedRoute>} />
          <Route path="/"           element={<ProtectedRoute><WorkspaceGuard><Home /></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/stock"      element={<ProtectedRoute><WorkspaceGuard><Stock /></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/projets"    element={<ProtectedRoute><WorkspaceGuard><Projets /></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/stats"      element={<ProtectedRoute><WorkspaceGuard><Stats /></WorkspaceGuard></ProtectedRoute>} />
          <Route path="/settings"   element={<ProtectedRoute><WorkspaceGuard><Settings /></WorkspaceGuard></ProtectedRoute>} />
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
          <WorkspaceProvider>
            <ToastProvider>
              <AppLayout />
            </ToastProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  )
}
