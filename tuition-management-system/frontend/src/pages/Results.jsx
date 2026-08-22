import { useState, useEffect } from 'react';
import { resultAPI, examAPI, studentAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const Results = () => {
  const { user } = useAuth();
  const toast = useToast();
  const canManage = user.role === 'admin' || user.role === 'teacher';
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ exam: '', student: '', marks: '', totalMarks: '' });

  const fetchResults = async () => {
    try { setLoading(true); const params = filterExam ? 'exam=' + filterExam : ''; const res = await resultAPI.getAll(params); setResults(res.data); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchExamsAndStudents = async () => {
    try {
      // Only staff can list all students (needed for the Enter Result form)
      if (canManage) {
        const [examsRes, studentsRes] = await Promise.all([examAPI.getAll(), studentAPI.getAll()]);
        setExams(examsRes.data);
        setStudents(studentsRes.data);
      } else {
        const examsRes = await examAPI.getAll();
        setExams(examsRes.data);
      }
    } catch {}
  };

  useEffect(() => { fetchExamsAndStudents(); }, []);
  useEffect(() => { fetchResults(); }, [filterExam]);

  const handleExamChange = (e) => {
    const examId = e.target.value;
    const exam = exams.find(ex => ex._id === examId);
    setForm({ ...form, exam: examId, totalMarks: exam ? exam.totalMarks : '' });
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resultAPI.create({ exam: form.exam, student: form.student, marks: Number(form.marks), totalMarks: Number(form.totalMarks) });
      toast.success('Result saved successfully');
      setShowModal(false); fetchResults();
    } catch (err) { toast.error(err.message || 'Failed to save result'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Results</h1>
        {canManage && <button className="btn btn-primary" onClick={() => { setForm({ exam: '', student: '', marks: '', totalMarks: '' }); setShowModal(true); }}>+ Enter Result</button>}
      </div>
      <div className="filters">
        <select value={filterExam} onChange={(e) => setFilterExam(e.target.value)} className="form-control">
          <option value="">All Exams</option>
          {exams.map(e => <option key={e._id} value={e._id}>{e.name} - {e.subject}</option>)}
        </select>
      </div>
      {error && <ErrorMessage message={error} onRetry={fetchResults} />}
      {loading ? <Loading /> : (
        <table className="table">
          <thead><tr><th>Student</th><th>Exam</th><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th></tr></thead>
          <tbody>
            {results.length === 0 ? <tr><td colSpan="6" className="text-center text-muted">No results found</td></tr> : results.map(r => (
              <tr key={r._id}>
                <td>{r.student?.fullName || '-'}</td>
                <td>{r.exam?.name || '-'}</td>
                <td>{r.exam?.subject || '-'}</td>
                <td>{r.marks}/{r.totalMarks}</td>
                <td>{r.percentage}%</td>
                <td><span className={'grade grade-' + r.grade.toLowerCase().replace('+', 'plus')}>{r.grade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Enter Result">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Exam</label>
            <select name="exam" value={form.exam} onChange={handleExamChange} required><option value="">Select Exam</option>{exams.map(e => <option key={e._id} value={e._id}>{e.name} ({e.subject})</option>)}</select>
          </div>
          <div className="form-group">
            <label>Student</label>
            <select name="student" value={form.student} onChange={handleChange} required><option value="">Select Student</option>{students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}</select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Marks Obtained</label><input name="marks" type="number" value={form.marks} onChange={handleChange} required min="0" /></div>
            <div className="form-group"><label>Total Marks</label><input name="totalMarks" type="number" value={form.totalMarks} onChange={handleChange} required min="1" readOnly /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Save Result</button>
        </form>
      </Modal>
    </div>
  );
};

export default Results;
