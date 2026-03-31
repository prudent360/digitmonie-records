import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import api from '../lib/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

const badgeClass = (status) => {
  const map = { active: 'bg-green-100 text-green-800', paid: 'bg-green-100 text-green-800', completed: 'bg-primary-100 text-primary-800', defaulted: 'bg-red-100 text-red-900', overdue: 'bg-red-100 text-red-900', pending: 'bg-amber-100 text-amber-800' };
  return map[status] || 'bg-slate-100 text-slate-700';
};

export default function CustomersPage() {
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', phone: '', address: '', id_number: '' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getCustomers({ search, page, limit: 20 });
      setCustomers(res.customers);
      setPagination(res.pagination);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setPage(1), 300);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd = () => { setEditing(null); setFormData({ full_name: '', email: '', phone: '', address: '', id_number: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setFormData({ full_name: c.full_name || '', email: c.email || '', phone: c.phone || '', address: c.address || '', id_number: c.id_number || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await api.updateCustomer(editing.id, formData); setToast({ message: 'Customer updated', type: 'success' }); }
      else { await api.createCustomer(formData); setToast({ message: 'Customer added', type: 'success' }); }
      setShowModal(false);
      load();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer and all their loans?')) return;
    try { await api.deleteCustomer(id); setToast({ message: 'Customer deleted', type: 'success' }); load(); }
    catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap";
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)]`;
  const btnSecondary = `${btnBase} px-3.5 py-1.5 text-[13px] bg-muted text-text-primary border border-border hover:bg-border`;
  const btnOutline = `${btnBase} px-3.5 py-1.5 text-[13px] bg-transparent border border-border text-text-primary hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50`;
  const btnDanger = `${btnBase} px-3.5 py-1.5 text-[13px] bg-danger text-white hover:bg-red-600`;
  const inputBase = "w-full px-3.5 py-2.5 bg-surface border border-border rounded-[10px] text-text-primary text-sm transition-all duration-200 min-h-[44px] focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/10 placeholder:text-slate-400 max-md:text-base";

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">Customers</h1>
          <p className="text-sm text-text-muted mt-1 max-sm:text-[13px]">{pagination.total || 0} total customers</p>
        </div>
        {user.role !== 'viewer' && <button className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`} onClick={openAdd}><Plus size={16} /> Add Customer</button>}
      </div>

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="relative flex items-center max-w-[400px] w-full">
          <span className="absolute left-3.5 opacity-50 pointer-events-none"><Search size={16} /></span>
          <input className={`${inputBase} pl-10`} placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div> : customers.length > 0 ? (
        <>
          {/* Desktop table view */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden max-md:hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Phone</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Email</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">ID Number</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Date Added</th>
                    <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id} className="transition-all duration-200 hover:bg-muted last:*:border-b-0">
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap"><Link to={`/customers/${c.id}`} className="text-text-primary font-semibold">{c.full_name}</Link></td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{c.phone}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{c.email || '—'}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{c.id_number || '—'}</td>
                      <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{new Date(c.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/customers/${c.id}`} className={btnSecondary}>View</Link>
                          {user.role !== 'viewer' && (
                            <>
                              <button className={btnOutline} onClick={() => openEdit(c)}>Edit</button>
                              <button className={btnDanger} onClick={() => handleDelete(c.id)}>Delete</button>
                            </>
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
          <div className="hidden max-md:block">
            {customers.map((c) => (
              <div className="bg-surface border border-border rounded-lg p-5 transition-all duration-200 hover:border-primary-200 hover:shadow-card [&+&]:mt-3 max-sm:p-4" key={c.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Link to={`/customers/${c.id}`} className="text-[15px] font-semibold text-text-primary">{c.full_name}</Link>
                    <div className="text-xs text-text-muted mt-0.5">Added {new Date(c.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4 max-sm:grid-cols-1">
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Phone</span><span className="text-sm font-semibold text-text-primary">{c.phone}</span></div>
                  <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Email</span><span className="text-sm font-semibold text-text-primary">{c.email || '—'}</span></div>
                  {c.id_number && <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">ID Number</span><span className="text-sm font-semibold text-text-primary">{c.id_number}</span></div>}
                </div>
                <div className="flex gap-2 pt-3 border-t border-border flex-wrap">
                  <Link to={`/customers/${c.id}`} className={`${btnSecondary} flex-1 min-w-0`}>View</Link>
                  {user.role !== 'viewer' && (
                    <>
                      <button className={`${btnOutline} flex-1 min-w-0`} onClick={() => openEdit(c)}>Edit</button>
                      <button className={`${btnDanger} flex-1 min-w-0`} onClick={() => handleDelete(c.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-7 flex-wrap max-md:gap-1">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3.5 py-2 border border-border rounded-md bg-surface text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-muted hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed max-md:px-3 max-md:text-xs">← Prev</button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={`px-3.5 py-2 border rounded-md text-[13px] font-medium cursor-pointer transition-all duration-200 max-md:px-3 max-md:text-xs ${page === p ? 'bg-primary-600 text-white border-primary-600' : 'border-border bg-surface text-text-secondary hover:bg-muted hover:border-border-hover'}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)} className="px-3.5 py-2 border border-border rounded-md bg-surface text-text-secondary text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-muted hover:border-border-hover disabled:opacity-40 disabled:cursor-not-allowed max-md:px-3 max-md:text-xs">Next →</button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border max-md:py-12">
          <div className="mb-5 opacity-40"><Users size={48} /></div>
          <h3 className="text-base font-semibold mb-2 text-text-primary">No customers found</h3>
          <p className="text-sm text-text-muted mb-6 max-w-[300px]">Add your first customer to get started</p>
          <button className={btnPrimary} onClick={openAdd}>Add Customer</button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Full Name *</label>
            <input className={inputBase} value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-5 max-md:grid-cols-1">
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Phone *</label>
              <input className={inputBase} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div className="mb-5">
              <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input className={inputBase} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Address</label>
            <textarea className={`${inputBase} min-h-[100px] resize-y leading-relaxed`} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">ID Number</label>
            <input className={inputBase} value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} />
          </div>
          <div className="flex gap-3 justify-end pt-5 border-t border-border max-md:flex-col">
            <button type="button" className={`${btnBase} px-5 py-2.5 bg-muted text-text-primary border border-border hover:bg-border max-md:w-full max-md:min-h-[44px]`} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`} disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add Customer')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
