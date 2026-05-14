import PropTypes from 'prop-types'

function LoginPage({ email, password, error, onFieldChange, onLogin, onShowRegister, onBackToLanding }) {
  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2>Sign in</h2>
        <p>Enter your email and password to continue</p>
      </div>
      <div className="form-grid">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => onFieldChange('email', e.target.value)}
            placeholder="you@email.com"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => onFieldChange('password', e.target.value)}
            placeholder="Your password"
          />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="auth-actions">
        <button type="button" className="primary" onClick={onLogin} disabled={!email || !password}>
          Sign in
        </button>
      </div>
      <div className="auth-switch">
        No account?{' '}
        <button type="button" onClick={onShowRegister}>Create one</button>
      </div>
      {onBackToLanding && (
        <div className="auth-switch">
          <button type="button" onClick={onBackToLanding}>← Home</button>
        </div>
      )}
    </div>
  )
}

LoginPage.propTypes = {
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  error: PropTypes.string,
  onFieldChange: PropTypes.func.isRequired,
  onLogin: PropTypes.func.isRequired,
  onShowRegister: PropTypes.func.isRequired,
  onBackToLanding: PropTypes.func,
}

LoginPage.defaultProps = { error: '', onBackToLanding: null }

export default LoginPage
