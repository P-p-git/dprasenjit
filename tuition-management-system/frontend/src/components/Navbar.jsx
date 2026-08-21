import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onMenuToggle }) => {
  const { user, logout } = useAuth();
  const { mode, setTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setTheme(next);
  };

  const themeIcon = mode === 'light' ? '☀️' : mode === 'dark' ? '🌙' : '💻';

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="navbar-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="navbar-brand">
          <Link to="/dashboard">Smart<span>Tuition</span></Link>
        </div>
      </div>
      <div className="navbar-user">
        <span className="navbar-role">{user?.role}</span>
        <span className="navbar-name">{user?.name}</span>
        <button className="theme-toggle" onClick={cycleTheme} title={`Theme: ${mode}`} aria-label="Toggle theme">
          <span className="theme-toggle-thumb">{themeIcon}</span>
        </button>
        <button onClick={handleLogout} className="btn btn-sm btn-outline">Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
