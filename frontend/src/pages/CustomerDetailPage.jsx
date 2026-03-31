import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import api from '../lib/api';

const badgeClass = (status) => {
  const map = { active: 'bg-green-100 text-green-800', paid: 'bg-green-100 text-green-800', completed: 'bg-primary-100 text-primary-800', defaulted: 'bg-red-100 text-red-900', overdue: 'bg-red-100 text-red-900', pending: 'bg-amber-100 text-amber-800' };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export default function CustomerDetailPage() {
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomer(id).then((r) => setCustomer(r.customer)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);

  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap";
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700`;
  const btnSecondarySm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-muted text-text-primary border border-border hover:bg-border`;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div>;
  if (!customer) return <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border"><h3 className="text-base font-semibold text-text-primary">Customer not found</h3></div>;

  return (
    <div className="min-w-0">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/customers" className={btnSecondarySm}>← Back</Link>
          <div className="min-w-0"><h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl truncate">{customer.full_name}</h1><p className="text-sm text-text-muted mt-1">Customer Profile</p></div>
        </div>
        {user.role !== 'viewer' && <Link to={`/loans/new?customer_id=${customer.id}`} className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`}><Plus size={16} /> New Loan</Link>}
      </div>

      <div className="bg-surface border border-border rounded-lg p-7 mb-7 max-md:p-5 max-sm:p-4">
        <div className="flex items-center gap-5 mb-7 pb-6 border-b border-border max-md:flex-col max-md:items-start max-md:gap-4">
          <div className="w-14 h-14 rounded-[10px] bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-[22px] font-bold shrink-0">{customer.full_name.charAt(0).toUpperCase()}</div>
          <div className="min-w-0"><h2 className="text-xl font-semibold text-text-primary truncate">{customer.full_name}</h2><p className="text-text-muted text-sm">Added {new Date(customer.created_at).toLocaleDateString()}</p></div>
        </div>
        <div className="grid grid-cols-2 gap-7 lg:grid-cols-4 max-sm:gap-4">
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Phone</span><span className="text-[15px] font-semibold text-text-primary break-words">{customer.phone}</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Email</span><span className="text-[15px] font-semibold text-text-primary break-words">{customer.email || '—'}</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Address</span><span className="text-[15px] font-semibold text-text-primary break-words">{customer.address || '—'}</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">ID Number</span><span className="text-[15px] font-semibold text-text-primary break-words">{customer.id_number || '—'}</span></div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg">
        <div className="flex items-center justify-between px-7 py-5 border-b border-border max-md:px-5 max-sm:px-4"><h3 className="text-base font-semibold text-text-primary">Loans ({customer.loans?.length || 0})</h3></div>
        {customer.loans?.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="overflow-x-auto max-md:hidden">
              <table className="w-full border-collapse min-w-[750px]">
                <thead><tr>
                  {['ID','Amount','Rate','Duration','Monthly Pay','Profit','Status',''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {customer.loans.map((l) => (
                    <tr key={l.id} className="transition-all duration-200 hover:bg-muted last:*:border-b-0">
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">#{l.id}</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(l.principal_amount)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{l.interest_rate}%</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{l.duration_months}mo</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(l.monthly_payment)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm font-semibold text-success whitespace-nowrap tabular-nums">{fmt(l.profit)}</td>
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badgeClass(l.status)}`}>{l.status}</span></td>
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap"><Link to={`/loans/${l.id}`} className={btnSecondarySm}>View</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="hidden max-md:block px-5 py-2 max-sm:px-4">
              {customer.loans.map((l) => (
                <div key={l.id} className="border-b border-border py-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-primary">Loan #{l.id}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${badgeClass(l.status)}`}>{l.status}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
                    <div><span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Amount</span><span className="text-sm font-bold text-text-primary tabular-nums">{fmt(l.principal_amount)}</span></div>
                    <div><span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Monthly Pay</span><span className="text-sm font-semibold text-text-primary tabular-nums">{fmt(l.monthly_payment)}</span></div>
                    <div><span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Rate</span><span className="text-sm font-semibold text-text-secondary">{l.interest_rate}%</span></div>
                    <div><span className="text-[10px] font-medium text-text-muted uppercase tracking-wider block">Profit</span><span className="text-sm font-semibold text-success tabular-nums">{fmt(l.profit)}</span></div>
                  </div>
                  <Link to={`/loans/${l.id}`} className={`${btnSecondarySm} w-full justify-center min-h-[40px]`}>View Loan Details</Link>
                </div>
              ))}
            </div>
          </>
        ) : <div className="flex flex-col items-center justify-center py-20 px-6 text-center"><p className="text-sm text-text-muted">No loans yet</p>{user.role !== 'viewer' && <Link to={`/loans/new?customer_id=${customer.id}`} className={`${btnPrimary} mt-3`}>Create Loan</Link>}</div>}
      </div>
    </div>
  );
}
