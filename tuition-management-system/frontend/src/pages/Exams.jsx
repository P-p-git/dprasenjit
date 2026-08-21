import { useState, useEffect } from 'react';
import { examAPI, batchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Exams = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user.role === 'admin' || user.role === 'teacher';
  const [exams, setExams] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', batch: '', date: '', totalMarks: '' });

  const fetchExams = async () => {
    try { setLoading(true); const res = await examAPI.getAll(); setExams(res.data); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchBatches = async () => { try { const res = await batchAPI.getAll(); setBatches(res.data); } catch {} };

  useEffect(() => { fetchExams(); fetchBatches(); }, []);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await examAPI.create({ ...form, totalMarks: Number(form.totalMarks) });
      toast.success('Exam created successfully');
      setShowModal(false); fetchExams();
    } catch (err) { toast.error(err.message || 'Failed to create exam'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Exams</h1>
        {canManage && <button className="btn btn-primary" onClick={() => { setForm({ name: '', subject: '', batch: '', date: '', totalMarks: '' }); setShowModal(true); }}>+ Create Exam</button>}
      </div>
      {error && <ErrorMessage message={error} onRetry={fetchExams} />}
      {loading ? <Loading /> : (
        <table className="table">
          <thead><tr><th>Exam Name</th><th>Subject</th><th>Batch</th><th>Date</th><th>Total Marks</th></tr></thead>
          <tbody>
            {exams.length === 0 ? <tr><td colSpan="5" className="text-center text-muted">No exams found</td></tr> : exams.map(e => (
              <tr key={e._id}><td>{e.name}</td><td>{e.subject}</td><td>{e.batch?.name || '-'}</td><td>{new Date(e.date).toLocaleDateString()}</td><td>{e.totalMarks}</td></tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Exam">
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Exam Name</label><input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Mid-term Test" /></div>
          <div className="form-group"><label>Subject</label><input name="subject" value={form.subject} onChange={handleChange} required /></div>
          <div className="form-group">
            <label>Batch</label>
            <select name="batch" value={form.batch} onChange={handleChange} required><option value="">Select Batch</option>{batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date</label><input name="date" type="date" value={form.date} onChange={handleChange} required /></div>
            <div className="form-group"><label>Total Marks</label><input name="totalMarks" type="number" value={form.totalMarks} onChange={handleChange} required min="1" /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Create Exam</button>
        </form>
      </Modal>
    </div>
  );
};

export default Exams;
