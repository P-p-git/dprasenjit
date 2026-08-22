import { useState, useEffect } from 'react';
import { batchAPI, teacherAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Batches = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'admin';

  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', class: '', subject: '', teacher: '', days: '', startTime: '', endTime: '' });

  const fetchBatches = async () => {
    try { setLoading(true); const res = await batchAPI.getAll(); setBatches(res.data); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchTeachers = async () => { try { const res = await teacherAPI.getAll(); setTeachers(res.data); } catch {} };

  useEffect(() => { fetchBatches(); if (isAdmin) fetchTeachers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAddModal = () => { setEditing(null); setForm({ name: '', class: '', subject: '', teacher: '', days: '', startTime: '', endTime: '' }); setShowModal(true); };

  const openEditModal = (batch) => {
    setEditing(batch);
    setForm({ name: batch.name, class: batch.class, subject: batch.subject, teacher: batch.teacher?._id || '', days: batch.days?.join(', ') || '', startTime: batch.startTime || '', endTime: batch.endTime || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, days: form.days.split(',').map(d => d.trim()).filter(Boolean) };
      if (editing) { await batchAPI.update(editing._id, payload); toast.success('Batch updated successfully'); }
      else { await batchAPI.create(payload); toast.success('Batch created successfully'); }
      setShowModal(false); fetchBatches();
    } catch (err) { toast.error(err.message || 'Failed to save batch'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this batch?')) return;
    try { await batchAPI.delete(id); toast.success('Batch deleted successfully'); fetchBatches(); }
    catch (err) { toast.error(err.message || 'Failed to delete batch'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Batches</h1>
        {isAdmin && <button className="btn btn-primary" onClick={openAddModal}>+ Create Batch</button>}
      </div>
      {error && <ErrorMessage message={error} onRetry={fetchBatches} />}
      {loading ? <Loading /> : (
        <div className="batches-grid">
          {batches.length === 0 ? <p className="text-center text-muted">No batches found</p> : batches.map(b => (
            <div key={b._id} className="batch-card">
              <div className="batch-card-header">
                <h3>{b.name}</h3>
                {isAdmin && (
                  <div className="batch-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(b)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(b._id)}>Delete</button>
                  </div>
                )}
              </div>
              <div className="batch-info">
                <p><strong>Class:</strong> {b.class}</p>
                <p><strong>Subject:</strong> {b.subject}</p>
                <p><strong>Teacher:</strong> {b.teacher?.name || 'Not assigned'}</p>
                <p><strong>Days:</strong> {b.days?.join(', ') || '-'}</p>
                <p><strong>Time:</strong> {b.startTime && b.endTime ? `${b.startTime} - ${b.endTime}` : '-'}</p>
                <p><strong>Students:</strong> {b.students?.length || 0}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Batch' : 'Create Batch'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Batch Name</label><input name="name" value={form.name} onChange={handleChange} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Class</label><input name="class" value={form.class} onChange={handleChange} required /></div>
            <div className="form-group"><label>Subject</label><input name="subject" value={form.subject} onChange={handleChange} required /></div>
          </div>
          <div className="form-group">
            <label>Teacher</label>
            <select name="teacher" value={form.teacher} onChange={handleChange}><option value="">None</option>{teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
          </div>
          <div className="form-group"><label>Days (comma separated)</label><input name="days" value={form.days} onChange={handleChange} placeholder="Monday, Wednesday, Friday" /></div>
          <div className="form-row">
            <div className="form-group"><label>Start Time</label><input name="startTime" value={form.startTime} onChange={handleChange} placeholder="5:00 PM" /></div>
            <div className="form-group"><label>End Time</label><input name="endTime" value={form.endTime} onChange={handleChange} placeholder="6:00 PM" /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Update Batch' : 'Create Batch'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Batches;
