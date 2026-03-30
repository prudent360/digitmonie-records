import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function LoanDetailPage() {
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => { loadLoan(); }, [id]);

  const loadLoan = async () => {
    try {
      const r = await api.getLoan(id);
      setLoan(r.loan);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);

  const markPaid = async (repId) => {
    try {
      const r = await api.markRepaymentPaid(repId, new Date().toISOString().split('T')[0]);
      setToast({ message: r.loan_completed ? 'Loan completed! 🎉' : 'Payment recorded', type: 'success' });
      loadLoan();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
  };

  const markUnpaid = async (repId) => {
    try {
      await api.markRepaymentUnpaid(repId);
      setToast({ message: 'Payment reverted', type: 'success' });
      loadLoan();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
  };

  const changeStatus = async (status) => {
    try {
      await api.updateLoanStatus(id, status);
      setToast({ message: `Loan marked ${status}`, type: 'success' });
      loadLoan();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
  };

  const openEdit = () => {
    setEditData({
      principal_amount: loan.principal_amount,
      interest_rate: loan.interest_rate,
      interest_period: loan.interest_period || 'annually',
      duration_months: loan.duration_months,
      admin_fee_percent: loan.admin_fee_percent || 0,
      disbursement_date: loan.disbursement_date,
    });
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateLoan(id, {
        principal_amount: +editData.principal_amount,
        interest_rate: +editData.interest_rate,
        interest_period: editData.interest_period,
        duration_months: +editData.duration_months,
        admin_fee_percent: +(editData.admin_fee_percent || 0),
        disbursement_date: editData.disbursement_date,
      });
      setToast({ message: 'Loan updated successfully', type: 'success' });
      setShowEditModal(false);
      loadLoan();
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this loan and all its repayments? This cannot be undone.')) return;
    try {
      await api.deleteLoan(id);
      setToast({ message: 'Loan deleted', type: 'success' });
      setTimeout(() => navigate('/loans'), 500);
    } catch (e) { setToast({ message: e.message, type: 'error' }); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!loan) return <div className="empty-state"><h3>Loan not found</h3></div>;

  const paidCount = loan.repayments?.filter(r => r.status === 'paid').length || 0;
  const totalCount = loan.repayments?.length || 0;
  const progress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to="/loans" className="btn btn-secondary btn-sm">← Back</Link>
          <div>
            <h1 className="page-title">Loan #{loan.id}</h1>
            <p className="page-subtitle">{loan.customer_name} • {loan.loan_type_name || 'Custom'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge badge-${loan.status}`} style={{ fontSize: 14, padding: '6px 16px' }}>{loan.status}</span>
          {user.role !== 'viewer' && (
            <>
              <button className="btn btn-outline btn-sm" onClick={openEdit}>✏️ Edit</button>
              <button className="btn btn-danger btn-sm" onClick={handleDelete}>🗑️ Delete</button>
              {loan.status === 'active' && <button className="btn btn-danger btn-sm" onClick={() => changeStatus('defaulted')}>Mark Defaulted</button>}
              {loan.status === 'defaulted' && <button className="btn btn-success btn-sm" onClick={() => changeStatus('active')}>Reactivate</button>}
            </>
          )}
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <div className="stat-icon purple">💰</div>
          <div className="stat-content"><div className="stat-value">{fmt(loan.principal_amount)}</div><div className="stat-label">Principal Amount</div></div>
          <span className="stat-watermark">💰</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📊</div>
          <div className="stat-content"><div className="stat-value">{fmt(loan.monthly_payment)}</div><div className="stat-label">Monthly Payment (EMI)</div></div>
          <span className="stat-watermark">📊</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📈</div>
          <div className="stat-content"><div className="stat-value" style={{ color: '#059669' }}>{fmt(loan.profit)}</div><div className="stat-label">Total Profit</div></div>
          <span className="stat-watermark">📈</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">📅</div>
          <div className="stat-content"><div className="stat-value">{paidCount}/{totalCount}</div><div className="stat-label">Payments Made</div></div>
          <span className="stat-watermark">📅</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <h3 className="card-title" style={{ marginBottom: 20 }}>Loan Details</h3>
        <div className="loan-detail-grid">
          <div className="detail-item"><span className="detail-label">Customer</span><span className="detail-value"><Link to={`/customers/${loan.customer_id}`} style={{ color: 'var(--primary-600)' }}>{loan.customer_name}</Link></span></div>
          <div className="detail-item"><span className="detail-label">Interest Rate</span><span className="detail-value">{loan.interest_rate}% {loan.interest_period}</span></div>
          <div className="detail-item"><span className="detail-label">Duration</span><span className="detail-value">{loan.duration_months} months</span></div>
          <div className="detail-item"><span className="detail-label">Admin Fee</span><span className="detail-value">{loan.admin_fee_percent}% ({fmt(loan.admin_fee_amount)})</span></div>
          <div className="detail-item"><span className="detail-label">Total Interest</span><span className="detail-value">{fmt(loan.total_interest)}</span></div>
          <div className="detail-item"><span className="detail-label">Total Repayment</span><span className="detail-value">{fmt(loan.total_repayment)}</span></div>
          <div className="detail-item"><span className="detail-label">Disbursement Date</span><span className="detail-value">{new Date(loan.disbursement_date).toLocaleDateString()}</span></div>
          <div className="detail-item"><span className="detail-label">Payment Progress</span><span className="detail-value">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-muted)', overflow: 'hidden' }}><div style={{ width: `${progress}%`, height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, var(--primary-500), var(--success))', transition: 'width 0.5s ease' }}></div></div>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{progress}%</span>
            </div>
          </span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">📅 Repayment Schedule (Reducing Balance)</h3></div>
        {loan.repayments?.length > 0 ? (
          <div className="table-wrapper"><table className="table"><thead><tr><th>Month</th><th>Due Date</th><th>Opening Bal.</th><th>Principal</th><th>Interest</th><th>Payment</th><th>Closing Bal.</th><th>Status</th><th>Action</th></tr></thead><tbody>
            {loan.repayments.map(r => (
              <tr key={r.id} style={{ opacity: r.status === 'paid' ? 0.7 : 1 }}>
                <td>{r.month_number}</td><td>{new Date(r.due_date).toLocaleDateString()}</td><td className="amount">{fmt(r.opening_balance)}</td><td className="amount">{fmt(r.principal_component)}</td><td className="amount" style={{ color: '#d97706' }}>{fmt(r.interest_component)}</td><td className="amount" style={{ fontWeight: 700 }}>{fmt(r.amount_due)}</td><td className="amount">{fmt(r.closing_balance)}</td><td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                {user.role !== 'viewer' && (
                  <td>{r.status === 'paid' ? <button className="btn btn-secondary btn-sm" onClick={() => markUnpaid(r.id)}>Undo</button> : <button className="btn btn-success btn-sm" onClick={() => markPaid(r.id)}>✓ Pay</button>}</td>
                )}
              </tr>
            ))}
          </tbody></table></div>
        ) : <div className="empty-state"><p>No schedule found</p></div>}
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Loan">
        <form onSubmit={handleEdit}>
          <div className="form-group">
            <label className="form-label">Principal Amount (₦) *</label>
            <input className="form-input" type="number" min="1" step="0.01" value={editData.principal_amount} onChange={(e) => setEditData({ ...editData, principal_amount: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Interest Rate (%) *</label>
              <input className="form-input" type="number" step="0.01" min="0" value={editData.interest_rate} onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Interest Period</label>
              <select className="form-select" value={editData.interest_period} onChange={(e) => setEditData({ ...editData, interest_period: e.target.value })}>
                <option value="annually">Annually</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration (Months) *</label>
              <input className="form-input" type="number" min="1" value={editData.duration_months} onChange={(e) => setEditData({ ...editData, duration_months: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Admin Fee (%)</label>
              <input className="form-input" type="number" step="0.01" min="0" value={editData.admin_fee_percent} onChange={(e) => setEditData({ ...editData, admin_fee_percent: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Disbursement Date *</label>
            <input className="form-input" type="date" value={editData.disbursement_date} onChange={(e) => setEditData({ ...editData, disbursement_date: e.target.value })} required />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Update Loan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
