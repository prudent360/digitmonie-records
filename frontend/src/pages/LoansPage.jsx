import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Toast from '../components/Toast';

export default function LoansPage() {
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const [loans, setLoans] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.getLoans(params);
      setLoans(res.loans);
      setPagination(res.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);

  const handleDelete = async (loan) => {
    if (!confirm(`Delete loan #${loan.id} for ${loan.customer_name}? This will also delete all repayments.`)) return;
    try {
      await api.deleteLoan(loan.id);
      setToast({ message: 'Loan deleted successfully', type: 'success' });
      load();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-subtitle">{pagination.total || 0} total loans</p>
        </div>
        {user.role !== 'viewer' && <Link to="/loans/new" className="btn btn-primary">➕ New Loan</Link>}
      </div>

      <div className="toolbar">
        <div className="filter-bar">
          {['', 'active', 'completed', 'defaulted'].map((s) => (
            <button key={s} className={`filter-btn ${statusFilter === s ? 'active' : ''}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : loans.length > 0 ? (
        <>
          {/* Desktop table view */}
          <div className="card-table desktop-table">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th>Principal</th>
                    <th>Rate</th>
                    <th>Duration</th>
                    <th>Monthly Pay</th>
                    <th>Interest</th>
                    <th>Profit</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id}>
                      <td>#{l.id}</td>
                      <td style={{ fontWeight: 600 }}>{l.customer_name}</td>
                      <td>{l.loan_type_name || '—'}</td>
                      <td className="amount">{fmt(l.principal_amount)}</td>
                      <td>{l.interest_rate}%</td>
                      <td>{l.duration_months}mo</td>
                      <td className="amount">{fmt(l.monthly_payment)}</td>
                      <td className="amount" style={{ color: '#d97706' }}>{fmt(l.total_interest)}</td>
                      <td className="amount" style={{ color: '#059669' }}>{fmt(l.profit)}</td>
                      <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                      <td>{new Date(l.disbursement_date).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/loans/${l.id}`} className="btn btn-outline btn-sm">View</Link>
                          {user.role !== 'viewer' && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l)}>Delete</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="mobile-cards">
            {loans.map((l) => (
              <div className="mobile-card" key={l.id}>
                <div className="mobile-card-header">
                  <div>
                    <div className="mobile-card-title">{l.customer_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>#{l.id} • {l.loan_type_name || 'Custom'}</div>
                  </div>
                  <span className={`badge badge-${l.status}`}>{l.status}</span>
                </div>
                <div className="mobile-card-body">
                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Principal</span>
                    <span className="mobile-card-value">{fmt(l.principal_amount)}</span>
                  </div>
                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Monthly Pay</span>
                    <span className="mobile-card-value">{fmt(l.monthly_payment)}</span>
                  </div>
                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Profit</span>
                    <span className="mobile-card-value" style={{ color: '#059669' }}>{fmt(l.profit)}</span>
                  </div>
                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Duration</span>
                    <span className="mobile-card-value">{l.duration_months}mo @ {l.interest_rate}%</span>
                  </div>
                </div>
                <div className="mobile-card-footer">
                  <Link to={`/loans/${l.id}`} className="btn btn-outline btn-sm">View Details</Link>
                  {user.role !== 'viewer' && (
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l)}>Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💰</div>
          <h3>No loans found</h3>
          <p>{statusFilter ? `No ${statusFilter} loans` : 'No loans recorded yet'}</p>
          {user.role !== 'viewer' && <Link to="/loans/new" className="btn btn-primary">Create Loan</Link>}
        </div>
      )}
    </div>
  );
}
