import { useState, useEffect } from 'react';
import { noticeAPI, batchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Notices = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user.role === 'admin' || user.role === 'teacher';
  const [notices, setNotices] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', batch: '' });

  const fetchNotices = async () => {
    try { setLoading(true); const res = await noticeAPI.getAll(); setNotices(res.data); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchBatches = async () => { try { const res = await batchAPI.getAll(); setBatches(res.data); } catch {} };

  useEffect(() => { fetchNotices(); fetchBatches(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.batch) delete payload.batch;
      await noticeAPI.create(payload);
      toast.success('Notice published successfully');
      setShowModal(false); fetchNotices();
    } catch (err) { toast.error(err.message || 'Failed to create notice'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this notice?')) return;
    try { await noticeAPI.delete(id); toast.success('Notice deleted successfully'); fetchNotices(); }
    catch (err) { toast.error(err.message || 'Failed to delete notice'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Notices</h1>
        {canManage && <button className="btn btn-primary" onClick={() => { setForm({ title: '', description: '', batch: '' }); setShowModal(true); }}>+ Create Notice</button>}
      </div>
      {error && <ErrorMessage message={error} onRetry={fetchNotices} />}
      {loading ? <Loading /> : (
        <div className="notices-list">
          {notices.length === 0 ? <p className="text-center text-muted">No notices found</p> : notices.map(n => (
            <div key={n._id} className="notice-card">
              <div className="notice-card-header">
                <h3>{n.title}</h3>
                {canManage && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(n._id)}>Delete</button>}
              </div>
              <p>{n.description}</p>
              <div className="notice-meta">
                <span>By: {n.createdBy?.name || 'Unknown'}</span>
                <span>Date: {new Date(n.createdAt).toLocaleDateString()}</span>
                {n.batch && <span>Batch: {n.batch.name}</span>}
                {!n.batch && <span className="badge badge-info">All Batches</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Notice">
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label><input name="title" value={form.title} onChange={handleChange} required /></div>
          <div className="form-group"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} rows="4" required /></div>
          <div className="form-group">
            <label>Target Batch (optional)</label>
            <select name="batch" value={form.batch} onChange={handleChange}><option value="">All Batches</option>{batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create Notice</button>
        </form>
      </Modal>
    </div>
  );
};

export default Notices;
