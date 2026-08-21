import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout } = useAuth();

  return (
    <div className="page">
      <h1 className="page-title">My Profile</h1>
      <div className="profile-card">
        <div className="profile-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>
          <span className={'badge badge-' + (user?.role === 'admin' ? 'primary' : user?.role === 'teacher' ? 'success' : 'info')}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
      </div>
      <div className="profile-details">
        <div className="detail-row"><span>User ID</span><span>{user?._id}</span></div>
        <div className="detail-row"><span>Role</span><span style={{ textTransform: 'capitalize' }}>{user?.role}</span></div>
        <div className="detail-row"><span>Member Since</span><span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span></div>
      </div>
      <div className="profile-actions">
        <button className="btn btn-danger" onClick={logout}>Logout</button>
      </div>
    </div>
  );
};

export default Profile;
