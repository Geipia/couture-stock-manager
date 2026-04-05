import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', gap: '1rem',
          fontFamily: 'Inter, sans-serif', color: '#3D3558', padding: '2rem', textAlign: 'center'
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F9A8C9" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h2>Une erreur est survenue</h2>
          <p style={{ color: '#8B84A7', maxWidth: '400px' }}>
            {this.state.error?.message || "L'application n'a pas pu se charger."}
          </p>
          <p style={{ color: '#8B84A7', fontSize: '0.85rem' }}>
            Vérifiez que les secrets Supabase sont configurés dans GitHub.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#F9A8C9', color: '#fff', border: 'none',
              padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem'
            }}
          >
            Recharger la page
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
