import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentAPI, dashboardAPI } from '../utils/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';

const StudentDetail = () => {
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentRes, perfRes] = await Promise.all([
          studentAPI.getOne(id),
          dashboardAPI.getPerformance(id),
        ]);
        setStudent(studentRes.data);
        setPerformance(perfRes.data);
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} />;
  if (!student) return <ErrorMessage message="Student not found" />;

  return (
    <div className="page">
      <Link to="/students" className="back-link">&larr; Back to Students</Link>
      <h1 className="page-title">{student.fullName}</h1>
      <div className="detail-grid">
        <div className="detail-card">
          <h3>Personal Information</h3>
          <div className="detail-row"><span>Email</span><span>{student.email}</span></div>
          <div className="detail-row"><span>Phone</span><span>{student.phone}</span></div>
          <div className="detail-row"><span>Class</span><span>{student.class}</span></div>
          <div className="detail-row"><span>Batch</span><span>{student.batch?.name || 'Not assigned'}</span></div>
          <div className="detail-row"><span>Address</span><span>{student.address || '-'}</span></div>
          <div className="detail-row"><span>Joining Date</span><span>{new Date(student.joiningDate).toLocaleDateString()}</span></div>
        </div>
        <div className="detail-card">
          <h3>Parent Information</h3>
          <div className="detail-row"><span>Parent Name</span><span>{student.parentName}</span></div>
          <div className="detail-row"><span>Parent Phone</span><span>{student.parentPhone}</span></div>
          <div className="detail-row"><span>Monthly Fee</span><span>{"\u20B9"}{student.monthlyFee}</span></div>
        </div>
      </div>
      {performance && (
        <>
          <h2 className="section-title">Performance Overview</h2>
          <div className="cards-grid">
            <div className="perf-card"><h4>Attendance</h4><p className="perf-value">{performance.attendancePercentage}%</p><small>{performance.present}/{performance.totalClasses} classes</small></div>
            <div className="perf-card"><h4>Average Marks</h4><p className="perf-value">{performance.avgMarks}%</p><small>{performance.totalExams} exams taken</small></div>
            <div className="perf-card"><h4>Pending Fees</h4><p className="perf-value">{performance.pendingFees}</p><small>months pending</small></div>
            <div className="perf-card"><h4>Overall Score</h4><p className="perf-value">{performance.performanceScore}/100</p><small>performance index</small></div>
          </div>
          {performance.results?.length > 0 && (
            <div className="section">
              <h3>Exam Results</h3>
              <table className="table">
                <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th></tr></thead>
                <tbody>
                  {performance.results.map(r => (
                    <tr key={r._id}>
                      <td>{r.exam?.name}</td>
                      <td>{r.exam?.subject}</td>
                      <td>{r.marks}/{r.totalMarks}</td>
                      <td>{r.percentage}%</td>
                      <td><span className={'grade grade-' + r.grade.toLowerCase().replace('+', 'plus')}>{r.grade}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentDetail;
