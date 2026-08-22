import { useState, useEffect } from 'react';
import { feeAPI, studentAPI, batchAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';
import DashboardCard from '../components/DashboardCard';

const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Class list mirrors the Students page filter (configurable values stored on each student)
const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const Fees = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isAdmin = user.role === 'admin';
  const isTeacher = user.role === 'teacher';
  const isStaff = isAdmin || isTeacher;

  const [tab, setTab] = useState('records');
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ student: '', month: '', year: '2026', amount: '', status: 'pending', paymentMethod: '' });

  const [rangeStudent, setRangeStudent] = useState('');
  const [fromMonth, setFromMonth] = useState('1');
  const [fromYear, setFromYear] = useState('2026');
  const [toMonth, setToMonth] = useState('12');
  const [toYear, setToYear] = useState('2026');
  const [rangeResult, setRangeResult] = useState(null);
  const [rangeLoading, setRangeLoading] = useState(false);
  const [rangeError, setRangeError] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (isAdmin && filterBatch) params.append('batch', filterBatch);
      if ((isAdmin || isTeacher) && filterClass) params.append('class', filterClass);
      const res = await feeAPI.getAll(params.toString());
      setFees(res.data);
      if (isAdmin) { const sumRes = await feeAPI.getSummary(); setSummary(sumRes.data); }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // Students may not list all students — only staff need these dropdowns.
  const fetchStudents = async () => {
    if (!isAdmin && !isTeacher) return;
    try { const res = await studentAPI.getAll(); setStudents(res.data); } catch {}
  };

  useEffect(() => {
    fetchStudents();
    if (isAdmin) { batchAPI.getAll().then(res => setBatches(res.data)).catch(() => {}); }
    // Students always see their own fees in the range tab
    if (!isAdmin && !isTeacher && user?.profile_id) {
      setRangeStudent(String(user.profile_id));
    }
  }, []);
  useEffect(() => { fetchFees(); }, [filterStatus, filterBatch, filterClass]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await feeAPI.create({ ...form, month: Number(form.month), year: Number(form.year), amount: Number(form.amount) });
      toast.success('Fee record added successfully');
      setShowModal(false); fetchFees();
    } catch (err) { toast.error(err.message || 'Failed to add fee record'); }
  };

  const handleMarkPaid = async (id) => {
    try {
      await feeAPI.update(id, { status: 'paid', paymentDate: new Date().toISOString() });
      toast.success('Payment marked as paid');
      fetchFees();
    } catch (err) { toast.error(err.message || 'Failed to update fee'); }
  };

  const handleRangeSearch = async () => {
    if (!rangeStudent) { toast.warning('Please select a student'); return; }
    try {
      setRangeLoading(true);
      setRangeError('');
      const params = `studentId=${rangeStudent}&fromMonth=${fromMonth}&fromYear=${fromYear}&toMonth=${toMonth}&toYear=${toYear}`;
      const res = await feeAPI.getPendingRange(params);
      setRangeResult(res.data);
    } catch (err) { setRangeError(err.message); }
    finally { setRangeLoading(false); }
  };

  const handleRangePayment = async () => {
    if (!rangeResult) return;
    try {
      await feeAPI.recordRangePayment({
        studentId: rangeStudent,
        fromMonth: Number(fromMonth),
        fromYear: Number(fromYear),
        toMonth: Number(toMonth),
        toYear: Number(toYear),
        paymentMethod,
      });
      toast.success(`Payment recorded for ${rangeResult.pendingMonths.length + rangeResult.paidMonthsCount - rangeResult.pendingMonthsCount} month(s)`);
      setShowPayModal(false);
      handleRangeSearch();
      fetchFees();
    } catch (err) { toast.error(err.message || 'Failed to record payment'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Fee Management</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setForm({ student: '', month: '', year: '2026', amount: '', status: 'pending', paymentMethod: '' }); setShowModal(true); }}>
            + Add Fee Record
          </button>
        )}
      </div>

      <div className="filters" style={{ marginBottom: '16px' }}>
        <button className={'btn ' + (tab === 'records' ? 'btn-primary' : 'btn-outline')} onClick={() => setTab('records')}>Fee Records</button>
        <button className={'btn ' + (tab === 'range' ? 'btn-primary' : 'btn-outline')} onClick={() => setTab('range')}>Pending Fee Range</button>
      </div>

      {isAdmin && summary && tab === 'records' && (
        <div className="cards-grid">
          <DashboardCard title="Total Collected" value={"\u20B9" + summary.totalCollected} icon="\u20B9" color="#22c55e" />
          <DashboardCard title="Total Pending" value={"\u20B9" + summary.totalPending} icon="\u20B9" color="#ef4444" />
          <DashboardCard title="Paid Records" value={summary.paidCount} icon="P" color="#10b981" />
          <DashboardCard title="Pending Records" value={summary.pendingCount} icon="P" color="#f59e0b" />
        </div>
      )}

      {tab === 'records' && (
        <>
          <div className="filters">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-control">
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
            </select>
            {(isAdmin || isTeacher) && (
              <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="form-control">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            )}
            {isAdmin && (
              <select value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="form-control">
                <option value="">All Batches</option>
                {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            )}
          </div>
          {error && <ErrorMessage message={error} onRetry={fetchFees} />}
          {loading ? <Loading /> : (
            <table className="table">
              <thead>
                <tr><th>Student</th><th>Month</th><th>Year</th><th>Amount</th><th>Status</th><th>Payment Date</th>{isAdmin && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {fees.length === 0 ? (
                  <tr><td colSpan={isAdmin ? 7 : 6} className="text-center text-muted">No fee records found</td></tr>
                ) : fees.map(f => (
                  <tr key={f._id}>
                    <td>{f.student?.fullName || '-'}</td>
                    <td>{monthNames[f.month]}</td>
                    <td>{f.year}</td>
                    <td>{"\u20B9"}{f.amount}</td>
                    <td><span className={'badge badge-' + (f.status === 'paid' ? 'success' : 'warning')}>{f.status}</span></td>
                    <td>{f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : '-'}</td>
                    {isAdmin && <td>{f.status === 'pending' && <button className="btn btn-sm btn-success" onClick={() => handleMarkPaid(f._id)}>Mark Paid</button>}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {tab === 'range' && (
        <div className="fee-range-section">
          <div className="filters" style={{ flexWrap: 'wrap', gap: '8px' }}>
            {(isAdmin || isTeacher) ? (
              <div className="form-group" style={{ minWidth: '200px' }}>
                <label>Student</label>
                <select value={rangeStudent} onChange={(e) => setRangeStudent(e.target.value)} className="form-control">
                  <option value="">Select Student</option>
                  {students.map(s => <option key={s._id} value={s._id}>{s.fullName} (Class {s.class})</option>)}
                </select>
              </div>
            ) : (
              <div className="form-group" style={{ minWidth: '200px' }}>
                <label>Student</label>
                <input className="form-control" value="My Fee Summary" disabled />
              </div>
            )}
            <div className="form-group">
              <label>From Month</label>
              <select value={fromMonth} onChange={(e) => setFromMonth(e.target.value)} className="form-control">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{monthNames[m]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>From Year</label>
              <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="form-control">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To Month</label>
              <select value={toMonth} onChange={(e) => setToMonth(e.target.value)} className="form-control">
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{monthNames[m]}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>To Year</label>
              <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="form-control">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ alignSelf: 'flex-end' }}>
              <button className="btn btn-primary" onClick={handleRangeSearch} disabled={rangeLoading}>
                {rangeLoading ? 'Searching...' : 'Check Pending Fees'}
              </button>
            </div>
          </div>

          {rangeError && <ErrorMessage message={rangeError} />}
          {rangeLoading && <Loading />}

          {rangeResult && !rangeLoading && (
            <div style={{ marginTop: '16px' }}>
              <h3>Results for {rangeResult.student.fullName}</h3>
              <div className="cards-grid" style={{ marginTop: '8px' }}>
                <DashboardCard title="Total Months" value={rangeResult.totalMonths} icon="M" color="#6366f1" />
                <DashboardCard title="Paid Months" value={rangeResult.paidMonthsCount} icon="P" color="#22c55e" />
                <DashboardCard title="Pending Months" value={rangeResult.pendingMonthsCount} icon="P" color="#ef4444" />
                <DashboardCard title="Total Pending" value={"\u20B9" + rangeResult.totalPendingAmount} icon="\u20B9" color="#ef4444" />
              </div>

              {rangeResult.pendingMonths.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h3>Pending Months</h3>
                  <table className="table">
                    <thead><tr><th>Month</th><th>Year</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {rangeResult.pendingMonths.map((m, i) => (
                        <tr key={i}>
                          <td>{monthNames[m.month]}</td>
                          <td>{m.year}</td>
                          <td>{"\u20B9"}{m.amount}</td>
                          <td><span className="badge badge-warning">Pending</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {isStaff && (
                    <button className="btn btn-success" style={{ marginTop: '8px' }} onClick={() => setShowPayModal(true)}>
                      Record Payment for {rangeResult.pendingMonthsCount} Month(s) - {"\u20B9"}{rangeResult.totalPendingAmount}
                    </button>
                  )}
                </div>
              )}

              {rangeResult.pendingMonths.length === 0 && (
                <div style={{ marginTop: '16px' }}>
                  <p className="text-muted">All fees are paid for the selected range.</p>
                </div>
              )}

              {rangeResult.paidMonths.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h3>Paid Months</h3>
                  <table className="table">
                    <thead><tr><th>Month</th><th>Year</th><th>Amount</th><th>Status</th><th>Payment Date</th><th>Method</th></tr></thead>
                    <tbody>
                      {rangeResult.paidMonths.map((m, i) => (
                        <tr key={i}>
                          <td>{monthNames[m.month]}</td>
                          <td>{m.year}</td>
                          <td>{"\u20B9"}{m.amount}</td>
                          <td><span className="badge badge-success">Paid</span></td>
                          <td>{m.paymentDate ? new Date(m.paymentDate).toLocaleDateString() : '-'}</td>
                          <td>{m.paymentMethod || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Fee Record">
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label>Student</label>
            <select name="student" value={form.student} onChange={handleChange} required>
              <option value="">Select Student</option>
              {students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Month</label>
              <select name="month" value={form.month} onChange={handleChange} required>
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{monthNames[m]}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Year</label><input name="year" type="number" value={form.year} onChange={handleChange} required /></div>
          </div>
          <div className="form-group"><label>Amount ({"\u20B9"})</label><input name="amount" type="number" value={form.amount} onChange={handleChange} required min="0" /></div>
          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}><option value="pending">Pending</option><option value="paid">Paid</option></select>
            </div>
            <div className="form-group"><label>Payment Method</label><input name="paymentMethod" value={form.paymentMethod} onChange={handleChange} placeholder="Cash, UPI, etc." /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-block">Add Record</button>
        </form>
      </Modal>

      <Modal isOpen={showPayModal} onClose={() => setShowPayModal(false)} title="Record Range Payment">
        <div style={{ marginBottom: '16px' }}>
          <p>Recording payment for <strong>{rangeResult?.pendingMonths?.length}</strong> pending month(s)</p>
          <p>Total amount: <strong>{"\u20B9"}{rangeResult?.totalPendingAmount}</strong></p>
        </div>
        <div className="form-group">
          <label>Payment Method</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="form-control">
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <button className="btn btn-success btn-block" onClick={handleRangePayment}>Confirm Payment</button>
      </Modal>
    </div>
  );
};

export default Fees;
