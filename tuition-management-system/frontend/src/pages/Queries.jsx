import { useState, useEffect } from 'react';
import { queryAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import Modal from '../components/Modal';

const CATEGORIES = ['Academic', 'Class', 'Fee', 'Technical', 'General'];

const Queries = () => {
  const { user } = useAuth();
  const toast = useToast();
  const isStudent = user.role === 'student';

  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [form, setForm] = useState({ category: 'General', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const [replying, setReplying] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchQueries = async () => {
    try {
      setLoading(true);
      const params = filterStatus ? `status=${filterStatus}` : '';
      const res = await queryAPI.getAll(params);
      setQueries(res.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQueries(); }, [filterStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) { toast.warning('Please write your query'); return; }
    try {
      setSubmitting(true);
      await queryAPI.create(form);
      toast.success('Query submitted. Staff will respond soon.');
      setForm({ category: 'General', message: '' });
      fetchQueries();
    } catch (err) {
      toast.error(err.message || 'Failed to submit query');
    } finally {
      setSubmitting(false);
    }
  };

  const openReply = (q) => {
    setReplying(q);
    setReplyText(q.reply || '');
  };

  const handleReply = async () => {
    try {
      await queryAPI.reply(replying._id, { reply: replyText, status: 'resolved' });
      toast.success('Reply sent');
      setReplying(null);
      fetchQueries();
    } catch (err) {
      toast.error(err.message || 'Failed to send reply');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{isStudent ? 'My Query / Issue' : 'Student Queries'}</h1>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="form-control" style={{ maxWidth: '180px' }}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {isStudent && (
        <div className="detail-card" style={{ marginBottom: '16px' }}>
          <h3>Submit a new query</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category</label>
              <select name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="form-control">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Message</label>
              <textarea
                name="message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                required
                maxLength={2000}
                placeholder="Describe your academic issue, class issue, fee question or technical problem..."
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Query'}
            </button>
          </form>
        </div>
      )}

      {error && <ErrorMessage message={error} onRetry={fetchQueries} />}
      {loading ? <Loading /> : (
        queries.length === 0 ? (
          <p className="text-center text-muted">No queries yet</p>
        ) : (
          <div className="notices-list">
            {queries.map(q => (
              <div key={q._id} className="notice-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <strong>{q.category}</strong>
                  <span className={'badge badge-' + (q.status === 'open' ? 'warning' : 'success')}>{q.status}</span>
                </div>
                {!isStudent && q.student && (
                  <p style={{ margin: '6px 0 0' }}><small className="text-muted">From: {q.student.fullName} (Class {q.student.class})</small></p>
                )}
                <p style={{ margin: '8px 0', whiteSpace: 'pre-wrap' }}>{q.message}</p>
                <small className="text-muted">{new Date(q.createdAt).toLocaleString()}</small>
                {q.reply && (
                  <div className="detail-card" style={{ marginTop: '10px', padding: '10px 12px' }}>
                    <strong>Reply{q.repliedBy ? ` from ${q.repliedBy.name}` : ''}:</strong>
                    <p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{q.reply}</p>
                  </div>
                )}
                {!isStudent && (
                  <button className="btn btn-sm btn-outline" style={{ marginTop: '10px' }} onClick={() => openReply(q)}>
                    {q.reply ? 'Update Reply' : 'Reply'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      <Modal isOpen={!!replying} onClose={() => setReplying(null)} title="Reply to Query">
        {replying && (
          <>
            {!isStudent && replying.student && (
              <p><strong>{replying.student.fullName}</strong> ({replying.category}):</p>
            )}
            <p style={{ whiteSpace: 'pre-wrap' }}>{replying.message}</p>
            <div className="form-group">
              <label>Your Reply</label>
              <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={4} maxLength={2000} style={{ width: '100%' }} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleReply}>Send Reply &amp; Mark Resolved</button>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Queries;
