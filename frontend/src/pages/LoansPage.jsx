import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Banknote } from 'lucide-react';
import api from '../lib/api';
import Toast from '../components/Toast';

const badgeClass = (status) => {
  const map = { active: 'bg-green-100 text-green-800', paid: 'bg-green-100 text-green-800', completed: 'bg-primary-100 text-primary-800', defaulted: 'bg-red-100 text-red-900', overdue: 'bg-red-100 text-red-900', pending: 'bg-amber-100 text-amber-800' };
  return map[status] || 'bg-slate-100 text-slate-700';
};

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

  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap";
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)]`;
  const btnOutlineSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-transparent border border-border text-text-primary hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50`;
  const btnDangerSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-danger text-white hover:bg-red-600`;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">Loans</h1>
          <p className="text-sm text-text-muted mt-1 max-sm:text-[13px]">{pagination.total || 0} total loans</p>
        </div>
        {user.role !== 'viewer' && <Link to="/loans/new" className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`}><Plus size={16} /> New Loan</Link>}
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex gap-1 bg-muted p-1 rounded-[10px] w-fit border border-border max-md:w-full max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
          {['', 'active', 'completed', 'defaulted'].map((s) => (
            <button key={s} className={`px-4 py-1.5 rounded-md border-none bg-transparent text-text-muted text-[13px] font-medium cursor-pointer transition-all duration-200 capitalize whitespace-nowrap hover:text-text-primary hover:bg-black/[0.03] ${statusFilter === s ? 'bg-surface text-primary-600 shadow-card font-semibold' : ''}`} onClick={() => { setStatusFilter(s); setPage(1); }}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div> : loans.length > 0 ? (
        <>
          {/* Desktop table view */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden max-md:hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['ID','Customer','Type','Principal','Rate','Duration','Monthly Pay','Interest','Profit','Status','Date','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l) => (
                    <tr key={l.id} className="transition-all duration-200 hover:bg-muted last:*:border-b-0">
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">#{l.id}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-primary whitespace-nowrap font-semibold">{l.customer_name}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{l.loan_type_name || '—'}</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(l.principal_amount)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{l.interest_rate}%</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{l.duration_months}mo</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(l.monthly_payment)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-amber-600 whitespace-nowrap tabular-nums">{fmt(l.total_interest)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-emerald-600 whitespace-nowrap tabular-nums">{fmt(l.profit)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badgeClass(l.status)}`}>{l.status}</span></td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{new Date(l.disbursement_date).toLocaleDateString()}</td>
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/loans/${l.id}`} className={btnOutlineSm}>View</Link>
                          {user.role !== 'viewer' && <button className={btnDangerSm} onClick={() => handleDelete(l)}>Delete</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile card view */}
          <div className="hidden max-md:block">
            {loans.map((l) => (
              <div className="bg-surface border border-border rounded-lg p-5 transition-all duration-200 hover:border-primary-200 hover:shadow-card [&+&]:mt-3 max-sm:p-4" key={l.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-[15px] font-semibold text-text-primary">{l.customer_name}</div>
                    <div className="text-xs text-text-muted mt-0.5">#{l.id} • {l.loan_type_name || 'Custom'}</div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badgeClass(l.status)}`}>{l.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Principal</span><span className="text-sm font-semibold text-text-primary">{fmt(l.principal_amount)}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Monthly Pay</span><span className="text-sm font-semibold text-text-primary">{fmt(l.monthly_payment)}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Profit</span><span className="text-sm font-semibold text-emerald-600">{fmt(l.profit)}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Duration</span><span className="text-sm font-semibold text-text-primary">{l.duration_months}mo @ {l.interest_rate}%</span></div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-border flex-wrap">
                  <Link to={`/loans/${l.id}`} className={`${btnOutlineSm} flex-1 min-w-0`}>View Details</Link>
                  {user.role !== 'viewer' && <button className={`${btnDangerSm} flex-1 min-w-0`} onClick={() => handleDelete(l)}>Delete</button>}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-7 flex-wrap max-md:gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3.5 py-2 border border-border rounded-md bg-surface text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed max-md:px-3 max-md:text-xs">← Prev</button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`px-3.5 py-2 border rounded-md text-[13px] font-medium cursor-pointer transition-all duration-200 max-md:px-3 max-md:text-xs ${page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-border bg-surface text-text-secondary hover:bg-muted'}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="px-3.5 py-2 border border-border rounded-md bg-surface text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed max-md:px-3 max-md:text-xs">Next →</button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border max-md:py-12">
          <div className="mb-5 opacity-40"><Banknote size={48} /></div>
          <h3 className="text-base font-semibold mb-2 text-text-primary">No loans found</h3>
          <p className="text-sm text-text-muted mb-6 max-w-[300px]">{statusFilter ? `No ${statusFilter} loans` : 'No loans recorded yet'}</p>
          {user.role !== 'viewer' && <Link to="/loans/new" className={btnPrimary}>Create Loan</Link>}
        </div>
      )}
    </div>
  );
}
