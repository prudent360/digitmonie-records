import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import Toast from '../components/Toast';

export default function NewLoanPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetCustomerId = searchParams.get('customer_id');

  const [customers, setCustomers] = useState([]);
  const [loanTypes, setLoanTypes] = useState([]);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    customer_id: presetCustomerId || '', loan_type_id: '', principal_amount: '', interest_rate: '', interest_period: 'annually', duration_months: '', admin_fee_percent: '0', disbursement_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    Promise.all([api.getCustomers({ limit: 100 }), api.getLoanTypes()])
      .then(([c, t]) => { setCustomers(c.customers); setLoanTypes(t.loan_types); })
      .catch(console.error);
  }, []);

  const handleTypeChange = (typeId) => {
    if (!typeId) { setFormData(prev => ({ ...prev, loan_type_id: '' })); return; }
    const t = loanTypes.find(x => x.id == typeId);
    if (t) setFormData(prev => ({ ...prev, loan_type_id: typeId, interest_rate: t.interest_rate, interest_period: t.interest_period, duration_months: t.duration_months, admin_fee_percent: t.admin_fee_percent }));
  };

  const calcPreview = useCallback(async () => {
    if (!formData.principal_amount || !formData.interest_rate || !formData.duration_months) { setPreview(null); return; }
    try {
      const res = await api.calculateLoan({ principal_amount: +formData.principal_amount, interest_rate: +formData.interest_rate, duration_months: +formData.duration_months, interest_period: formData.interest_period, admin_fee_percent: +(formData.admin_fee_percent || 0), disbursement_date: formData.disbursement_date });
      setPreview(res.calculation);
    } catch (e) { console.error(e); }
  }, [formData.principal_amount, formData.interest_rate, formData.duration_months, formData.interest_period, formData.admin_fee_percent, formData.disbursement_date]);

  useEffect(() => { const t = setTimeout(calcPreview, 500); return () => clearTimeout(t); }, [calcPreview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_id) { setToast({ message: 'Select a customer', type: 'error' }); return; }
    setSaving(true);
    try {
      const res = await api.createLoan({ ...formData, principal_amount: +formData.principal_amount, interest_rate: +formData.interest_rate, duration_months: +formData.duration_months, admin_fee_percent: +(formData.admin_fee_percent || 0) });
      setToast({ message: 'Loan created!', type: 'success' });
      setTimeout(() => navigate(`/loans/${res.id}`), 1000);
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
    finally { setSaving(false); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(n || 0);

  const inputBase = "w-full px-3.5 py-2.5 bg-surface border border-border rounded-[10px] text-text-primary text-sm transition-all duration-200 min-h-[44px] focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/10 placeholder:text-slate-400 max-md:text-base";
  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap";

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div><h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">Create New Loan</h1><p className="text-sm text-text-muted mt-1">Fill in the details to issue a loan</p></div>
      </div>

      <div className="grid grid-cols-2 gap-7 max-lg:grid-cols-1">
        <div className="bg-surface border border-border rounded-lg p-7 max-md:p-5 max-sm:p-4">
          <h3 className="text-base font-semibold text-text-primary mb-6">Loan Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Customer *</label>
              <select className={`${inputBase} form-select`} value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} required>
                <option value="">Select a customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
              </select>
            </div>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Loan Type (Template)</label>
              <select className={`${inputBase} form-select`} value={formData.loan_type_id} onChange={(e) => handleTypeChange(e.target.value)}>
                <option value="">Custom / No Template</option>
                {loanTypes.map(t => <option key={t.id} value={t.id}>{t.name} — {t.interest_rate}% {t.interest_period}</option>)}
              </select>
            </div>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Principal Amount (₦) *</label><input className={inputBase} type="number" min="1" step="0.01" placeholder="e.g. 500000" value={formData.principal_amount} onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
              <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Interest Rate (%) *</label><input className={inputBase} type="number" step="0.01" min="0" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} required /></div>
              <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Interest Period</label><select className={`${inputBase} form-select`} value={formData.interest_period} onChange={(e) => setFormData({ ...formData, interest_period: e.target.value })}><option value="annually">Annually</option><option value="monthly">Monthly</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
              <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Duration (Months) *</label><input className={inputBase} type="number" min="1" value={formData.duration_months} onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })} required /></div>
              <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Admin Fee (%)</label><input className={inputBase} type="number" step="0.01" min="0" value={formData.admin_fee_percent} onChange={(e) => setFormData({ ...formData, admin_fee_percent: e.target.value })} /></div>
            </div>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Disbursement Date *</label><input className={inputBase} type="date" value={formData.disbursement_date} onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })} required /></div>
            <button type="submit" className={`${btnBase} px-6 py-3 text-[15px] bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)] w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed`} disabled={saving}>{saving ? 'Creating...' : '💰 Create Loan'}</button>
          </form>
        </div>

        <div>
          {preview ? (
            <>
              <div className="bg-surface border border-border rounded-lg p-7 mb-5 max-md:p-5 max-sm:p-4">
                <h3 className="text-base font-semibold text-text-primary mb-5">📊 Calculation Preview</h3>
                <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-5 bg-muted p-6 rounded-lg border border-border max-md:p-4 max-md:gap-4 max-sm:grid-cols-2">
                  <div className="text-left"><div className="text-lg font-bold text-primary-700 mb-0.5 max-md:text-base">{fmt(preview.monthly_payment)}</div><div className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Monthly Payment</div></div>
                  <div className="text-left"><div className="text-lg font-bold text-primary-700 mb-0.5 max-md:text-base">{fmt(preview.total_interest)}</div><div className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Total Interest</div></div>
                  <div className="text-left"><div className="text-lg font-bold text-primary-700 mb-0.5 max-md:text-base">{fmt(preview.admin_fee_amount)}</div><div className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Admin Fee</div></div>
                  <div className="text-left"><div className="text-lg font-bold text-emerald-600 mb-0.5 max-md:text-base">{fmt(preview.profit)}</div><div className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Total Profit</div></div>
                  <div className="text-left"><div className="text-lg font-bold text-primary-700 mb-0.5 max-md:text-base">{fmt(preview.total_repayment)}</div><div className="text-[11px] text-text-muted uppercase tracking-wider font-medium">Total Repayment</div></div>
                </div>
              </div>
              <div className="bg-surface border border-border rounded-lg p-7 max-md:p-5 max-sm:p-4">
                <h3 className="text-base font-semibold text-text-primary mb-4">📅 Repayment Schedule</h3>
                <div className="overflow-x-auto -webkit-overflow-scrolling-touch -mx-7 px-7 max-md:-mx-5 max-md:px-5">
                  <table className="w-full border-collapse">
                    <thead><tr>
                      {['#','Opening Bal.','Principal','Interest','Payment','Closing Bal.'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {preview.schedule.map(r => <tr key={r.month_number} className="transition-all duration-200 hover:bg-muted last:*:border-b-0"><td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{r.month_number}</td><td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(r.opening_balance)}</td><td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(r.principal_component)}</td><td className="px-4 py-4 border-b border-border text-sm font-semibold text-amber-600 whitespace-nowrap tabular-nums">{fmt(r.interest_component)}</td><td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(r.amount_due)}</td><td className="px-4 py-4 border-b border-border text-sm font-semibold text-text-primary whitespace-nowrap tabular-nums">{fmt(r.closing_balance)}</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-surface border border-border rounded-lg p-[60px] text-center max-md:p-10">
              <div className="text-5xl mb-4 opacity-40">🧮</div>
              <h3 className="text-text-secondary mb-2 font-semibold">Calculation Preview</h3>
              <p className="text-text-muted text-sm">Fill in amount, rate, and duration to see live reducing balance calculation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
