import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { mode, setTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <div className="settings-grid">
        <div className="settings-card">
          <h3>Appearance</h3>
          <div className="theme-options">
            <button className={'theme-option' + (mode === 'light' ? ' active' : '')} onClick={() => setTheme('light')}>
              <span className="theme-option-icon">☀️</span>
              <div>
                <div style={{ fontWeight: mode === 'light' ? 600 : 400 }}>Light Mode</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Clean and bright theme</div>
              </div>
            </button>
            <button className={'theme-option' + (mode === 'dark' ? ' active' : '')} onClick={() => setTheme('dark')}>
              <span className="theme-option-icon">🌙</span>
              <div>
                <div style={{ fontWeight: mode === 'dark' ? 600 : 400 }}>Dark Mode</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Easy on the eyes</div>
              </div>
            </button>
            <button className={'theme-option' + (mode === 'system' ? ' active' : '')} onClick={() => setTheme('system')}>
              <span className="theme-option-icon">💻</span>
              <div>
                <div style={{ fontWeight: mode === 'system' ? 600 : 400 }}>System Preference</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Match your device settings</div>
              </div>
            </button>
          </div>
        </div>

        <div className="settings-card">
          <h3>Account</h3>
          <div className="profile-details" style={{ boxShadow: 'none', border: 'none', padding: 0, marginBottom: 0 }}>
            <div className="detail-row"><span>Name</span><span>{user?.name}</span></div>
            <div className="detail-row"><span>Email</span><span>{user?.email}</span></div>
            <div className="detail-row"><span>Role</span><span style={{ textTransform: 'capitalize' }}>{user?.role}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
