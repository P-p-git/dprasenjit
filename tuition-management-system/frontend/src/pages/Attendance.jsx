import { useState, useEffect } from 'react';
import { attendanceAPI, batchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import DashboardCard from '../components/DashboardCard';

const Attendance = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isStudent = user.role === 'student';
  const canMark = user.role === 'admin' || user.role === 'teacher';

  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Students see only their own attendance history — never other students' records.
  const [myRecords, setMyRecords] = useState([]);
  const [mySummary, setMySummary] = useState(null);

  useEffect(() => {
    if (!isStudent) return;
    attendanceAPI.getAll('')
      .then(res => setMyRecords(res.data))
      .catch(err => setError(err.message));
    attendanceAPI.getSummary(user.profile_id)
      .then(res => setMySummary(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => { if (!isStudent) batchAPI.getAll().then(res => setBatches(res.data)).catch(console.error); }, []);

  useEffect(() => {
    if (!selectedBatch) { setStudents([]); return; }
    const batch = batches.find(b => b._id === selectedBatch);
    if (batch?.students) setStudents(batch.students);
  }, [selectedBatch, batches]);

  useEffect(() => {
    if (!selectedBatch || !selectedDate) return;
    setLoading(true);
    attendanceAPI.getAll('batch=' + selectedBatch + '&date=' + selectedDate)
      .then(res => {
        const map = {};
        res.data.forEach(r => { map[r.student?._id || r.student] = r.status; });
        setAttendance(map);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedBatch, selectedDate]);

  const handleToggle = (studentId, status) => setAttendance(prev => ({ ...prev, [studentId]: status }));

  const handleSubmit = async () => {
    if (!selectedBatch || !selectedDate) { toast.warning('Please select batch and date'); return; }
    try {
      const attendanceData = students.map(s => ({
        studentId: s._id,
        status: attendance[s._id] || 'absent',
      }));
      await attendanceAPI.mark({ batchId: selectedBatch, date: selectedDate, attendance: attendanceData });
      toast.success('Attendance saved successfully');
    } catch (err) { toast.error(err.message || 'Failed to save attendance'); }
  };

  return (
    <div className="page">
      <h1 className="page-title">Attendance</h1>

      {isStudent ? (
        <>
          {mySummary && (
            <div className="cards-grid" style={{ marginBottom: '16px' }}>
              <DashboardCard title="Attendance %" value={`${mySummary.percentage}%`} icon="A" color="#6366f1" />
              <DashboardCard title="Present" value={mySummary.present} icon="P" color="#22c55e" />
              <DashboardCard title="Absent" value={mySummary.absent} icon="A" color="#ef4444" />
              <DashboardCard title="Total Classes" value={mySummary.totalClasses} icon="T" color="#f59e0b" />
            </div>
          )}
          {error && <ErrorMessage message={error} />}
          {myRecords.length === 0 ? (
            <p className="text-muted">No attendance records yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Date</th><th>Batch</th><th>Status</th></tr>
              </thead>
              <tbody>
                {myRecords.map(r => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>{r.batch?.name || r.batch || '-'}</td>
                    <td><span className={'badge badge-' + (r.status === 'present' ? 'success' : 'danger')}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
      <>
      <div className="filters">
        <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className="form-control">
          <option value="">Select Batch</option>
          {batches.map(b => <option key={b._id} value={b._id}>{b.name} - {b.subject}</option>)}
        </select>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="form-control" />
      </div>
      {error && <ErrorMessage message={error} />}
      {loading ? <Loading /> : (
        <>
          {students.length > 0 && (
            <>
              <table className="table">
                <thead>
                  <tr><th>Student Name</th><th>Status</th>{canMark && <th>Action</th>}</tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s._id}>
                      <td>{s.fullName}</td>
                      <td>
                        <span className={'badge badge-' + (attendance[s._id] === 'present' ? 'success' : attendance[s._id] === 'absent' ? 'danger' : 'secondary')}>
                          {attendance[s._id] || 'Not marked'}
                        </span>
                      </td>
                      {canMark && (
                        <td className="actions">
                          <button className={'btn btn-sm ' + (attendance[s._id] === 'present' ? 'btn-success' : 'btn-outline')} onClick={() => handleToggle(s._id, 'present')}>Present</button>
                          <button className={'btn btn-sm ' + (attendance[s._id] === 'absent' ? 'btn-danger' : 'btn-outline')} onClick={() => handleToggle(s._id, 'absent')}>Absent</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {canMark && <button className="btn btn-primary" onClick={handleSubmit}>Save Attendance</button>}
            </>
          )}
          {selectedBatch && students.length === 0 && <p className="text-muted">No students in this batch</p>}
        </>
      )}
      </>
      )}
    </div>
  );
};

export default Attendance;
