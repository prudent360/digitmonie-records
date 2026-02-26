import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';

export default function CustomerDetailPage() {
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomer(id).then((r) => setCustomer(r.customer)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!customer) return <div className="empty-state"><h3>Customer not found</h3></div>;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/customers" className="btn btn-secondary btn-sm">← Back</Link>
          <div><h1 className="page-title">{customer.full_name}</h1><p className="page-subtitle">Customer Profile</p></div>
        </div>
        {user.role !== 'viewer' && <Link to={`/loans/new?customer_id=${customer.id}`} className="btn btn-primary">➕ New Loan</Link>}
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <div className="customer-header">
          <div className="customer-avatar-lg">{customer.full_name.charAt(0).toUpperCase()}</div>
          <div><h2 style={{ fontSize: 20, fontWeight: 600 }}>{customer.full_name}</h2><p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Added {new Date(customer.created_at).toLocaleDateString()}</p></div>
        </div>
        <div className="loan-detail-grid">
          <div className="detail-item"><span className="detail-label">Phone</span><span className="detail-value">{customer.phone}</span></div>
          <div className="detail-item"><span className="detail-label">Email</span><span className="detail-value">{customer.email || '—'}</span></div>
          <div className="detail-item"><span className="detail-label">Address</span><span className="detail-value">{customer.address || '—'}</span></div>
          <div className="detail-item"><span className="detail-label">ID Number</span><span className="detail-value">{customer.id_number || '—'}</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Loans ({customer.loans?.length || 0})</h3></div>
        {customer.loans?.length > 0 ? (
          <div className="table-wrapper"><table className="table"><thead><tr><th>ID</th><th>Amount</th><th>Rate</th><th>Duration</th><th>Monthly Pay</th><th>Profit</th><th>Status</th><th></th></tr></thead><tbody>
            {customer.loans.map((l) => (
              <tr key={l.id}><td>#{l.id}</td><td className="amount">{fmt(l.principal_amount)}</td><td>{l.interest_rate}%</td><td>{l.duration_months}mo</td><td className="amount">{fmt(l.monthly_payment)}</td><td className="amount" style={{ color: 'var(--success-light)' }}>{fmt(l.profit)}</td><td><span className={`badge badge-${l.status}`}>{l.status}</span></td><td><Link to={`/loans/${l.id}`} className="btn btn-secondary btn-sm">View</Link></td></tr>
            ))}
          </tbody></table></div>
        ) : <div className="empty-state"><p>No loans yet</p>{user.role !== 'viewer' && <Link to={`/loans/new?customer_id=${customer.id}`} className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Create Loan</Link>}</div>}
      </div>
    </div>
  );
}
