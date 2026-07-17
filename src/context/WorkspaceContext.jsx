import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'

const WorkspaceContext = createContext(null)

export function WorkspaceProvider({ children }) {
  const { user } = useAuth()
  const [workspace, setWorkspaceState] = useState(() => {
    try {
      const saved = sessionStorage.getItem('currentWorkspace')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Clear workspace when user logs out
  useEffect(() => {
    if (!user) {
      setWorkspaceState(null)
      sessionStorage.removeItem('currentWorkspace')
    }
  }, [user])

  function selectWorkspace(ws) {
    setWorkspaceState(ws)
    if (ws) sessionStorage.setItem('currentWorkspace', JSON.stringify(ws))
    else sessionStorage.removeItem('currentWorkspace')
  }

  function clearWorkspace() {
    setWorkspaceState(null)
    sessionStorage.removeItem('currentWorkspace')
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, selectWorkspace, clearWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  return useContext(WorkspaceContext)
}
