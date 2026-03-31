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

  const roleBadgeClass = (role) => {
    const map = { admin: 'bg-blue-50 text-blue-600', staff: 'bg-green-50 text-green-600', viewer: 'bg-slate-50 text-slate-500' };
    return map[role] || 'bg-slate-50 text-slate-500';
  };

  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap";
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)]`;
  const btnOutlineSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-transparent border border-border text-text-primary hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50`;
  const btnDangerSm = `${btnBase} px-3.5 py-1.5 text-[13px] bg-danger text-white hover:bg-red-600`;
  const inputBase = "w-full px-3.5 py-2.5 bg-surface border border-border rounded-[10px] text-text-primary text-sm transition-all duration-200 min-h-[44px] focus:outline-none focus:border-primary-400 focus:ring-[3px] focus:ring-primary-500/10 placeholder:text-slate-400 max-md:text-base";

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">User Management</h1>
          <p className="text-sm text-text-muted mt-1">{users.length} total users</p>
        </div>
        {user.role === 'admin' && (
          <button className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`} onClick={openAdd}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            Add User
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div>
      ) : users.length > 0 ? (
        <>
        <div className="bg-surface border border-border rounded-lg overflow-hidden max-md:hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Date Added</th>
                  {user.role === 'admin' && <th className="text-left px-4 py-3 text-[11px] font-medium uppercase tracking-wider text-text-muted border-b border-border whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="transition-all duration-200 hover:bg-muted last:*:border-b-0">
                    <td className="px-4 py-4 border-b border-border text-sm text-text-primary whitespace-nowrap font-semibold">{u.name}</td>
                    <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{u.email}</td>
                    <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide ${roleBadgeClass(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-4 border-b border-border text-sm text-text-secondary whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                    {user.role === 'admin' && (
                      <td className="px-4 py-4 border-b border-border text-sm whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button className={btnOutlineSm} onClick={() => openEdit(u)}>Edit</button>
                          <button className={btnDangerSm} onClick={() => handleDelete(u)}>Delete</button>
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
        <div className="hidden max-md:block">
          {users.map((u) => (
            <div className="bg-surface border border-border rounded-lg p-5 transition-all duration-200 hover:border-primary-200 hover:shadow-card [&+&]:mt-3 max-sm:p-4" key={u.id}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[15px] font-semibold text-text-primary">{u.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">{u.email}</div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide ${roleBadgeClass(u.role)}`}>{u.role}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-0.5"><span className="text-[11px] font-medium text-text-muted uppercase tracking-wide">Date Added</span><span className="text-sm font-semibold text-text-primary">{new Date(u.created_at).toLocaleDateString()}</span></div>
              </div>
              {user.role === 'admin' && (
                <div className="flex gap-2 pt-3 border-t border-border flex-wrap">
                  <button className={`${btnOutlineSm} flex-1 min-w-0`} onClick={() => openEdit(u)}>Edit</button>
                  <button className={`${btnDangerSm} flex-1 min-w-0`} onClick={() => handleDelete(u)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center bg-surface rounded-lg border border-dashed border-border max-md:py-12">
          <div className="text-5xl mb-5 opacity-40">👥</div>
          <h3 className="text-base font-semibold mb-2 text-text-primary">No users found</h3>
          <p className="text-sm text-text-muted mb-6 max-w-[300px]">Create your first team member to get started</p>
          {user.role === 'admin' && <button className={btnPrimary} onClick={openAdd}>Add User</button>}
        </div>
      )}

      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        title={editing ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Full Name *</label>
            <input className={inputBase} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Email Address *</label>
            <input className={inputBase} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Role *</label>
            <select className={`${inputBase} form-select`} value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} required>
              <option value="admin">Administrator</option>
              <option value="staff">Staff</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="mb-5">
            <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
              {editing ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input className={inputBase} type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editing} />
          </div>
          <div className="flex gap-3 justify-end pt-5 border-t border-border max-md:flex-col">
            <button type="button" className={`${btnBase} px-5 py-2.5 bg-muted text-text-primary border border-border hover:bg-border max-md:w-full max-md:min-h-[44px]`} onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className={`${btnPrimary} max-md:w-full max-md:min-h-[44px]`} disabled={saving}>
              {saving ? 'Saving...' : (editing ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
