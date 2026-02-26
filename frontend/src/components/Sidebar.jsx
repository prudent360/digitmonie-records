import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  PlusCircle, 
  ClipboardList, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/loans', label: 'Loans', icon: Wallet },
  { to: '/loans/new', label: 'New Loan', icon: PlusCircle, manageOnly: true },
  { to: '/loan-types', label: 'Loan Types', icon: ClipboardList, manageOnly: true },
  { to: '/users', label: 'Users', icon: ShieldCheck, adminOnly: true },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('dm_token');
    localStorage.removeItem('dm_user');
    navigate('/login');
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">💎</span>
          <div>
            <h1 className="brand-name">DigitMonie</h1>
            <span className="brand-sub">RECORDS</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-label">MAIN MENU</div>
          {menuItems.filter(item => {
            if (item.adminOnly) return user.role === 'admin';
            if (item.manageOnly) return user.role !== 'viewer';
            return true;
          }).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <item.icon className="nav-icon" size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">{user.name?.charAt(0) || 'A'}</div>
            <div>
              <div className="admin-name">{user.name || 'Admin'}</div>
              <div className="admin-role">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Administrator'}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
