import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, batchAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Students = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'admin';
  const isStaff = user.role === 'admin' || user.role === 'teacher';

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    fullName: '', username: '', email: '', phone: '', parentName: '', parentPhone: '',
    address: '', class: '', batch: '', monthlyFee: '', joiningDate: '', password: '',
  });

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (filterClass) params.append('class', filterClass);
      if (filterBatch) params.append('batch', filterBatch);
      const res = await studentAPI.getAll(params.toString());
      setStudents(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try { const res = await batchAPI.getAll(); setBatches(res.data); } catch {}
  };

  useEffect(() => { fetchBatches(); }, []);
  useEffect(() => { fetchStudents(); }, [search, filterClass, filterBatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAddModal = () => {
    setEditing(null);
    setForm({ fullName: '', username: '', email: '', phone: '', parentName: '', parentPhone: '', address: '', class: '', batch: '', monthlyFee: '', joiningDate: '', password: '' });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditing(student);
    setForm({
      fullName: student.fullName, email: student.email || '', phone: student.phone || '',
      parentName: student.parentName || '', parentPhone: student.parentPhone || '',
      address: student.address || '', class: student.class, batch: student.batch?._id || '',
      monthlyFee: student.monthlyFee, joiningDate: student.joiningDate ? student.joiningDate.split('T')[0] : '',
      password: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { ...form, monthlyFee: Number(form.monthlyFee) };
        delete payload.username;
        delete payload.password;
        await studentAPI.update(editing._id, payload);
        if (form.password && isAdmin) {
          if (form.password.length < 8) throw new Error('Password must be at least 8 characters long');
          await authAPI.resetUserPassword(editing.userId, form.password);
        }
        toast.success(isAdmin && form.password ? 'Student and password updated successfully' : 'Student updated successfully');
      } else {
        const payload = { ...form, monthlyFee: Number(form.monthlyFee), password: form.password || undefined };
        await studentAPI.create(payload);
        toast.success('Student added successfully. Default login password is "student@123" unless a custom one was set.');
      }
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to save student');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return;
    try {
      await studentAPI.delete(id);
      toast.success('Student deleted successfully');
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to delete student');
    }
  };

  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        {isStaff && <button className="btn btn-primary" onClick={openAddModal}>+ Add Student</button>}
      </div>
      <div className="filters">
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-control" />
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="form-control">
          <option value="">All Classes</option>
          {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
        </select>
        <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="form-control">
          <option value="">All Batches</option>
          {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>
      {error && <ErrorMessage message={error} onRetry={fetchStudents} />}
      {loading ? <Loading /> : (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Class</th><th>Phone</th><th>Parent</th><th>Batch</th><th>Fee</th>{isStaff && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s._id}>
                <td><Link to={`/students/${s._id}`}>{s.fullName}</Link></td>
                <td>{s.class}</td>
                <td>{s.phone || '-'}</td>
                <td>{s.parentName || '-'}</td>
                <td>{s.batch?.name || '-'}</td>
                <td>₹{s.monthlyFee}</td>
                {isStaff && (
                  <td className="actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(s)}>Edit</button>
                    {isAdmin && <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group"><label>Full Name</label><input name="fullName" value={form.fullName} onChange={handleChange} required /></div>
            <div className="form-group"><label>Username</label><input name="username" value={form.username} onChange={handleChange} required disabled={!!editing} placeholder="Login username" /></div>
          </div>
          {!editing && (
            <div className="form-group"><label>Login Password</label><input name="password" type="text" value={form.password} onChange={handleChange} placeholder="Leave blank for default: student@123" minLength={8} title="If set, must be at least 8 characters" /></div>
          )}
          {editing && isAdmin && (
            <div className="form-group"><label>Reset Password (optional)</label><input name="password" type="text" value={form.password} onChange={handleChange} placeholder="Enter a new password to reset, or leave blank" minLength={8} title="If set, must be at least 8 characters" /></div>
          )}
          <div className="form-row">
            <div className="form-group"><label>Email (optional)</label><input name="email" type="email" value={form.email} onChange={handleChange} disabled={!!editing} /></div>
            <div className="form-group"><label>Phone (optional)</label><input name="phone" value={form.phone} onChange={handleChange} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Parent Name (optional)</label><input name="parentName" value={form.parentName} onChange={handleChange} /></div>
            <div className="form-group"><label>Parent Phone (optional)</label><input name="parentPhone" value={form.parentPhone} onChange={handleChange} /></div>
          </div>
          <div className="form-group"><label>Address (optional)</label><input name="address" value={form.address} onChange={handleChange} /></div>
          <div className="form-row">
            <div className="form-group">
              <label>Class</label>
              <select name="class" value={form.class} onChange={handleChange} required><option value="">Select</option>{classes.map(c => <option key={c} value={c}>Class {c}</option>)}</select>
            </div>
            <div className="form-group">
              <label>Batch</label>
              <select name="batch" value={form.batch} onChange={handleChange}><option value="">None</option>{batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Monthly Fee (₹)</label><input name="monthlyFee" type="number" value={form.monthlyFee} onChange={handleChange} required min="0" /></div>
            <div className="form-group"><label>Joining Date</label><input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Update Student' : 'Add Student'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Students;
