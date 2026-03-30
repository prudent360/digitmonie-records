import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function UsersPage() {
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'staff' });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getUsers();
      setUsers(res.users || []);
    } catch (err) { 
      console.error(err); 
      setToast({ message: err.message, type: 'error' });
    }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { 
    setEditing(null); 
    setFormData({ name: '', email: '', password: '', role: 'staff' }); 
    setShowModal(true); 
  };

  const openEdit = (u) => { 
    setEditing(u); 
    setFormData({ name: u.name, email: u.email, password: '', role: u.role }); 
    setShowModal(true); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { 
        await api.updateUser(editing.id, formData); 
        setToast({ message: 'User updated successfully', type: 'success' }); 
      }
      else { 
        await api.createUser(formData); 
        setToast({ message: 'User created successfully', type: 'success' }); 
      }
      setShowModal(false);
      load();
    } catch (err) { 
      setToast({ message: err.message, type: 'error' }); 
    }
    finally { setSaving(false); }
  };

  const handleDelete = async (u) => {
    if (!confirm(`Delete user "${u.name}"?`)) return;
    try { 
      await api.deleteUser(u.id); 
      setToast({ message: 'User deleted successfully', type: 'success' }); 
      load(); 
    }
    catch (err) { 
      setToast({ message: err.message, type: 'error' }); 
    }
  };

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} total users</p>
        </div>
        {user.role === 'admin' && (
          <button className="btn btn-primary" onClick={openAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Add User
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : users.length > 0 ? (
        <>
        <div className="card-table desktop-table">
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Date Added</th>
                  {user.role === 'admin' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    {user.role === 'admin' && (
                      <td>
                        <div className="action-buttons">
                          <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile card view */}
        <div className="mobile-cards">
          {users.map((u) => (
            <div className="mobile-card" key={u.id}>
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">{u.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                </div>
                <span className={`role-badge ${u.role}`}>{u.role}</span>
              </div>
              <div className="mobile-card-body">
                <div className="mobile-card-field">
                  <span className="mobile-card-label">Date Added</span>
                  <span className="mobile-card-value">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              {user.role === 'admin' && (
                <div className="mobile-card-footer">
                  <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No users found</h3>
          <p>Create your first team member to get started</p>
          {user.role === 'admin' && <button className="btn btn-primary" onClick={openAdd}>Add User</button>}
        </div>
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editing ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              className="form-input" 
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input 
              className="form-input" 
              type="email"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Role *</label>
            <select 
              className="form-select" 
              value={formData.role} 
              onChange={(e) => setFormData({ ...formData, role: e.target.value })} 
              required
            >
              <option value="admin">Administrator</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">
              {editing ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input 
              className="form-input" 
              type="password"
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              required={!editing}
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (editing ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
