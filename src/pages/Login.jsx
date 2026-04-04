import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

export default function Login() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login') // 'login' | 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  async function handleForgot(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setSuccess('Un email de réinitialisation a été envoyé.')
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <Scissors size={36} />
          <h1>Couture Stock</h1>
          <p>Gérez votre stock de couture</p>
        </div>

        <div className="login-tabs">
          <button
            className={tab === 'login' ? 'login-tab login-tab--active' : 'login-tab'}
            onClick={() => { setTab('login'); setError(''); setSuccess('') }}
          >
            Connexion
          </button>
          <button
            className={tab === 'forgot' ? 'login-tab login-tab--active' : 'login-tab'}
            onClick={() => { setTab('forgot'); setError(''); setSuccess('') }}
          >
            Mot de passe oublié
          </button>
        </div>

        {error && <div className="alert alert--danger">{error}</div>}
        {success && <div className="alert alert--success">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div className="input-icon">
                <Lock size={16} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="input-toggle" onClick={() => setShowPwd(s => !s)}>
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgot} className="login-form">
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon">
                <Mail size={16} />
                <input
                  type="email"
                  className="form-input"
                  placeholder="ton@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
              {loading ? 'Envoi…' : 'Envoyer le lien de réinitialisation'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
