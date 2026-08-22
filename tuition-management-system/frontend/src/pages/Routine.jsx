import { useState, useEffect } from 'react';
import { routineAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatTime = (value) => {
  if (!value) return '-';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${suffix}`;
};

const Routine = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user.role === 'admin' || user.role === 'teacher';

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ day: 'Monday', startTime: '', subject: '', teacher: '' });

  const fetchRoutine = async () => {
    try {
      setLoading(true);
      const res = await routineAPI.getAll();
      setEntries(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoutine(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setEditing(null);
    setForm({ day: 'Monday', startTime: '', subject: '', teacher: '' });
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setEditing(entry);
    setForm({
      day: entry.day,
      startTime: entry.startTime ? entry.startTime.slice(0, 5) : '',
      subject: entry.subject,
      teacher: entry.teacher || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await routineAPI.update(editing._id, form);
        toast.success('Routine entry updated');
      } else {
        await routineAPI.create(form);
        toast.success('Class added to routine');
      }
      setShowModal(false);
      fetchRoutine();
    } catch (err) {
      toast.error(err.message || 'Failed to save routine entry');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this routine entry?')) return;
    try {
      await routineAPI.delete(id);
      toast.success('Routine entry deleted');
      fetchRoutine();
    } catch (err) {
      toast.error(err.message || 'Failed to delete routine entry');
    }
  };

  const byDay = DAYS.map((day) => ({
    day,
    items: entries.filter((e) => e.day === day),
  }));
  const isEmpty = !loading && entries.length === 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Weekly Class Routine</h1>
        {canManage && <button className="btn btn-primary" onClick={openAddModal}>+ Add Class</button>}
      </div>

      {isEmpty && (
        <div className="detail-card">
          <p className="text-center text-muted">No classes scheduled yet.{canManage ? ' Use "+ Add Class" to build the weekly routine.' : ''}</p>
        </div>
      )}

      {!loading && !isEmpty && byDay.map(({ day, items }) => (
        <div key={day} className="routine-day">
          <h2 className="routine-day-title">{day}</h2>
          {items.length === 0 ? (
            <p className="text-muted routine-empty">No classes</p>
          ) : (
            <table className="table">
              <thead>
                <tr><th>Time</th><th>Subject / Class</th><th>Teacher</th>{canManage && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item._id}>
                    <td><span className="badge badge-primary">{formatTime(item.startTime)}</span></td>
                    <td>{item.subject}</td>
                    <td>{item.teacher || '-'}</td>
                    {canManage && (
                      <td className="actions">
                        <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(item)}>Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item._id)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {error && <ErrorMessage message={error} onRetry={fetchRoutine} />}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Routine Entry' : 'Add Routine Entry'}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Day</label>
              <select name="day" value={form.day} onChange={handleChange} required>
                {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Time</label>
              <input name="startTime" type="time" value={form.startTime} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group"><label>Subject / Class</label><input name="subject" value={form.subject} onChange={handleChange} required placeholder="e.g. Mathematics" /></div>
          <div className="form-group"><label>Teacher (optional)</label><input name="teacher" value={form.teacher} onChange={handleChange} placeholder="e.g. Rahul Sharma" /></div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Update Entry' : 'Add Entry'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Routine;
