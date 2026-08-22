import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { mode, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setTheme(next);
  };

  const themeIcon = mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '💻';

  return (
    <div className="login-page">
      <div className="login-shapes">
        <div className="login-shape login-shape-1" />
        <div className="login-shape login-shape-2" />
        <div className="login-shape login-shape-3" />
        <div className="login-shape login-shape-4" />
        <div className="login-shape login-shape-5" />
      </div>

      <button className="theme-toggle login-theme-toggle" onClick={cycleTheme} title={`Theme: ${mode}`}>
        <span className="theme-toggle-thumb">{themeIcon}</span>
      </button>

      <div className="login-left">
        <div className="login-branding">
          <div className="login-branding-logo">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
              <path d="M6 12v5c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2v-5"/>
            </svg>
          </div>
          <h1>Smart Tuition</h1>
          <p>The modern platform for managing coaching classes, students, attendance, fees, and more.</p>
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">📊</div>
              <span>Real-time dashboard with analytics</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">📋</div>
              <span>Attendance tracking & reports</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">💰</div>
              <span>Fee management & collections</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">🎓</div>
              <span>Student performance tracking</span>
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {error && <div className="alert alert-error login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block login-submit"
              disabled={loading}
            >
              {loading && <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }} />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
