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

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header"><div><h1 className="page-title">Create New Loan</h1><p className="page-subtitle">Fill in the details to issue a loan</p></div></div>

      <div className="form-grid">
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 24 }}>Loan Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Customer *</label>
              <select className="form-select" value={formData.customer_id} onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })} required>
                <option value="">Select a customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} — {c.phone}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Loan Type (Template)</label>
              <select className="form-select" value={formData.loan_type_id} onChange={(e) => handleTypeChange(e.target.value)}>
                <option value="">Custom / No Template</option>
                {loanTypes.map(t => <option key={t.id} value={t.id}>{t.name} — {t.interest_rate}% {t.interest_period}</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Principal Amount (₦) *</label><input className="form-input" type="number" min="1" step="0.01" placeholder="e.g. 500000" value={formData.principal_amount} onChange={(e) => setFormData({ ...formData, principal_amount: e.target.value })} required /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Interest Rate (%) *</label><input className="form-input" type="number" step="0.01" min="0" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Interest Period</label><select className="form-select" value={formData.interest_period} onChange={(e) => setFormData({ ...formData, interest_period: e.target.value })}><option value="annually">Annually</option><option value="monthly">Monthly</option></select></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Duration (Months) *</label><input className="form-input" type="number" min="1" value={formData.duration_months} onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Admin Fee (%)</label><input className="form-input" type="number" step="0.01" min="0" value={formData.admin_fee_percent} onChange={(e) => setFormData({ ...formData, admin_fee_percent: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Disbursement Date *</label><input className="form-input" type="date" value={formData.disbursement_date} onChange={(e) => setFormData({ ...formData, disbursement_date: e.target.value })} required /></div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 8 }} disabled={saving}>{saving ? 'Creating...' : '💰 Create Loan'}</button>
          </form>
        </div>

        <div>
          {preview ? (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <h3 className="card-title" style={{ marginBottom: 20 }}>📊 Calculation Preview</h3>
                <div className="calc-grid">
                  <div className="calc-item"><div className="calc-value">{fmt(preview.monthly_payment)}</div><div className="calc-label">Monthly Payment</div></div>
                  <div className="calc-item"><div className="calc-value">{fmt(preview.total_interest)}</div><div className="calc-label">Total Interest</div></div>
                  <div className="calc-item"><div className="calc-value">{fmt(preview.admin_fee_amount)}</div><div className="calc-label">Admin Fee</div></div>
                  <div className="calc-item"><div className="calc-value" style={{ color: '#059669' }}>{fmt(preview.profit)}</div><div className="calc-label">Total Profit</div></div>
                  <div className="calc-item"><div className="calc-value">{fmt(preview.total_repayment)}</div><div className="calc-label">Total Repayment</div></div>
                </div>
              </div>
              <div className="card">
                <h3 className="card-title" style={{ marginBottom: 16 }}>📅 Repayment Schedule</h3>
                <div className="table-wrapper"><table className="table"><thead><tr><th>#</th><th>Opening Bal.</th><th>Principal</th><th>Interest</th><th>Payment</th><th>Closing Bal.</th></tr></thead><tbody>
                  {preview.schedule.map(r => <tr key={r.month_number}><td>{r.month_number}</td><td className="amount">{fmt(r.opening_balance)}</td><td className="amount">{fmt(r.principal_component)}</td><td className="amount" style={{ color: '#d97706' }}>{fmt(r.interest_component)}</td><td className="amount">{fmt(r.amount_due)}</td><td className="amount">{fmt(r.closing_balance)}</td></tr>)}
                </tbody></table></div>
              </div>
            </>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>🧮</div>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Calculation Preview</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Fill in amount, rate, and duration to see live reducing balance calculation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
