import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('dm_user') || '{"name": "Admin"}');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  const s = data?.stats || {};

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="dashboard-container">
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Loan management overview</p>
        </div>
        {user.role !== 'viewer' && (
          <Link to="/loans/new" className="btn btn-primary">
            <span style={{ marginRight: 8 }}>+</span> New Loan
          </Link>
        )}
      </div>

      <div 
        className="card greeting-banner animate-in" 
        style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          color: 'white',
          padding: '32px',
          marginBottom: 32,
          border: 'none',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 className="greeting-text" style={{ color: 'white', marginBottom: 8, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h2>
          <p className="greeting-sub" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: 500 }}>
            {user.role === 'admin' 
              ? "You have full administrative access. Manage your team and records below."
              : "Welcome back! Here's a quick overview of your loan records."
            }
          </p>
          
          {user.role === 'admin' && (
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
              <Link to="/users" className="btn" style={{ background: 'white', color: '#0f172a', border: 'none' }}>
                <svg style={{marginRight: 8}} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                Manage Team
              </Link>
              <Link to="/loans/new" className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                New Loan Record
              </Link>
            </div>
          )}
        </div>
        <div style={{ position: 'absolute', right: '-20px', top: '-20px', fontSize: '160px', opacity: 0.08, pointerEvents: 'none', zIndex: 1 }}>💎</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple">💰</div>
          <div className="stat-content"><div className="stat-value">{fmt(s.total_disbursed)}</div><div className="stat-label">Total Disbursed</div></div>
          <span className="stat-watermark">💰</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">📈</div>
          <div className="stat-content"><div className="stat-value">{fmt(s.total_profit)}</div><div className="stat-label">Total Profit</div></div>
          <span className="stat-watermark">📈</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📊</div>
          <div className="stat-content"><div className="stat-value">{s.active_loans || 0}</div><div className="stat-label">Active Loans</div></div>
          <span className="stat-watermark">📊</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">👥</div>
          <div className="stat-content"><div className="stat-value">{s.total_customers || 0}</div><div className="stat-label">Total Customers</div></div>
          <span className="stat-watermark">👥</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-content"><div className="stat-value">{fmt(s.total_collected)}</div><div className="stat-label">Total Collected</div></div>
          <span className="stat-watermark">✅</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div className="stat-content"><div className="stat-value">{fmt(s.total_pending)}</div><div className="stat-label">Pending Payments</div></div>
          <span className="stat-watermark">⏳</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon red">⚠️</div>
          <div className="stat-content"><div className="stat-value">{s.overdue_count || 0}</div><div className="stat-label">Overdue Payments</div></div>
          <span className="stat-watermark">⚠️</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon indigo">🏦</div>
          <div className="stat-content"><div className="stat-value">{fmt(s.total_interest)}</div><div className="stat-label">Total Interest Earned</div></div>
          <span className="stat-watermark">🏦</span>
        </div>
      </div>

      <div className="recent-section">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Loans</h3>
            <Link to="/loans" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          {data?.recent_loans?.length > 0 ? (
            <div className="table-wrapper"><table className="table"><thead><tr><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>
              {data.recent_loans.map((l) => (
                <tr key={l.id}><td><Link to={`/loans/${l.id}`} style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{l.customer_name}</Link></td><td className="amount">{fmt(l.principal_amount)}</td><td><span className={`badge badge-${l.status}`}>{l.status}</span></td></tr>
              ))}
            </tbody></table></div>
          ) : <div className="empty-state"><p>No loans yet</p></div>}
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Upcoming Payments</h3></div>
          {data?.upcoming_repayments?.length > 0 ? (
            <div className="table-wrapper"><table className="table"><thead><tr><th>Customer</th><th>Amount</th><th>Due Date</th></tr></thead><tbody>
              {data.upcoming_repayments.map((r) => (
                <tr key={r.id}><td style={{ fontWeight: 500 }}>{r.customer_name}</td><td className="amount">{fmt(r.amount_due)}</td><td>{new Date(r.due_date).toLocaleDateString()}</td></tr>
              ))}
            </tbody></table></div>
          ) : <div className="empty-state"><p>No upcoming payments</p></div>}
        </div>
      </div>
    </div>
  );
}
