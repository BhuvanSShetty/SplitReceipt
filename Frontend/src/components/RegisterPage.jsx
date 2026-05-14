import PropTypes from 'prop-types'

function RegisterPage({
  name,
  email,
  password,
  members,
  error,
  onFieldChange,
  onRegister,
  onBackToLogin,
}) {
  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2>Create an account</h2>
        <p>Save your group and split bills faster next time</p>
      </div>
      <div className="form-grid">
        <label>
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => onFieldChange('name', e.target.value)}
            placeholder="Your name"
          />
        </label>
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
            placeholder="Pick a password"
          />
        </label>
        <label>
          Your usual group
          <input
            type="text"
            value={members}
            onChange={(e) => onFieldChange('members', e.target.value)}
            placeholder="Bhuvan, Rahul, Ananya"
          />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="auth-actions">
        <button type="button" className="primary" onClick={onRegister}>
          Create account
        </button>
      </div>
      <div className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onBackToLogin}>Sign in</button>
      </div>
    </div>
  )
}

RegisterPage.propTypes = {
  name: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  members: PropTypes.string.isRequired,
  error: PropTypes.string,
  onFieldChange: PropTypes.func.isRequired,
  onRegister: PropTypes.func.isRequired,
  onBackToLogin: PropTypes.func.isRequired,
}

RegisterPage.defaultProps = {
  error: '',
}

export default RegisterPage
