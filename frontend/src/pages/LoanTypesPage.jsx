import { useState, useEffect } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function LoanTypesPage() {
  const [loanTypes, setLoanTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', interest_rate: '', interest_period: 'annually', duration_months: '', admin_fee_percent: '0' });

  useEffect(() => { load(); }, []);

  const load = async () => { try { const r = await api.getLoanTypes(); setLoanTypes(r.loan_types); } catch (e) { console.error(e); } finally { setLoading(false); } };

  const openAdd = () => { setEditing(null); setFormData({ name: '', interest_rate: '', interest_period: 'annually', duration_months: '', admin_fee_percent: '0' }); setShowModal(true); };
  const openEdit = (t) => { setEditing(t); setFormData({ name: t.name, interest_rate: t.interest_rate, interest_period: t.interest_period, duration_months: t.duration_months, admin_fee_percent: t.admin_fee_percent }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) { await api.updateLoanType(editing.id, formData); setToast({ message: 'Loan type updated', type: 'success' }); }
      else { await api.createLoanType(formData); setToast({ message: 'Loan type created', type: 'success' }); }
      setShowModal(false); load();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this loan type?')) return;
    try { await api.deleteLoanType(id); setToast({ message: 'Deleted', type: 'success' }); load(); }
    catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap";
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)]`;
  const btnSecondarySm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-muted text-text-primary border border-border hover:bg-border`;
  const btnDangerSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-danger text-white hover:bg-red-600`;
  const inputBase = "w-full px-3.5 py-2.5 bg-surface border border-border rounded-[10px] text-text-primary text-sm transition-all duration-200 min-h-[44px] focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/10 placeholder:text-slate-400 max-md:text-base";

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div>;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div><h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">Loan Types</h1><p className="text-sm text-text-muted mt-1">Manage loan categories and templates</p></div>
        <button className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`} onClick={openAdd}>➕ Add Loan Type</button>
      </div>

      {loanTypes.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
          {loanTypes.map((t) => (
            <div key={t.id} className="bg-surface border border-border rounded-lg p-7 transition-all duration-200 max-md:p-5 max-sm:p-4">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-text-primary">{t.name}</h3>
                <div className="flex gap-2"><button className={btnSecondarySm} onClick={() => openEdit(t)}>Edit</button><button className={btnDangerSm} onClick={() => handleDelete(t.id)}>Delete</button></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Interest Rate</span><span className="text-base font-semibold text-text-primary">{t.interest_rate}%</span></div>
                <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Period</span><span className="text-base font-semibold text-text-primary">{t.interest_period}</span></div>
                <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Duration</span><span className="text-base font-semibold text-text-primary">{t.duration_months} months</span></div>
                <div className="flex flex-col gap-1.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">Admin Fee</span><span className="text-base font-semibold text-text-primary">{t.admin_fee_percent}%</span></div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border max-md:py-12"><div className="text-5xl mb-5 opacity-40">📋</div><h3 className="text-base font-semibold mb-2 text-text-primary">No loan types yet</h3><p className="text-sm text-text-muted mb-6 max-w-[300px]">Create templates for quick loan setup</p><button className={btnPrimary} onClick={openAdd}>Add Loan Type</button></div>}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Loan Type' : 'Add Loan Type'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Name *</label><input className={inputBase} placeholder="e.g. Personal Loan" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Interest Rate (%) *</label><input className={inputBase} type="number" step="0.01" min="0" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} required /></div>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Interest Period</label><select className={`${inputBase} form-select`} value={formData.interest_period} onChange={(e) => setFormData({ ...formData, interest_period: e.target.value })}><option value="annually">Annually</option><option value="monthly">Monthly</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Duration (months) *</label><input className={inputBase} type="number" min="1" value={formData.duration_months} onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })} required /></div>
            <div className="mb-5"><label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Admin Fee (%)</label><input className={inputBase} type="number" step="0.01" min="0" value={formData.admin_fee_percent} onChange={(e) => setFormData({ ...formData, admin_fee_percent: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 justify-end pt-5 border-t border-border max-md:flex-col">
            <button type="button" className={`${btnBase} px-5 py-2.5 bg-muted text-text-primary border border-border hover:bg-border max-md:w-full max-md:min-h-[44px]`} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
