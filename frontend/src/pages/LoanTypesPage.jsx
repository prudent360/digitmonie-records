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

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div><h1 className="page-title">Loan Types</h1><p className="page-subtitle">Manage loan categories and templates</p></div>
        <button className="btn btn-primary" onClick={openAdd}>➕ Add Loan Type</button>
      </div>

      {loanTypes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {loanTypes.map((t) => (
            <div key={t.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600 }}>{t.name}</h3>
                <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}>Edit</button><button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>Delete</button></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="detail-item"><span className="detail-label">Interest Rate</span><span className="detail-value" style={{ color: 'var(--primary-light)' }}>{t.interest_rate}%</span></div>
                <div className="detail-item"><span className="detail-label">Period</span><span className="detail-value">{t.interest_period}</span></div>
                <div className="detail-item"><span className="detail-label">Duration</span><span className="detail-value">{t.duration_months} months</span></div>
                <div className="detail-item"><span className="detail-label">Admin Fee</span><span className="detail-value">{t.admin_fee_percent}%</span></div>
              </div>
            </div>
          ))}
        </div>
      ) : <div className="empty-state"><div className="empty-icon">📋</div><h3>No loan types yet</h3><p>Create templates for quick loan setup</p><button className="btn btn-primary" onClick={openAdd}>Add Loan Type</button></div>}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Loan Type' : 'Add Loan Type'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Name *</label><input className="form-input" placeholder="e.g. Personal Loan" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required /></div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Interest Rate (%) *</label><input className="form-input" type="number" step="0.01" min="0" value={formData.interest_rate} onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Interest Period</label><select className="form-select" value={formData.interest_period} onChange={(e) => setFormData({ ...formData, interest_period: e.target.value })}><option value="annually">Annually</option><option value="monthly">Monthly</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Duration (months) *</label><input className="form-input" type="number" min="1" value={formData.duration_months} onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })} required /></div>
            <div className="form-group"><label className="form-label">Admin Fee (%)</label><input className="form-input" type="number" step="0.01" min="0" value={formData.admin_fee_percent} onChange={(e) => setFormData({ ...formData, admin_fee_percent: e.target.value })} /></div>
          </div>
          <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Create')}</button></div>
        </form>
      </Modal>
    </div>
  );
}
