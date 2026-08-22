import { useState, useEffect } from 'react';
import { teacherAPI, authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Teachers = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'admin';

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', username: '', email: '', phone: '', subject: '', qualification: '', joiningDate: '', password: '' });

  const fetchTeachers = async () => {
    try { setLoading(true); const res = await teacherAPI.getAll(); setTeachers(res.data); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTeachers(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const openAddModal = () => { setEditing(null); setForm({ name: '', username: '', email: '', phone: '', subject: '', qualification: '', joiningDate: '', password: '' }); setShowModal(true); };

  const openEditModal = (teacher) => {
    setEditing(teacher);
    setForm({ name: teacher.name, email: teacher.email || '', phone: teacher.phone || '', subject: teacher.subject, qualification: teacher.qualification || '', joiningDate: teacher.joiningDate ? teacher.joiningDate.split('T')[0] : '', password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        const payload = { ...form };
        delete payload.username;
        delete payload.password;
        await teacherAPI.update(editing._id, payload);
        if (form.password) {
          if (form.password.length < 8) throw new Error('Password must be at least 8 characters long');
          await authAPI.resetUserPassword(editing.userId, form.password);
        }
        toast.success(form.password ? 'Teacher and password updated successfully' : 'Teacher updated successfully');
      }
      else { await teacherAPI.create({ ...form, password: form.password || undefined }); toast.success('Teacher added successfully. Default login password is "teacher@123" unless a custom one was set.'); }
      setShowModal(false); fetchTeachers();
    } catch (err) { toast.error(err.message || 'Failed to save teacher'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this teacher?')) return;
    try { await teacherAPI.delete(id); toast.success('Teacher deleted successfully'); fetchTeachers(); }
    catch (err) { toast.error(err.message || 'Failed to delete teacher'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Teachers</h1>
        {isAdmin && <button className="btn btn-primary" onClick={openAddModal}>+ Add Teacher</button>}
      </div>
      {error && <ErrorMessage message={error} onRetry={fetchTeachers} />}
      {loading ? <Loading /> : (
        <table className="table">
          <thead><tr><th>Name</th><th>Subject</th><th>Phone</th><th>Email</th><th>Qualification</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan={isAdmin ? 6 : 5} className="text-center text-muted">No teachers found</td></tr>
            ) : teachers.map(t => (
              <tr key={t._id}>
                <td>{t.name}</td><td>{t.subject}</td><td>{t.phone || '-'}</td><td>{t.email || '-'}</td><td>{t.qualification}</td>
                {isAdmin && (
                  <td className="actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(t)}>Edit</button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t._id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Teacher' : 'Add Teacher'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Name</label><input name="name" value={form.name} onChange={handleChange} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Username</label><input name="username" value={form.username} onChange={handleChange} required disabled={!!editing} placeholder="Login username" /></div>
            <div className="form-group"><label>Email (optional)</label><input name="email" type="email" value={form.email} onChange={handleChange} disabled={!!editing} /></div>
          </div>
          {!editing && (
            <div className="form-group"><label>Login Password</label><input name="password" type="text" value={form.password} onChange={handleChange} placeholder="Leave blank for default: teacher@123" minLength={8} title="If set, must be at least 8 characters" /></div>
          )}
          {editing && (
            <div className="form-group"><label>Reset Password (optional)</label><input name="password" type="text" value={form.password} onChange={handleChange} placeholder="Enter a new password to reset, or leave blank" minLength={8} title="If set, must be at least 8 characters" /></div>
          )}
          <div className="form-row">
            <div className="form-group"><label>Phone (optional)</label><input name="phone" value={form.phone} onChange={handleChange} /></div>
            <div className="form-group"><label>Subject</label><input name="subject" value={form.subject} onChange={handleChange} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Qualification</label><input name="qualification" value={form.qualification} onChange={handleChange} /></div>
            <div className="form-group"><label>Joining Date</label><input name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">{editing ? 'Update Teacher' : 'Add Teacher'}</button>
        </form>
      </Modal>
    </div>
  );
};

export default Teachers;
