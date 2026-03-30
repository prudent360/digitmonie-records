import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

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

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">{pagination.total || 0} total customers</p>
        </div>
        {user.role !== 'viewer' && <button className="btn btn-primary" onClick={openAdd}>➕ Add Customer</button>}
      </div>

      <div className="toolbar">
        <div className="search-bar" style={{ maxWidth: 400, width: '100%' }}>
          <span className="search-icon">🔍</span>
          <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner"></div></div> : customers.length > 0 ? (
        <>
          {/* Desktop table view */}
          <div className="card-table desktop-table">
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>ID Number</th>
                    <th>Date Added</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/customers/${c.id}`} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {c.full_name}
                        </Link>
                      </td>
                      <td>{c.phone}</td>
                      <td>{c.email || '—'}</td>
                      <td>{c.id_number || '—'}</td>
                      <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="action-buttons">
                          <Link to={`/customers/${c.id}`} className="btn btn-secondary btn-sm">View</Link>
                          {user.role !== 'viewer' && (
                            <>
                              <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
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
          <div className="mobile-cards">
            {customers.map((c) => (
              <div className="mobile-card" key={c.id}>
                <div className="mobile-card-header">
                  <div>
                    <Link to={`/customers/${c.id}`} className="mobile-card-title" style={{ color: 'var(--text-primary)' }}>
                      {c.full_name}
                    </Link>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      Added {new Date(c.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="mobile-card-body">
                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Phone</span>
                    <span className="mobile-card-value">{c.phone}</span>
                  </div>
                  <div className="mobile-card-field">
                    <span className="mobile-card-label">Email</span>
                    <span className="mobile-card-value">{c.email || '—'}</span>
                  </div>
                  {c.id_number && (
                    <div className="mobile-card-field">
                      <span className="mobile-card-label">ID Number</span>
                      <span className="mobile-card-value">{c.id_number}</span>
                    </div>
                  )}
                </div>
                <div className="mobile-card-footer">
                  <Link to={`/customers/${c.id}`} className="btn btn-secondary btn-sm">View</Link>
                  {user.role !== 'viewer' && (
                    <>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
              {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next →</button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No customers found</h3>
          <p>Add your first customer to get started</p>
          <button className="btn btn-primary" onClick={openAdd}>Add Customer</button>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input className="form-input" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone *</label>
              <input className="form-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea className="form-textarea" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">ID Number</label>
            <input className="form-input" value={formData.id_number} onChange={(e) => setFormData({ ...formData, id_number: e.target.value })} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add Customer')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
