import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI, batchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Students = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'admin';

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
    address: '', class: '', batch: '', monthlyFee: '', joiningDate: '',
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
    setForm({ fullName: '', username: '', email: '', phone: '', parentName: '', parentPhone: '', address: '', class: '', batch: '', monthlyFee: '', joiningDate: '' });
    setShowModal(true);
  };

  const openEditModal = (student) => {
    setEditing(student);
    setForm({
      fullName: student.fullName, email: student.email, phone: student.phone,
      parentName: student.parentName, parentPhone: student.parentPhone,
      address: student.address || '', class: student.class, batch: student.batch?._id || '',
      monthlyFee: student.monthlyFee, joiningDate: student.joiningDate ? student.joiningDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, monthlyFee: Number(form.monthlyFee) };
      if (editing) {
        await studentAPI.update(editing._id, payload);
        toast.success('Student updated successfully');
      } else {
        await studentAPI.create(payload);
        toast.success('Student added successfully');
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
        {isAdmin && <button className="btn btn-primary" onClick={openAddModal}>+ Add Student</button>}
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
            <tr><th>Name</th><th>Class</th><th>Phone</th><th>Parent</th><th>Batch</th><th>Fee</th>{isAdmin && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} className="text-center text-muted">No students found</td></tr>
            ) : students.map(s => (
              <tr key={s._id}>
                <td><Link to={`/students/${s._id}`}>{s.fullName}</Link></td>
                <td>{s.class}</td>
                <td>{s.phone}</td>
                <td>{s.parentName}</td>
                <td>{s.batch?.name || '-'}</td>
                <td>\u20B9{s.monthlyFee}</td>
                {isAdmin && (
                  <td className="actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(s)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s._id)}>Delete</button>
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
          <div className="form-row">
            <div className="form-group"><label>Email</label><input name="email" type="email" value={form.email} onChange={handleChange} required disabled={!!editing} /></div>
            <div className="form-group"><label>Phone</label><input name="phone" value={form.phone} onChange={handleChange} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Parent Name</label><input name="parentName" value={form.parentName} onChange={handleChange} required /></div>
            <div className="form-group"><label>Parent Phone</label><input name="parentPhone" value={form.parentPhone} onChange={handleChange} required /></div>
          </div>
          <div className="form-group"><label>Address</label><input name="address" value={form.address} onChange={handleChange} /></div>
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
            <div className="form-group"><label>Monthly Fee (\u20B9)</label><input name="monthlyFee" type="number" value={form.monthlyFee} onChange={handleChange} required min="0" /></div>
            <div className="form-group"><label>Joining Date</label><input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Update Student' : 'Add Student'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Students;
