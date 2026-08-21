import { useState, useEffect } from 'react';
import { homeworkAPI, batchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Homework = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user.role === 'admin' || user.role === 'teacher';

  const [homework, setHomework] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', batch: '', dueDate: '' });

  const fetchHomework = async () => {
    try { setLoading(true); const res = await homeworkAPI.getAll(''); setHomework(res.data); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchBatches = async () => { try { const res = await batchAPI.getAll(); setBatches(res.data); } catch {} };

  useEffect(() => { fetchHomework(); fetchBatches(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAddModal = () => { setEditing(null); setForm({ title: '', description: '', subject: '', batch: '', dueDate: '' }); setShowModal(true); };

  const openEditModal = (hw) => {
    setEditing(hw);
    setForm({ title: hw.title, description: hw.description || '', subject: hw.subject, batch: hw.batch?._id || '', dueDate: hw.dueDate ? hw.dueDate.split('T')[0] : '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await homeworkAPI.update(editing._id, form); toast.success('Homework updated successfully'); }
      else { await homeworkAPI.create(form); toast.success('Homework added successfully'); }
      setShowModal(false); fetchHomework();
    } catch (err) { toast.error(err.message || 'Failed to save homework'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this homework?')) return;
    try { await homeworkAPI.delete(id); toast.success('Homework deleted successfully'); fetchHomework(); }
    catch (err) { toast.error(err.message || 'Failed to delete homework'); }
  };

  const isDueSoon = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 2;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Homework</h1>
        {canManage && <button className="btn btn-primary" onClick={openAddModal}>+ Add Homework</button>}
      </div>
      {error && <ErrorMessage message={error} onRetry={fetchHomework} />}
      {loading ? <Loading /> : (
        <div className="homework-list">
          {homework.length === 0 ? <p className="text-center text-muted">No homework found</p> : homework.map(hw => (
            <div key={hw._id} className={'homework-card' + (isDueSoon(hw.dueDate) ? ' due-soon' : '')}>
              <div className="homework-header">
                <h3>{hw.title}</h3>
                {canManage && (
                  <div className="homework-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(hw)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(hw._id)}>Delete</button>
                  </div>
                )}
              </div>
              <p className="homework-desc">{hw.description || 'No description'}</p>
              <div className="homework-meta">
                <span>Subject: {hw.subject}</span>
                <span>Batch: {hw.batch?.name || '-'}</span>
                <span>Due: {new Date(hw.dueDate).toLocaleDateString()}</span>
                {isDueSoon(hw.dueDate) && <span className="badge badge-warning">Due Soon!</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Homework' : 'Add Homework'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label><input name="title" value={form.title} onChange={handleChange} required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} rows="3" /></div>
          <div className="form-group"><label>Subject</label><input name="subject" value={form.subject} onChange={handleChange} required /></div>
          <div className="form-group">
            <label>Batch</label>
            <select name="batch" value={form.batch} onChange={handleChange} required>
              <option value="">Select Batch</option>
              {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Due Date</label><input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required /></div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Update Homework' : 'Add Homework'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Homework;
