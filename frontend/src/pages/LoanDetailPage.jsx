import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Banknote, BarChart3, TrendingUp, Calendar, Pencil, Trash2 } from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const badgeClass = (status) => {
  const map = { active: 'bg-green-100 text-green-800', paid: 'bg-green-100 text-green-800', completed: 'bg-primary-100 text-primary-800', defaulted: 'bg-red-100 text-red-900', overdue: 'bg-red-100 text-red-900', pending: 'bg-amber-100 text-amber-800' };
  return map[status] || 'bg-slate-100 text-slate-700';
};

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

  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap";
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700`;
  const btnSecondarySm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-muted text-text-primary border border-border hover:bg-border`;
  const btnOutlineSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-transparent border border-border text-text-primary hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50`;
  const btnDangerSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-danger text-white hover:bg-red-600`;
  const btnSuccessSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-success text-white hover:bg-emerald-600`;
  const inputBase = "w-full px-3.5 py-2.5 bg-surface border border-border rounded-[10px] text-text-primary text-sm transition-all duration-200 min-h-[44px] focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/10 placeholder:text-slate-400 max-md:text-base";

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div>;
  if (!loan) return <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border"><h3 className="text-base font-semibold text-text-primary">Loan not found</h3></div>;

  const paidCount = loan.repayments?.filter(r => r.status === 'paid').length || 0;
  const totalCount = loan.repayments?.length || 0;
  const progress = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div className="flex items-center gap-4 flex-wrap">
          <Link to="/loans" className={btnSecondarySm}>← Back</Link>
          <div>
            <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">Loan #{loan.id}</h1>
            <p className="text-sm text-text-muted mt-1">{loan.customer_name} • {loan.loan_type_name || 'Custom'}</p>
          </div>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <span className={`inline-flex items-center px-4 py-1.5 rounded-md text-sm font-medium ${badgeClass(loan.status)}`}>{loan.status}</span>
          {user.role !== 'viewer' && (
            <>
              <button className={btnOutlineSm} onClick={openEdit}><Pencil size={14} className="mr-1" /> Edit</button>
              <button className={btnDangerSm} onClick={handleDelete}><Trash2 size={14} className="mr-1" /> Delete</button>
              {loan.status === 'active' && <button className={btnDangerSm} onClick={() => changeStatus('defaulted')}>Mark Defaulted</button>}
              {loan.status === 'defaulted' && <button className={btnSuccessSm} onClick={() => changeStatus('active')}>Reactivate</button>}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-7 max-lg:grid-cols-2 max-md:gap-3 max-sm:grid-cols-1">
        {[
          { icon: Banknote, value: fmt(loan.principal_amount), label: 'Principal Amount', color: 'bg-purple-50 text-purple-500' },
          { icon: BarChart3, value: fmt(loan.monthly_payment), label: 'Monthly Payment (EMI)', color: 'bg-blue-50 text-blue-500' },
          { icon: TrendingUp, value: fmt(loan.profit), label: 'Total Profit', color: 'bg-green-50 text-green-500', valueColor: 'text-emerald-600' },
          { icon: Calendar, value: `${paidCount}/${totalCount}`, label: 'Payments Made', color: 'bg-amber-50 text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-6 flex items-center gap-5 relative overflow-hidden transition-all duration-200 hover:shadow-card-md hover:border-primary-200 max-md:p-5 max-md:gap-4 max-sm:p-4 max-sm:gap-3.5">
            <div className={`w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0 max-md:w-[42px] max-md:h-[42px] max-sm:w-[38px] max-sm:h-[38px] ${stat.color}`}><stat.icon size={22} /></div>
            <div className="min-w-0 relative z-[1] flex-1">
              <div className={`text-lg font-bold tracking-tight leading-[1.3] break-words max-sm:text-base ${stat.valueColor || 'text-text-primary'}`}>{stat.value}</div>
              <div className="text-[13px] text-text-muted font-medium mt-1 max-sm:text-xs">{stat.label}</div>
            </div>
            <div className="absolute -top-2.5 -right-2.5 opacity-[0.04] rotate-[15deg] pointer-events-none z-0"><stat.icon size={90} className="max-md:w-[60px] max-md:h-[60px]" /></div>
          </div>
        ))}
      </div>

      <div className="bg-surface border border-border rounded-lg p-7 mb-7 max-md:p-5 max-sm:p-4">
        <h3 className="text-base font-semibold text-text-primary mb-5">Loan Details</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-7 max-md:gap-5 max-sm:grid-cols-2 max-sm:gap-4">
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Customer</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]"><Link to={`/customers/${loan.customer_id}`} className="text-primary-600">{loan.customer_name}</Link></span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Interest Rate</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]">{loan.interest_rate}% {loan.interest_period}</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Duration</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]">{loan.duration_months} months</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Admin Fee</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]">{loan.admin_fee_percent}% ({fmt(loan.admin_fee_amount)})</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Total Interest</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]">{fmt(loan.total_interest)}</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Total Repayment</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]">{fmt(loan.total_repayment)}</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Disbursement Date</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]">{new Date(loan.disbursement_date).toLocaleDateString()}</span></div>
          <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Payment Progress</span><span className="text-base font-semibold text-text-primary max-md:text-[15px]">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded bg-muted overflow-hidden"><div className="h-full rounded bg-gradient-to-r from-primary-500 to-success transition-[width] duration-500 ease-in-out" style={{ width: `${progress}%` }}></div></div>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>
          </span></div>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg p-7 max-md:p-5 max-sm:p-4">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border max-md:mb-4 max-md:pb-3"><h3 className="text-base font-semibold text-text-primary flex items-center gap-2"><Calendar size={18} className="text-text-muted" /> Repayment Schedule (Reducing Balance)</h3></div>
        {loan.repayments?.length > 0 ? (
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch -mx-7 px-7 max-md:-mx-5 max-md:px-5 max-sm:-mx-4 max-sm:px-4">
            <table className="w-full border-collapse">
              <thead><tr>
                {['Month','Due Date','Opening Bal.','Principal','Interest','Payment','Closing Bal.','Status','Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap max-md:px-3 max-md:text-[10px]">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {loan.repayments.map(r => (
                  <tr key={r.id} className={`transition-all duration-200 hover:bg-muted last:*:border-b-0 ${r.status === 'paid' ? 'opacity-70' : ''}`}>
                    <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap max-md:px-3 max-md:py-3 max-md:text-[13px]">{r.month_number}</td>
                    <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap max-md:px-3 max-md:py-3 max-md:text-[13px]">{new Date(r.due_date).toLocaleDateString()}</td>
                    <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums max-md:px-3 max-md:py-3 max-md:text-[13px]">{fmt(r.opening_balance)}</td>
                    <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums max-md:px-3 max-md:py-3 max-md:text-[13px]">{fmt(r.principal_component)}</td>
                    <td className="px-4 py-4 border-b border-border text-sm font-semibold text-amber-600 whitespace-nowrap tabular-nums max-md:px-3 max-md:py-3 max-md:text-[13px]">{fmt(r.interest_component)}</td>
                    <td className="px-4 py-4 border-b border-border text-sm font-bold text-text-primary whitespace-nowrap tabular-nums max-md:px-3 max-md:py-3 max-md:text-[13px]">{fmt(r.amount_due)}</td>
                    <td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums max-md:px-3 max-md:py-3 max-md:text-[13px]">{fmt(r.closing_balance)}</td>
                    <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap max-md:px-3 max-md:py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${badgeClass(r.status)}`}>{r.status}</span></td>
                    {user.role !== 'viewer' && (
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap max-md:px-3 max-md:py-3">{r.status === 'paid' ? <button className={btnSecondarySm} onClick={() => markUnpaid(r.id)}>Undo</button> : <button className={btnSuccessSm} onClick={() => markPaid(r.id)}>✓ Pay</button>}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border"><p className="text-sm text-text-muted">No schedule found</p></div>}
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Loan">
        <form onSubmit={handleEdit}>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Principal Amount (₦) *</label>
            <input className={inputBase} type="number" min="1" step="0.01" value={editData.principal_amount} onChange={(e) => setEditData({ ...editData, principal_amount: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Interest Rate (%) *</label><input className={inputBase} type="number" step="0.01" min="0" value={editData.interest_rate} onChange={(e) => setEditData({ ...editData, interest_rate: e.target.value })} required /></div>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Interest Period</label><select className={`${inputBase} form-select`} value={editData.interest_period} onChange={(e) => setEditData({ ...editData, interest_period: e.target.value })}><option value="annually">Annually</option><option value="monthly">Monthly</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Duration (Months) *</label><input className={inputBase} type="number" min="1" value={editData.duration_months} onChange={(e) => setEditData({ ...editData, duration_months: e.target.value })} required /></div>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Admin Fee (%)</label><input className={inputBase} type="number" step="0.01" min="0" value={editData.admin_fee_percent} onChange={(e) => setEditData({ ...editData, admin_fee_percent: e.target.value })} /></div>
          </div>
          <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Disbursement Date *</label><input className={inputBase} type="date" value={editData.disbursement_date} onChange={(e) => setEditData({ ...editData, disbursement_date: e.target.value })} required /></div>
          <div className="flex gap-3 justify-end pt-5 border-t border-border max-md:flex-col">
            <button type="button" className={`${btnBase} px-5 py-2.5 bg-muted text-text-primary border border-border hover:bg-border max-md:w-full max-md:min-h-[44px]`} onClick={() => setShowEditModal(false)}>Cancel</button>
            <button type="submit" className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`} disabled={saving}>{saving ? 'Saving...' : 'Update Loan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
