import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../utils/api';
import DashboardCard from '../components/DashboardCard';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      let res;
      if (user.role === 'admin') res = await dashboardAPI.getAdmin();
      else if (user.role === 'teacher') res = await dashboardAPI.getTeacher();
      else res = await dashboardAPI.getStudent();
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onRetry={fetchData} />;

  return (
    <div className="page">
      <h1 className="page-title">Welcome back, {user.name}</h1>

      {user.role === 'admin' && data && (
        <>
          <div className="cards-grid">
            <DashboardCard title="Total Students" value={data.totalStudents} icon="S" color="#6366f1" />
            <DashboardCard title="Total Teachers" value={data.totalTeachers} icon="T" color="#10b981" />
            <DashboardCard title="Total Batches" value={data.totalBatches} icon="B" color="#f59e0b" />
            <DashboardCard title="Fees Collected" value={`${data.totalFeesCollected?.toLocaleString()}`} icon="FC" color="#22c55e" />
            <DashboardCard title="Fees Pending" value={`${data.totalFeesPending?.toLocaleString()}`} icon="FP" color="#ef4444" />
          </div>

          <div className="dashboard-sections">
            <div className="section">
              <h3>Recent Students</h3>
              {data.recentStudents?.length > 0 ? (
                <table className="table">
                  <thead><tr><th>Name</th><th>Class</th><th>Phone</th></tr></thead>
                  <tbody>
                    {data.recentStudents.map(s => (
                      <tr key={s._id}><td>{s.fullName}</td><td>{s.class}</td><td>{s.phone}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted">No students yet</p>}
            </div>

            <div className="section">
              <h3>Pending Fees</h3>
              {data.pendingFees?.length > 0 ? (
                <table className="table">
                  <thead><tr><th>Student</th><th>Amount</th></tr></thead>
                  <tbody>
                    {data.pendingFees.map(f => (
                      <tr key={f._id}><td>{f.student?.fullName}</td><td>\u20B9{f.amount}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted">No pending fees</p>}
            </div>

            <div className="section">
              <h3>Recent Notices</h3>
              {data.recentNotices?.length > 0 ? (
                <div className="notice-list">
                  {data.recentNotices.map(n => (
                    <div key={n._id} className="notice-item">
                      <strong>{n.title}</strong>
                      <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted">No notices</p>}
            </div>
          </div>
        </>
      )}

      {user.role === 'teacher' && data && (
        <>
          <div className="cards-grid">
            <DashboardCard title="Assigned Batches" value={data.totalBatches} icon="B" color="#6366f1" />
            <DashboardCard title="Total Students" value={data.totalStudents} icon="S" color="#10b981" />
          </div>
          <div className="dashboard-sections">
            <div className="section">
              <h3>My Batches</h3>
              {data.assignedBatches?.length > 0 ? (
                <table className="table">
                  <thead><tr><th>Batch</th><th>Class</th><th>Subject</th><th>Students</th></tr></thead>
                  <tbody>
                    {data.assignedBatches.map(b => (
                      <tr key={b._id}><td>{b.name}</td><td>{b.class}</td><td>{b.subject}</td><td>{b.students?.length || 0}</td></tr>
                    ))}
                  </tbody>
                </table>
              ) : <p className="text-muted">No batches assigned</p>}
            </div>
            <div className="section">
              <h3>Recent Homework</h3>
              {data.recentHomework?.length > 0 ? (
                <div className="list-items">
                  {data.recentHomework.map(h => (
                    <div key={h._id} className="list-item">
                      <strong>{h.title}</strong>
                      <span>Due: {new Date(h.dueDate).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted">No homework added</p>}
            </div>
          </div>
        </>
      )}

      {user.role === 'student' && data && (
        <>
          <div className="cards-grid">
            <DashboardCard title="Attendance" value={`${data.attendance?.percentage || 0}%`} icon="A" color="#6366f1" />
            <DashboardCard title="Avg Marks" value={`${data.avgMarks || 0}%`} icon="M" color="#10b981" />
            <DashboardCard title="Fee Status" value={data.latestFee?.status || 'N/A'} icon="F" color={data.latestFee?.status === 'paid' ? '#22c55e' : '#ef4444'} />
          </div>
          <div className="dashboard-sections">
            <div className="section">
              <h3>Attendance Summary</h3>
              <div className="stats-row">
                <span>Present: {data.attendance?.present || 0}</span>
                <span>Absent: {data.attendance?.absent || 0}</span>
                <span>Total: {data.attendance?.totalClasses || 0}</span>
              </div>
            </div>
            <div className="section">
              <h3>Fee History</h3>
              {data.feeCount > 0 ? (
                <p>{data.paidCount} of {data.feeCount} months paid</p>
              ) : <p className="text-muted">No fee records</p>}
            </div>
            <div className="section">
              <h3>Recent Results</h3>
              {data.recentResults?.length > 0 ? (
                <div className="list-items">
                  {data.recentResults.map(r => (
                    <div key={r._id} className="list-item">
                      <strong>{r.exam?.name} ({r.exam?.subject})</strong>
                      <span>{r.marks}/{r.totalMarks} ({r.percentage}%) - {r.grade}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted">No results yet</p>}
            </div>
            <div className="section">
              <h3>Latest Notices</h3>
              {data.latestNotices?.length > 0 ? (
                <div className="notice-list">
                  {data.latestNotices.map(n => (
                    <div key={n._id} className="notice-item">
                      <strong>{n.title}</strong>
                      <small>{new Date(n.createdAt).toLocaleDateString()}</small>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted">No notices</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
